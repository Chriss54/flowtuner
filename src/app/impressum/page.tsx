import { redirect } from "next/navigation";

// Root impressum page redirects to default locale
export default function ImpressumPage() {
    redirect("/de/impressum");
}
