import { redirect } from "next/navigation";

// Root blog post page redirects to default locale
export default function BlogPostPage({
    params,
}: {
    params: { slug: string };
}) {
    redirect(`/de/blog/${params.slug}`);
}
