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

    // Featured image: map coverImageUrl, coverImage, image, cover, or from seoMetadata
    if (!normalized.featuredImage) {
        if (data.coverImageUrl && typeof data.coverImageUrl === 'string') {
            normalized.featuredImage = data.coverImageUrl;
        } else if (data.coverImage && typeof data.coverImage === 'string') {
            normalized.featuredImage = data.coverImage;
        } else if (data.cover && typeof data.cover === 'string') {
            normalized.featuredImage = data.cover;
        } else if (data.image && typeof data.image === 'string') {
            normalized.featuredImage = data.image;
        } else if (data.featuredImage && typeof data.featuredImage === 'string') {
            normalized.featuredImage = data.featuredImage;
        }
    }

    // Also check seoMetadata for image if not found
    if (!normalized.featuredImage && data.seoMetadata && typeof data.seoMetadata === 'object') {
        const seo = data.seoMetadata as Record<string, unknown>;
        if (seo.image && typeof seo.image === 'string') {
            normalized.featuredImage = seo.image;
        } else if (seo.coverImage && typeof seo.coverImage === 'string') {
            normalized.featuredImage = seo.coverImage;
        } else if (seo.ogImage && typeof seo.ogImage === 'string') {
            normalized.featuredImage = seo.ogImage;
        }
    }

    // Try to extract cover image from schema.org JSON-LD in content
    if (!normalized.featuredImage && normalized.content && typeof normalized.content === 'string') {
        const schemaMatch = normalized.content.match(/"image":\s*\{\s*"@type":\s*"ImageObject",\s*"url":\s*"([^"]+)"/);
        if (schemaMatch && schemaMatch[1]) {
            normalized.featuredImage = schemaMatch[1];
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

// Translate post content using OpenAI
interface TranslatedPost {
    title: string;
    content: string;
    metaDescription: string;
    tags: string[];
}

async function translatePost(
    post: { title: string; content: string; metaDescription: string; tags: string[] },
    targetLang: 'en' | 'fr'
): Promise<TranslatedPost | null> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.warn("OPENAI_API_KEY not set, skipping translation");
        return null;
    }

    const langName = targetLang === 'en' ? 'English' : 'French';

    const prompt = `Translate the following blog post from German to ${langName}. 
Keep all HTML tags intact. Preserve the original formatting and structure.
Return ONLY a valid JSON object with these fields: title, content, metaDescription, tags (as array)

Blog post to translate:
Title: ${post.title}
Meta Description: ${post.metaDescription}
Tags: ${post.tags.join(', ')}
Content (HTML):
${post.content}`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are a professional translator. Translate blog posts accurately while preserving HTML formatting. Always respond with valid JSON only, no markdown code blocks.`
                    },
                    { role: 'user', content: prompt }
                ],
                temperature: 0.3,
                max_tokens: 16000,
            }),
        });

        if (!response.ok) {
            const error = await response.json();
            console.error("OpenAI API error:", error);
            return null;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
            console.error("Empty response from OpenAI");
            return null;
        }

        // Parse the JSON response (handle potential markdown code blocks)
        let jsonContent = content.trim();
        if (jsonContent.startsWith('```')) {
            jsonContent = jsonContent.replace(/```json?\n?/g, '').replace(/```$/g, '').trim();
        }

        const translated = JSON.parse(jsonContent) as TranslatedPost;
        console.log(`Successfully translated post to ${langName}`);
        return translated;
    } catch (error) {
        console.error(`Translation to ${langName} failed:`, error);
        return null;
    }
}

// Create translated versions and save to GitHub
async function createTranslatedPosts(
    originalPost: {
        slug: string;
        content: string;
        title: string;
        metaDescription: string;
        tags: string[];
        featuredImage?: string;
        author?: string;
        publishedAt: string;
        updatedAt: string;
    }
): Promise<void> {
    const locales: Array<'en' | 'fr'> = ['en', 'fr'];

    for (const locale of locales) {
        try {
            const translated = await translatePost(
                {
                    title: originalPost.title,
                    content: originalPost.content,
                    metaDescription: originalPost.metaDescription,
                    tags: originalPost.tags,
                },
                locale
            );

            if (translated) {
                const translatedPost = {
                    ...originalPost,
                    title: translated.title,
                    content: translated.content,
                    metaDescription: translated.metaDescription,
                    tags: translated.tags,
                    slug: `${originalPost.slug}-${locale}`,
                };

                const result = await savePostToGitHub(translatedPost.slug, translatedPost);
                if (result.success) {
                    console.log(`Created ${locale.toUpperCase()} translation: ${translatedPost.slug}`);
                } else {
                    console.error(`Failed to save ${locale.toUpperCase()} translation:`, result.error);
                }
            }
        } catch (error) {
            console.error(`Failed to create ${locale.toUpperCase()} translation:`, error);
        }
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

        // Create translated versions SYNCHRONOUSLY (wait for completion)
        // This ensures translations complete before Vercel function ends
        console.log("Starting translations for:", payload.slug);
        let translationResults = { en: false, fr: false };

        try {
            const apiKey = process.env.OPENAI_API_KEY;
            if (apiKey) {
                console.log("OPENAI_API_KEY found, starting translations...");
                await createTranslatedPosts(postData);
                translationResults = { en: true, fr: true };
                console.log("Translations completed successfully");
            } else {
                console.warn("OPENAI_API_KEY not set in environment, skipping translations");
            }
        } catch (err) {
            console.error("Translation process failed:", err);
        }

        // Trigger ISR revalidation for all locales
        revalidatePath("/blog");
        revalidatePath(`/blog/${payload.slug}`);
        revalidatePath("/de/blog");
        revalidatePath(`/de/blog/${payload.slug}`);
        revalidatePath("/en/blog");
        revalidatePath(`/en/blog/${payload.slug}`);
        revalidatePath(`/en/blog/${payload.slug}-en`);
        revalidatePath("/fr/blog");
        revalidatePath(`/fr/blog/${payload.slug}`);
        revalidatePath(`/fr/blog/${payload.slug}-fr`);

        return NextResponse.json({
            success: true,
            slug: `/blog/${payload.slug}`,
            message: "Post created successfully and committed to GitHub. Translations being generated.",
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
