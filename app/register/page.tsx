import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { RegistrationWizard } from "@/components/RegistrationWizard";

export default function RegisterPage() {
  return <main className="form-page"><div className="section-wrap"><div className="form-topbar"><Link href="/" className="back-link"><ArrowLeft size={15} /> MAA MAHAMAYA CUP</Link><span className="eyebrow">Season 01 · Kumhari</span></div><div className="form-card"><div className="form-intro"><span className="eyebrow">Player registration</span><h1 className="display">Join the cup.</h1><p>One form. One team card. One chance to be part of the first MAA MAHAMAYA CUP.</p></div><RegistrationWizard /></div></div></main>;
}
