import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

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

    const normalized = normalizePayload(data as Record<string, unknown>);

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
        return { valid: false, error: "Missing or invalid required field: slug" };
    }
    if (!normalized.metaDescription || typeof normalized.metaDescription !== "string") {
        return {
            valid: false,
            error: "Missing or invalid required field: metaDescription",
        };
    }

    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(normalized.slug as string)) {
        const fixedSlug = generateSlug(normalized.slug as string);
        if (fixedSlug && slugRegex.test(fixedSlug)) {
            normalized.slug = fixedSlug;
        } else {
            return {
                valid: false,
                error: "Invalid slug format: must be lowercase with hyphens",
            };
        }
    }

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

// Save post to GitHub repository via API
async function savePostToGitHub(slug: string, postData: object): Promise<{ success: boolean; error?: string }> {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER || 'Chriss54';
    const repo = process.env.GITHUB_REPO || 'flowtuner';
    const branch = process.env.GITHUB_BRANCH || 'main';
    const filePath = `content/posts/${slug}.json`;

    if (!token) {
        console.error("GITHUB_TOKEN environment variable is not set");
        return { success: false, error: "GitHub token not configured" };
    }

    const content = Buffer.from(JSON.stringify(postData, null, 2)).toString('base64');
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

    try {
        // Check if file already exists (to get SHA for update)
        let sha: string | undefined;
        try {
            const existingFile = await fetch(apiUrl, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'flowtuner-webhook',
                },
            });
            if (existingFile.ok) {
                const data = await existingFile.json();
                sha = data.sha;
            }
        } catch {
            // File doesn't exist, that's fine
        }

        // Create or update file
        const response = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'flowtuner-webhook',
            },
            body: JSON.stringify({
                message: `Add blog post: ${slug}`,
                content: content,
                branch: branch,
                ...(sha && { sha }), // Include SHA if updating existing file
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error("GitHub API error:", errorData);
            return { success: false, error: `GitHub API error: ${errorData.message || response.statusText}` };
        }

        console.log("Successfully committed post to GitHub:", slug);
        return { success: true };
    } catch (error) {
        console.error("GitHub API request failed:", error);
        return { success: false, error: "Failed to commit to GitHub" };
    }
}

export async function POST(request: NextRequest) {
    const ip =
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        request.headers.get("x-real-ip") ||
        "unknown";

    if (!checkRateLimit(ip)) {
        return NextResponse.json(
            { success: false, error: "Rate limit exceeded. Max 10 requests/minute." },
            { status: 429 }
        );
    }

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

    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) {
        return NextResponse.json(
            { success: false, error: "Payload too large. Maximum size is 5MB." },
            { status: 413 }
        );
    }

    try {
        const body = await request.json();

        console.log("Webhook received payload keys:", Object.keys(body));

        // Handle Rankenstein test connection requests
        if (body.test === true || body.test === "true" || (body.test && !body.title && !body.htmlContent)) {
            console.log("Webhook test connection successful");
            return NextResponse.json({
                success: true,
                message: "Test connection successful! Webhook is ready to receive articles.",
            });
        }

        const validation = validatePayload(body);

        if (!validation.valid) {
            console.error("Webhook validation failed:", validation.error);
            return NextResponse.json(
                { success: false, error: validation.error },
                { status: 400 }
            );
        }

        const { payload } = validation;

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

        // Save to GitHub instead of local filesystem
        const githubResult = await savePostToGitHub(payload.slug, postData);

        if (!githubResult.success) {
            return NextResponse.json(
                { success: false, error: githubResult.error || "Failed to save post" },
                { status: 500 }
            );
        }

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
            message: "Post created successfully and committed to GitHub",
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
