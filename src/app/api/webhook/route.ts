import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

// Rate limiting - simple in-memory store (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10; // 10 requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return true;
    }

    if (record.count >= RATE_LIMIT) {
        return false;
    }

    record.count++;
    return true;
}

// Post payload after normalization
interface PostPayload {
    title: string;
    content: string;
    slug: string;
    metaDescription: string;
    featuredImage?: string;
    author?: string;
    tags?: string[];
    publishedAt?: string;
}

// Generate slug from title
function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[äÄ]/g, 'ae')
        .replace(/[öÖ]/g, 'oe')
        .replace(/[üÜ]/g, 'ue')
        .replace(/[ß]/g, 'ss')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 60);
}

// Normalize Rankenstein payload to our format
function normalizePayload(data: Record<string, unknown>): Record<string, unknown> {
    const normalized: Record<string, unknown> = { ...data };

    // Map Rankenstein field names to our expected format
    // Rankenstein sends: title, htmlContent, markdown, coverImageUrl, seoMetadata, schemaJsonLd, keywords, wordCountAndReadingTime

    // Content: prefer htmlContent, fall back to markdown, then content
    if (!normalized.content) {
        if (data.htmlContent && typeof data.htmlContent === 'string') {
            normalized.content = data.htmlContent;
        } else if (data.markdown && typeof data.markdown === 'string') {
            normalized.content = data.markdown;
        }
    }

    // SEO Metadata: extract metaDescription and slug from seoMetadata object
    if (data.seoMetadata && typeof data.seoMetadata === 'object') {
        const seo = data.seoMetadata as Record<string, unknown>;
        if (!normalized.metaDescription && seo.metaDescription) {
            normalized.metaDescription = seo.metaDescription;
        }
        if (!normalized.metaDescription && seo.description) {
            normalized.metaDescription = seo.description;
        }
        if (!normalized.slug && seo.slug) {
            normalized.slug = seo.slug;
        }
        if (!normalized.slug && seo.handle) {
            normalized.slug = seo.handle;
        }
    }

    // Featured image: map coverImageUrl or coverImage
    if (!normalized.featuredImage) {
        if (data.coverImageUrl && typeof data.coverImageUrl === 'string') {
            normalized.featuredImage = data.coverImageUrl;
        } else if (data.coverImage && typeof data.coverImage === 'string') {
            normalized.featuredImage = data.coverImage;
        }
    }

    // Tags: map keywords array
    if (!normalized.tags && data.keywords) {
        if (Array.isArray(data.keywords)) {
            normalized.tags = data.keywords;
        } else if (typeof data.keywords === 'string') {
            normalized.tags = data.keywords.split(',').map((k: string) => k.trim());
        }
    }

    // Generate slug from title if not provided
    if (!normalized.slug && normalized.title && typeof normalized.title === 'string') {
        normalized.slug = generateSlug(normalized.title);
    }

    // Generate meta description from content if not provided
    if (!normalized.metaDescription && normalized.content && typeof normalized.content === 'string') {
        // Strip HTML tags and take first 160 chars
        const textContent = normalized.content.replace(/<[^>]*>/g, '').trim();
        normalized.metaDescription = textContent.substring(0, 160) + (textContent.length > 160 ? '...' : '');
    }

    return normalized;
}

function validatePayload(
    data: unknown
): { valid: true; payload: PostPayload } | { valid: false; error: string } {
    if (!data || typeof data !== "object") {
        return { valid: false, error: "Invalid payload: expected JSON object" };
    }

    // First normalize the payload to handle different field names
    const normalized = normalizePayload(data as Record<string, unknown>);

    // Required fields
    if (!normalized.title || typeof normalized.title !== "string") {
        return { valid: false, error: "Missing or invalid required field: title" };
    }
    if (!normalized.content || typeof normalized.content !== "string") {
        return {
            valid: false,
            error: "Missing or invalid required field: content (or htmlContent/markdown)",
        };
    }
    if (!normalized.slug || typeof normalized.slug !== "string") {
        return { valid: false, error: "Missing or invalid required field: slug (auto-generated from title if not provided)" };
    }
    if (!normalized.metaDescription || typeof normalized.metaDescription !== "string") {
        return {
            valid: false,
            error: "Missing or invalid required field: metaDescription (auto-generated from content if not provided)",
        };
    }

    // Validate slug format (lowercase, hyphens only)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(normalized.slug as string)) {
        // Try to fix the slug
        const fixedSlug = generateSlug(normalized.slug as string);
        if (fixedSlug && slugRegex.test(fixedSlug)) {
            normalized.slug = fixedSlug;
        } else {
            return {
                valid: false,
                error: "Invalid slug format: must be lowercase with hyphens (e.g., my-blog-post)",
            };
        }
    }

    // Build validated payload
    const validPayload: PostPayload = {
        title: normalized.title as string,
        content: normalized.content as string,
        slug: normalized.slug as string,
        metaDescription: normalized.metaDescription as string,
    };

    if (normalized.featuredImage && typeof normalized.featuredImage === "string") {
        validPayload.featuredImage = normalized.featuredImage;
    }

    if (normalized.author && typeof normalized.author === "string") {
        validPayload.author = normalized.author;
    }

    if (normalized.tags && Array.isArray(normalized.tags)) {
        validPayload.tags = normalized.tags.filter(t => typeof t === "string");
    }

    if (normalized.publishedAt && typeof normalized.publishedAt === "string") {
        const date = new Date(normalized.publishedAt);
        if (!isNaN(date.getTime())) {
            validPayload.publishedAt = normalized.publishedAt;
        }
    }

    return { valid: true, payload: validPayload };
}

export async function POST(request: NextRequest) {
    // Get client IP for rate limiting
    const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";

    // Check rate limit
    if (!checkRateLimit(ip)) {
        return NextResponse.json(
            { success: false, error: "Rate limit exceeded. Max 10 requests/minute." },
            { status: 429 }
        );
    }

    // Verify authentication
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.WEBHOOK_SECRET;

    if (!expectedToken) {
        console.error("WEBHOOK_SECRET environment variable is not set");
        return NextResponse.json(
            { success: false, error: "Server configuration error" },
            { status: 500 }
        );
    }

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(
            { success: false, error: "Missing or invalid Authorization header" },
            { status: 401 }
        );
    }

    const token = authHeader.substring(7);
    if (token !== expectedToken) {
        return NextResponse.json(
            { success: false, error: "Invalid authentication token" },
            { status: 403 }
        );
    }

    // Check content length (5MB limit)
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
        return NextResponse.json(
            { success: false, error: "Payload too large. Maximum size is 5MB." },
            { status: 413 }
        );
    }

    try {
        // Parse and validate payload
        const body = await request.json();

        // Log incoming payload for debugging
        console.log("Webhook received payload keys:", Object.keys(body));

        const validation = validatePayload(body);

        if (!validation.valid) {
            console.error("Webhook validation failed:", validation.error);
            return NextResponse.json(
                { success: false, error: validation.error },
                { status: 400 }
            );
        }

        const { payload } = validation;

        // Prepare post data
        const postData = {
            title: payload.title,
            slug: payload.slug,
            content: payload.content,
            metaDescription: payload.metaDescription,
            featuredImage: payload.featuredImage,
            author: payload.author,
            tags: payload.tags || [],
            publishedAt: payload.publishedAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        // Ensure posts directory exists
        const postsDirectory = path.join(process.cwd(), "content/posts");
        if (!fs.existsSync(postsDirectory)) {
            fs.mkdirSync(postsDirectory, { recursive: true });
        }

        // Save post to JSON file
        const filePath = path.join(postsDirectory, `${payload.slug}.json`);
        fs.writeFileSync(filePath, JSON.stringify(postData, null, 2), "utf8");

        console.log("Webhook saved post:", payload.slug);

        // Trigger ISR revalidation for all locales
        revalidatePath("/blog");
        revalidatePath(`/blog/${payload.slug}`);
        revalidatePath("/de/blog");
        revalidatePath(`/de/blog/${payload.slug}`);
        revalidatePath("/en/blog");
        revalidatePath(`/en/blog/${payload.slug}`);
        revalidatePath("/fr/blog");
        revalidatePath(`/fr/blog/${payload.slug}`);

        return NextResponse.json({
            success: true,
            slug: `/blog/${payload.slug}`,
            message: "Post created successfully",
        });
    } catch (error) {
        console.error("Webhook error:", error);

        if (error instanceof SyntaxError) {
            return NextResponse.json(
                { success: false, error: "Invalid JSON payload" },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

// Only allow POST method
export async function GET() {
    return NextResponse.json(
        { success: false, error: "Method not allowed. Use POST." },
        { status: 405 }
    );
}

export async function PUT() {
    return NextResponse.json(
        { success: false, error: "Method not allowed. Use POST." },
        { status: 405 }
    );
}

export async function DELETE() {
    return NextResponse.json(
        { success: false, error: "Method not allowed. Use POST." },
        { status: 405 }
    );
}
