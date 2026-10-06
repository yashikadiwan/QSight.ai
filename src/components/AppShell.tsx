import { SiteHeader } from "@/components/SiteHeader";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <SiteHeader variant="app" />
      <main className="mx-auto max-w-6xl px-5 pb-16 pt-8">{children}</main>
    </div>
  );
}
