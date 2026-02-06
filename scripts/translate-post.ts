import dotenv from "dotenv";
dotenv.config();

import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

interface BlogPost {
    title: string;
    slug: string;
    originalSlug?: string; // Reference to original German slug for mapping
    content: string;
    metaDescription: string;
    featuredImage?: string;
    author?: string;
    tags: string[];
    publishedAt: string;
    updatedAt: string;
}

interface TranslatedPost {
    title: string;
    slug: string;
    content: string;
    metaDescription: string;
    tags: string[];
}

// Generate slug from title
function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 60);
}

async function translatePost(
    post: { title: string; content: string; metaDescription: string; tags: string[] },
    targetLang: "en" | "fr"
): Promise<TranslatedPost | null> {
    const langName = targetLang === "en" ? "English" : "French";

    console.log(`Translating to ${langName}...`);

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content:
                    "You are a professional translator. Translate blog posts accurately while preserving HTML formatting. Always respond with valid JSON only, no markdown code blocks.",
            },
            {
                role: "user",
                content: `Translate the following blog post from German to ${langName}. 
Keep all HTML tags intact. Preserve the original formatting and structure.
Return ONLY a valid JSON object with these fields: title, slug (URL-friendly translated title in lowercase with hyphens), content, metaDescription, tags (as array)

Blog post to translate:
Title: ${post.title}
Meta Description: ${post.metaDescription}
Tags: ${post.tags.join(", ")}
Content (HTML):
${post.content}`,
            },
        ],
        temperature: 0.3,
        max_tokens: 16000,
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) {
        console.error("Empty response from OpenAI");
        return null;
    }

    let jsonContent = content.trim();
    if (jsonContent.startsWith("```")) {
        jsonContent = jsonContent.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
    }

    try {
        const translated = JSON.parse(jsonContent) as TranslatedPost;
        // Ensure slug is properly formatted
        if (!translated.slug || translated.slug.length < 5) {
            translated.slug = generateSlug(translated.title);
        }
        console.log(`Successfully translated to ${langName} with slug: ${translated.slug}`);
        return translated;
    } catch (e) {
        console.error("Failed to parse translation response:", e);
        return null;
    }
}

interface SlugMapping {
    [originalSlug: string]: {
        en?: string;
        fr?: string;
    };
}

async function main() {
    const postsDir = path.join(process.cwd(), "content/posts");
    const mappingPath = path.join(process.cwd(), "content/slug-mapping.json");
    const originalSlug = "ki-agenten-im-mittelstand-definition-nutzen-integration";
    const originalPath = path.join(postsDir, `${originalSlug}.json`);

    // Load or create slug mapping
    let slugMapping: SlugMapping = {};
    if (fs.existsSync(mappingPath)) {
        slugMapping = JSON.parse(fs.readFileSync(mappingPath, "utf8"));
    }

    // Read original post
    const originalPost: BlogPost = JSON.parse(fs.readFileSync(originalPath, "utf8"));

    // Add featured image if missing
    if (!originalPost.featuredImage) {
        originalPost.featuredImage =
            "https://pub-ea20a57063b149ca975449d6f181fbab.r2.dev/covers/2026/02/cover-wie-sie-ki-workflows-f-r-messbaren-roi-im-km-1770340117246-zzqlmx.webp";
        fs.writeFileSync(originalPath, JSON.stringify(originalPost, null, 2), "utf8");
        console.log("Added featuredImage to original post");
    }

    // Delete old translations with German slug
    const oldEnPath = path.join(postsDir, `${originalSlug}-en.json`);
    const oldFrPath = path.join(postsDir, `${originalSlug}-fr.json`);
    if (fs.existsSync(oldEnPath)) {
        fs.unlinkSync(oldEnPath);
        console.log("Deleted old English translation with German slug");
    }
    if (fs.existsSync(oldFrPath)) {
        fs.unlinkSync(oldFrPath);
        console.log("Deleted old French translation with German slug");
    }

    // Initialize mapping for this slug
    if (!slugMapping[originalSlug]) {
        slugMapping[originalSlug] = {};
    }

    // Translate to English
    const enTranslation = await translatePost(
        {
            title: originalPost.title,
            content: originalPost.content,
            metaDescription: originalPost.metaDescription,
            tags: originalPost.tags,
        },
        "en"
    );

    if (enTranslation) {
        const enPost: BlogPost = {
            ...originalPost,
            title: enTranslation.title,
            content: enTranslation.content,
            metaDescription: enTranslation.metaDescription,
            tags: enTranslation.tags,
            slug: enTranslation.slug,
            originalSlug: originalSlug,
        };
        fs.writeFileSync(
            path.join(postsDir, `${enPost.slug}.json`),
            JSON.stringify(enPost, null, 2),
            "utf8"
        );
        slugMapping[originalSlug].en = enTranslation.slug;
        console.log(`Created English version: ${enPost.slug}.json`);
    }

    // Translate to French
    const frTranslation = await translatePost(
        {
            title: originalPost.title,
            content: originalPost.content,
            metaDescription: originalPost.metaDescription,
            tags: originalPost.tags,
        },
        "fr"
    );

    if (frTranslation) {
        const frPost: BlogPost = {
            ...originalPost,
            title: frTranslation.title,
            content: frTranslation.content,
            metaDescription: frTranslation.metaDescription,
            tags: frTranslation.tags,
            slug: frTranslation.slug,
            originalSlug: originalSlug,
        };
        fs.writeFileSync(
            path.join(postsDir, `${frPost.slug}.json`),
            JSON.stringify(frPost, null, 2),
            "utf8"
        );
        slugMapping[originalSlug].fr = frTranslation.slug;
        console.log(`Created French version: ${frPost.slug}.json`);
    }

    // Save slug mapping
    fs.writeFileSync(mappingPath, JSON.stringify(slugMapping, null, 2), "utf8");
    console.log("Saved slug mapping to content/slug-mapping.json");

    console.log("Done!");
}

main().catch(console.error);
