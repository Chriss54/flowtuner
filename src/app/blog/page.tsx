import { redirect } from "next/navigation";

// Root blog page redirects to default locale
export default function BlogPage() {
    redirect("/de/blog");
}
