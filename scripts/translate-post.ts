import dotenv from "dotenv";
dotenv.config(); // Loads .env file

import OpenAI from "openai";
import fs from "fs";
import path from "path";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

interface BlogPost {
    title: string;
    slug: string;
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
    content: string;
    metaDescription: string;
    tags: string[];
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
Return ONLY a valid JSON object with these fields: title, content, metaDescription, tags (as array)

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

    // Parse the JSON response
    let jsonContent = content.trim();
    if (jsonContent.startsWith("```")) {
        jsonContent = jsonContent.replace(/```json?\n?/g, "").replace(/```$/g, "").trim();
    }

    try {
        const translated = JSON.parse(jsonContent) as TranslatedPost;
        console.log(`Successfully translated to ${langName}`);
        return translated;
    } catch (e) {
        console.error("Failed to parse translation response:", e);
        return null;
    }
}

async function main() {
    const postsDir = path.join(process.cwd(), "content/posts");
    const originalSlug = "wie-sie-ki-workflows-fuer-messbaren-roi-im-kmu-implementiere";
    const originalPath = path.join(postsDir, `${originalSlug}.json`);

    // Read original post
    const originalPost: BlogPost = JSON.parse(fs.readFileSync(originalPath, "utf8"));

    // Add featured image if missing (extract from schema if present)
    if (!originalPost.featuredImage) {
        // The cover image URL from the schema in the content
        originalPost.featuredImage =
            "https://pub-ea20a57063b149ca975449d6f181fbab.r2.dev/covers/2026/02/cover-wie-sie-ki-workflows-f-r-messbaren-roi-im-km-1770340117246-zzqlmx.webp";
        // Update the original post with the image
        fs.writeFileSync(originalPath, JSON.stringify(originalPost, null, 2), "utf8");
        console.log("Added featuredImage to original post");
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
            slug: `${originalSlug}-en`,
        };
        fs.writeFileSync(
            path.join(postsDir, `${enPost.slug}.json`),
            JSON.stringify(enPost, null, 2),
            "utf8"
        );
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
            slug: `${originalSlug}-fr`,
        };
        fs.writeFileSync(
            path.join(postsDir, `${frPost.slug}.json`),
            JSON.stringify(frPost, null, 2),
            "utf8"
        );
        console.log(`Created French version: ${frPost.slug}.json`);
    }

    console.log("Done!");
}

main().catch(console.error);
