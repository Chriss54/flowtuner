import fs from "fs";
import path from "path";

export interface BlogPost {
    title: string;
    slug: string;
    content: string;
    metaDescription: string;
    featuredImage?: string;
    author?: string;
    tags?: string[];
    publishedAt: string;
    updatedAt?: string;
}

const postsDirectory = path.join(process.cwd(), "content/posts");

// Ensure the posts directory exists
function ensurePostsDirectory() {
    if (!fs.existsSync(postsDirectory)) {
        fs.mkdirSync(postsDirectory, { recursive: true });
    }
}

export async function getAllPosts(): Promise<BlogPost[]> {
    ensurePostsDirectory();

    try {
        const fileNames = fs.readdirSync(postsDirectory);
        const jsonFiles = fileNames.filter((name) => name.endsWith(".json"));

        const posts = jsonFiles
            .map((fileName) => {
                const filePath = path.join(postsDirectory, fileName);
                const fileContent = fs.readFileSync(filePath, "utf8");
                return JSON.parse(fileContent) as BlogPost;
            })
            .sort(
                (a, b) =>
                    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
            );

        return posts;
    } catch {
        return [];
    }
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
    ensurePostsDirectory();

    const filePath = path.join(postsDirectory, `${slug}.json`);

    try {
        if (fs.existsSync(filePath)) {
            const fileContent = fs.readFileSync(filePath, "utf8");
            return JSON.parse(fileContent) as BlogPost;
        }
        return null;
    } catch {
        return null;
    }
}

export async function getRelatedPosts(
    currentSlug: string,
    tags: string[] = [],
    limit: number = 3
): Promise<BlogPost[]> {
    const allPosts = await getAllPosts();

    // Filter out current post
    const otherPosts = allPosts.filter((post) => post.slug !== currentSlug);

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

export async function getAllSlugs(): Promise<string[]> {
    const posts = await getAllPosts();
    return posts.map((post) => post.slug);
}

// Calculate reading time (average 200 words per minute)
export function calculateReadingTime(content: string): number {
    const textContent = content.replace(/<[^>]*>/g, "");
    const words = textContent.split(/\s+/).length;
    return Math.ceil(words / 200);
}
