import { redirect } from "next/navigation";

// Root page redirects to default locale
// All actual content is in [locale]/page.tsx
export default function RootPage() {
  redirect("/de");
}
