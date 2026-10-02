import Link from "next/link";
import { ArrowDown, ArrowUpRight, ClipboardList, MapPin, Sparkles, Trophy, Shirt } from "lucide-react";
import { ContactList } from "@/components/ContactList";
import { PrizeGrid } from "@/components/PrizeGrid";
import { SiteHeader } from "@/components/SiteHeader";
import { AssetImage } from "@/components/AssetImage";

export default function HomePage() {
  return (
    <main className="site-shell">
      <SiteHeader />
      <section className="hero" id="tournament">
        <div className="section-wrap hero-grid">
          <div className="hero-copy">
            <span className="hero-kicker">Coming soon · Player registration open</span>
            <h1 className="display">Maa <span>Mahamaya</span> Cup</h1>
            <p className="hero-location">KUMHARI <span style={{ color: "#f05745" }}>•</span> SEASON 01</p>
            <p className="hero-tagline">Cricket Se Hi Dosti Hai. A new chapter of big hits, brave hearts, and the whole town behind the game.</p>
            <div className="hero-actions">
              <Link href="/register" className="btn-primary">Register now <ArrowUpRight size={16} /></Link>
              <a href="#prizes" className="btn-secondary">Explore the cup <ArrowDown size={15} /></a>
            </div>
            <div className="hero-note"><Sparkles size={14} /> Powered by the love of the game in Kumhari</div>
          </div>
          <div className="poster-wrap" aria-label="Tournament poster preview">
            <div className="floodlight one" /><div className="floodlight two" />
            <div className="poster-frame">
              <div className="poster-fallback"><b>MAA<br />MAHAMAYA<br /><span style={{ color: "#f05745" }}>CUP</span></b></div>
              <AssetImage src="/poster.jpg" alt="MAA MAHAMAYA CUP tournament poster" />
            </div>
            <div className="poster-label">Kumhari · S01</div>
            <div className="ball" aria-hidden="true" />
          </div>
        </div>
      </section>
      <section className="section" id="prizes">
        <div className="section-wrap">
          <div className="section-heading">
            <div><span className="eyebrow">Play for more</span><h2 className="display">The stakes are real.</h2></div>
            <p>Every run carries a little more weight this season. Bring your best cricket and take your place in the story.</p>
          </div>
          <PrizeGrid />
        </div>
      </section>
      <div className="note-banner"><div className="section-wrap note-banner-inner"><Shirt size={20} /> <span>Lower and T-shirt will be provided by the committee.</span></div></div>
      <section className="section" id="contacts">
        <div className="section-wrap info-layout">
          <div>
            <span className="eyebrow">Find the ground</span>
            <div className="venue-block"><MapPin size={20} color="#f4c84b" /><h3>Kumhari</h3><p>Venue details and match schedule will be announced soon.</p></div>
            <div className="venue-block" style={{ borderTop: 0 }}><span className="eyebrow">Organized by</span><h3>Rakesh Yadav</h3><p>For registration questions, speak to the team directly.</p></div>
          </div>
          <div>
            <div className="section-heading" style={{ marginBottom: 18 }}><div><span className="eyebrow">Need a hand?</span><h2 className="display" style={{ fontSize: "clamp(36px, 7vw, 56px)" }}>Talk to the team.</h2></div></div>
            <ContactList />
          </div>
        </div>
      </section>
      <footer className="site-footer">
        <div className="section-wrap footer-inner"><p>© 2026 MAA MAHAMAYA CUP · KUMHARI / SEASON 01</p><span className="footer-blessing">Jai Maa Mahamaya</span></div>
      </footer>
      <div className="mobile-sticky"><span><Trophy size={13} style={{ display: "inline", marginRight: 5, verticalAlign: "-2px", color: "#f4c84b" }} /> Join Season 01</span><Link href="/register" className="btn-primary">Register now <ArrowUpRight size={14} /></Link></div>
    </main>
  );
}
