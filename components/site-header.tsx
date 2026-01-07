import Link from "next/link";
import { MobileNav } from "@/components/site/mobile-nav";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/my-entry", label: "My Roster" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/rules", label: "Rules & Scoring" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-white/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-glow">
            <span className="font-display text-xl">PF</span>
          </div>
          <div>
            <p className="font-display text-2xl tracking-wide text-slate-900">Playoff Fantasy</p>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">2025 Challenge</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
          <Button asChild size="sm">
            <Link href="/create-entry">Draft Now</Link>
          </Button>
        </nav>
        <MobileNav navItems={navItems} />
      </div>
    </header>
  );
}
