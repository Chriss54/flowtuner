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

// Validate the post payload
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

function validatePayload(
    data: unknown
): { valid: true; payload: PostPayload } | { valid: false; error: string } {
    if (!data || typeof data !== "object") {
        return { valid: false, error: "Invalid payload: expected JSON object" };
    }

    const payload = data as Record<string, unknown>;

    // Required fields
    if (!payload.title || typeof payload.title !== "string") {
        return { valid: false, error: "Missing or invalid required field: title" };
    }
    if (!payload.content || typeof payload.content !== "string") {
        return {
            valid: false,
            error: "Missing or invalid required field: content",
        };
    }
    if (!payload.slug || typeof payload.slug !== "string") {
        return { valid: false, error: "Missing or invalid required field: slug" };
    }
    if (!payload.metaDescription || typeof payload.metaDescription !== "string") {
        return {
            valid: false,
            error: "Missing or invalid required field: metaDescription",
        };
    }

    // Validate slug format (lowercase, hyphens only)
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (!slugRegex.test(payload.slug)) {
        return {
            valid: false,
            error:
                "Invalid slug format: must be lowercase with hyphens (e.g., my-blog-post)",
        };
    }

    // Optional fields with type checking
    const validPayload: PostPayload = {
        title: payload.title,
        content: payload.content,
        slug: payload.slug,
        metaDescription: payload.metaDescription,
    };

    if (payload.featuredImage) {
        if (typeof payload.featuredImage !== "string") {
            return {
                valid: false,
                error: "Invalid field type: featuredImage must be a string",
            };
        }
        validPayload.featuredImage = payload.featuredImage;
    }

    if (payload.author) {
        if (typeof payload.author !== "string") {
            return {
                valid: false,
                error: "Invalid field type: author must be a string",
            };
        }
        validPayload.author = payload.author;
    }

    if (payload.tags) {
        if (
            !Array.isArray(payload.tags) ||
            !payload.tags.every((t) => typeof t === "string")
        ) {
            return {
                valid: false,
                error: "Invalid field type: tags must be an array of strings",
            };
        }
        validPayload.tags = payload.tags;
    }

    if (payload.publishedAt) {
        if (typeof payload.publishedAt !== "string") {
            return {
                valid: false,
                error: "Invalid field type: publishedAt must be an ISO 8601 string",
            };
        }
        // Validate ISO 8601 format
        const date = new Date(payload.publishedAt);
        if (isNaN(date.getTime())) {
            return {
                valid: false,
                error: "Invalid date format: publishedAt must be a valid ISO 8601 date",
            };
        }
        validPayload.publishedAt = payload.publishedAt;
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
        const validation = validatePayload(body);

        if (!validation.valid) {
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

        // Trigger ISR revalidation
        revalidatePath("/blog");
        revalidatePath(`/blog/${payload.slug}`);

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
