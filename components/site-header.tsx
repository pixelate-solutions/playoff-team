import Image from "next/image";
import Link from "next/link";
import { MobileNav } from "@/components/site/mobile-nav";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/my-entry", label: "My Roster" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/chat", label: "Chat" },
  { href: "/rules", label: "Rules & Scoring" },
  { href: "/admin", label: "Admin" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/60 bg-white/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-sm shadow-glow">
            <Image src="/nfl-playoff.png" alt="NFL Playoff" width={40} height={40} className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="font-display text-2xl tracking-wide text-slate-900">Playoff Fantasy</p>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">2026 Challenge</p>
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
