// This is a minimal root layout that only handles the root "/" path
// All locale-specific content is rendered by [locale]/layout.tsx
// The middleware redirects "/" to the appropriate locale

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
