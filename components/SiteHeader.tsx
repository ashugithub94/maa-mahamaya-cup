import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AssetImage } from "./AssetImage";

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="section-wrap nav-inner">
        <Link href="/" className="brand" aria-label="Maa Mahamaya Cup home">
          <span className="brand-mark">
            <AssetImage src="/logo.png" alt="" />
            <span className="brand-fallback">MM</span>
          </span>
          <span className="brand-copy"><strong>MAA MAHAMAYA</strong><span>KUMHARI / S01</span></span>
        </Link>
        <nav className="nav-links" aria-label="Main navigation">
          <a href="#prizes">Prizes</a>
          <a href="#tournament">The cup</a>
          <a href="#contacts">Contacts</a>
          <Link href="/register" className="nav-cta">Register <ArrowUpRight size={14} /></Link>
        </nav>
        <Link href="/register" className="nav-cta md:hidden">Join <ArrowUpRight size={14} /></Link>
      </div>
    </header>
  );
}
