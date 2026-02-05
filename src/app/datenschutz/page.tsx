import { redirect } from "next/navigation";

// Root datenschutz page redirects to default locale
export default function DatenschutzPage() {
    redirect("/de/datenschutz");
}
