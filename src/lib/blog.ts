import fs from "fs";
import path from "path";

export interface BlogPost {
    title: string;
    slug: string;
    originalSlug?: string; // Reference to original German slug (only for translations)
    content: string;
    metaDescription: string;
    featuredImage?: string;
    author?: string;
    tags?: string[];
    publishedAt: string;
    updatedAt?: string;
}

interface SlugMapping {
    [originalSlug: string]: {
        en?: string;
        fr?: string;
    };
}

const postsDirectory = path.join(process.cwd(), "content/posts");
const mappingPath = path.join(process.cwd(), "content/slug-mapping.json");

// Ensure the posts directory exists
function ensurePostsDirectory() {
    if (!fs.existsSync(postsDirectory)) {
        fs.mkdirSync(postsDirectory, { recursive: true });
    }
}

// Load slug mapping
function loadSlugMapping(): SlugMapping {
    try {
        if (fs.existsSync(mappingPath)) {
            return JSON.parse(fs.readFileSync(mappingPath, "utf8"));
        }
    } catch {
        // Ignore errors
    }
    return {};
}

// Check if a post belongs to a specific locale
function postBelongsToLocale(post: BlogPost, locale: string): boolean {
    if (locale === 'de') {
        // German posts are those WITHOUT originalSlug (i.e., base posts)
        return !post.originalSlug;
    }

    // For EN/FR, check the slug mapping
    const mapping = loadSlugMapping();
    for (const originalSlug in mapping) {
        const translations = mapping[originalSlug];
        if (locale === 'en' && translations.en === post.slug) return true;
        if (locale === 'fr' && translations.fr === post.slug) return true;
    }

    // Fallback: check originalSlug field
    if (post.originalSlug) {
        // It's a translation - check if it matches the locale based on slug patterns
        // This is a heuristic for posts without explicit mapping
        return true; // If it has originalSlug, it's a translation
    }

    return false;
}

export async function getAllPosts(locale: string = 'de'): Promise<BlogPost[]> {
    ensurePostsDirectory();

    try {
        const fileNames = fs.readdirSync(postsDirectory);
        const jsonFiles = fileNames.filter((name) => name.endsWith(".json"));
        const mapping = loadSlugMapping();

        // Get all valid slugs for this locale
        const validSlugs = new Set<string>();

        if (locale === 'de') {
            // German: get base slugs (those that are keys in the mapping OR don't have originalSlug)
            for (const fileName of jsonFiles) {
                const filePath = path.join(postsDirectory, fileName);
                const fileContent = fs.readFileSync(filePath, "utf8");
                const post = JSON.parse(fileContent) as BlogPost;
                if (!post.originalSlug) {
                    validSlugs.add(post.slug);
                }
            }
        } else {
            // EN/FR: get translated slugs from mapping
            for (const originalSlug in mapping) {
                const translations = mapping[originalSlug];
                if (locale === 'en' && translations.en) {
                    validSlugs.add(translations.en);
                } else if (locale === 'fr' && translations.fr) {
                    validSlugs.add(translations.fr);
                }
            }
        }

        const posts = jsonFiles
            .map((fileName) => {
                const filePath = path.join(postsDirectory, fileName);
                const fileContent = fs.readFileSync(filePath, "utf8");
                return JSON.parse(fileContent) as BlogPost;
            })
            .filter((post) => validSlugs.has(post.slug))
            .sort(
                (a, b) =>
                    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
            );

        return posts;
    } catch {
        return [];
    }
}

export async function getPostBySlug(slug: string, locale: string = 'de'): Promise<BlogPost | null> {
    ensurePostsDirectory();
    const mapping = loadSlugMapping();

    // For EN/FR, check if the slug is a German slug and translate it
    let targetSlug = slug;

    if (locale !== 'de' && mapping[slug]) {
        // User is accessing a German slug on EN/FR page - use the translated slug
        const translations = mapping[slug];
        if (locale === 'en' && translations.en) {
            targetSlug = translations.en;
        } else if (locale === 'fr' && translations.fr) {
            targetSlug = translations.fr;
        }
    }

    const filePath = path.join(postsDirectory, `${targetSlug}.json`);

    try {
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, "utf8");
            const post = JSON.parse(fileContent) as BlogPost;

            // Verify this post belongs to the requested locale
            if (locale === 'de' && post.originalSlug) {
                // German locale but post is a translation - return null
                return null;
            }
            if (locale !== 'de' && !post.originalSlug) {
                // EN/FR locale but post is German original - check for translation
                const origSlug = post.slug;
                if (mapping[origSlug]) {
                    const translations = mapping[origSlug];
                    const translatedSlug = locale === 'en' ? translations.en : translations.fr;
                    if (translatedSlug) {
                        const translatedPath = path.join(postsDirectory, `${translatedSlug}.json`);
                        if (fs.existsSync(translatedPath)) {
                            return JSON.parse(fs.readFileSync(translatedPath, "utf8")) as BlogPost;
                        }
                    }
                }
                return null;
            }

            return post;
        }
        return null;
    } catch {
        return null;
    }
}

export async function getRelatedPosts(
    currentSlug: string,
    tags: string[] = [],
    limit: number = 3,
    locale: string = 'de'
): Promise<BlogPost[]> {
    const allPosts = await getAllPosts(locale);

    // Filter out current post (and its translations)
    const otherPosts = allPosts.filter((post) => {
        if (post.slug === currentSlug) return false;
        if (post.originalSlug === currentSlug) return false;
        return true;
    });

    // If we have tags, prioritize posts with matching tags
    if (tags.length > 0) {
        const scoredPosts = otherPosts.map((post) => {
            const matchingTags = post.tags?.filter((tag) => tags.includes(tag)) || [];
            return { post, score: matchingTags.length };
        });

        scoredPosts.sort((a, b) => b.score - a.score);
        return scoredPosts.slice(0, limit).map((item) => item.post);
    }

    // Otherwise just return the most recent posts
    return otherPosts.slice(0, limit);
}

export async function savePost(post: BlogPost): Promise<void> {
    ensurePostsDirectory();

    const filePath = path.join(postsDirectory, `${post.slug}.json`);
    fs.writeFileSync(filePath, JSON.stringify(post, null, 2), "utf8");
}

export async function getAllSlugs(locale: string = 'de'): Promise<string[]> {
    const posts = await getAllPosts(locale);
    return posts.map((post) => post.slug);
}

// Get the translated slug for a given original slug and locale
export function getTranslatedSlug(originalSlug: string, locale: string): string | null {
    if (locale === 'de') return originalSlug;

    const mapping = loadSlugMapping();
    const translations = mapping[originalSlug];
    if (!translations) return null;

    if (locale === 'en') return translations.en || null;
    if (locale === 'fr') return translations.fr || null;

    return null;
}

// Calculate reading time (average 200 words per minute)
export function calculateReadingTime(content: string): number {
    const textContent = content.replace(/<[^>]*>/g, "");
    const words = textContent.split(/\s+/).length;
    return Math.ceil(words / 200);
}
