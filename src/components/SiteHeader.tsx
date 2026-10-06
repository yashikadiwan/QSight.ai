import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

export function SiteHeader({ variant }: { variant: "marketing" | "app" }) {
  return (
    <header className="border-b border-[var(--line)]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5 text-white">
          <BrandMark />
          <span className="text-[17px] font-bold tracking-tight">QSight.ai</span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-5">
          {variant === "marketing" ? (
            <>
              <a href="#how" className="hidden text-[15px] font-semibold text-white hover:text-[#3eea8a] sm:inline">
                How a run works
              </a>
              <a href="#start-with" className="hidden text-[15px] font-semibold text-white hover:text-[#3eea8a] md:inline">
                After the map
              </a>
              <Link href="/start" className="btn whitespace-nowrap">
                Start testing
              </Link>
            </>
          ) : (
            <>
              <Link href="/" className="text-[15px] font-semibold text-white hover:text-[#3eea8a]">
                Overview
              </Link>
              <Link href="/start" className="btn whitespace-nowrap">
                Start testing
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
