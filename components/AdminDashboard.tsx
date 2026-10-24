"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Download, Eye, FileText, LoaderCircle, LogOut, MessageCircle, Upload, X } from "lucide-react";
import { compressImage } from "@/lib/image-utils";
import { validateFile } from "@/lib/validation";

type RegistrationStatus = "pending" | "approved" | "rejected";

type RegistrationRow = {
  id: string;
  registration_code: string;
  photo_url?: string | null;
  name: string;
  mobile: string;
  age: number;
  role: string;
  tshirt_size: string;
  trouser_size: string;
  jersey_name?: string | null;
  jersey_number?: number | null;
  batting_style: string;
  bowling_style: string;
  notes?: string | null;
  photo_preview_url?: string | null;
  receipt_preview_url?: string | null;
  status: RegistrationStatus;
  created_at: string;
};

function whatsappUrl(row: RegistrationRow, status: RegistrationStatus) {
  const message = status === "approved"
    ? `Hi ${row.name}, your registration ${row.registration_code} for MAA MAHAMAYA CUP – KUMHARI, SEASON 01 has been approved. Jai Maa Mahamaya!`
    : `Hi ${row.name}, your registration ${row.registration_code} for MAA MAHAMAYA CUP needs clarification before approval. Please contact the tournament committee.`;
  return `https://wa.me/91${row.mobile}?text=${encodeURIComponent(message)}`;
}

function csvValue(value: unknown) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

export function AdminDashboard() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [rows, setRows] = useState<RegistrationRow[]>([]);
  const [selectedRow, setSelectedRow] = useState<RegistrationRow | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [photoUploadError, setPhotoUploadError] = useState("");

  async function loadRows() {
    setLoading(true);
    setError("");
    const query = new URLSearchParams({ search });
    if (status !== "all") query.set("status", status);
    const response = await fetch(`/api/admin/registrations?${query}`);
    const result = await response.json();
    if (response.status === 401) {
      setLoggedIn(false);
      setError("Your admin session has expired.");
    } else if (!response.ok) {
      setError(result.error || "Could not load registrations.");
    } else {
      setRows(result.registrations);
      setLoggedIn(true);
    }
    setLoading(false);
  }

  useEffect(() => { void loadRows(); }, []);

  async function login(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password })
    });
    if (!response.ok) {
      const result = await response.json();
      setError(result.error || "Login failed.");
      setLoading(false);
      return;
    }
    setUserId("");
    setPassword("");
    await loadRows();
  }

  async function updateStatus(id: string, nextStatus: RegistrationStatus) {
    const response = await fetch("/api/admin/registrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: nextStatus })
    });
    if (!response.ok) {
      setError("Could not update this registration.");
      return;
    }
    setRows((current) => current.map((row) => row.id === id ? { ...row, status: nextStatus } : row));
    setSelectedRow((current) => current?.id === id ? { ...current, status: nextStatus } : current);
  }

  async function uploadProfilePhoto(id: string, file: File) {
    const fileError = validateFile(file, { required: true });
    if (fileError) {
      setPhotoUploadError(fileError);
      return;
    }
    setUploadingPhoto(true);
    setPhotoUploadError("");
    try {
      const formData = new FormData();
      formData.append("photo", await compressImage(file));
      const response = await fetch(`/api/admin/registrations/${id}/photo`, { method: "POST", body: formData });
      const result = await response.json() as { ok?: boolean; photo_preview_url?: string | null; error?: string };
      if (!response.ok || !result.ok) throw new Error(result.error || "Could not upload the profile photo.");
      const photoPreviewUrl = result.photo_preview_url || null;
      setRows((current) => current.map((row) => row.id === id ? { ...row, photo_preview_url: photoPreviewUrl } : row));
      setSelectedRow((current) => current?.id === id ? { ...current, photo_preview_url: photoPreviewUrl } : current);
    } catch (uploadError) {
      setPhotoUploadError(uploadError instanceof Error ? uploadError.message : "Could not upload the profile photo.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    setLoggedIn(false);
    setRows([]);
    setSelectedRow(null);
  }

  const counts = useMemo(() => ({
    total: rows.length,
    pending: rows.filter((row) => row.status === "pending").length,
    approved: rows.filter((row) => row.status === "approved").length,
    rejected: rows.filter((row) => row.status === "rejected").length
  }), [rows]);

  async function exportCsv() {
    setExporting(true);
    setError("");
    try {
      const query = new URLSearchParams({ search });
      if (status !== "all") query.set("status", status);
      const response = await fetch(`/api/admin/registrations/export?${query}`);
      if (response.status === 401) {
        setLoggedIn(false);
        throw new Error("Your admin session has expired.");
      }
      if (!response.ok) {
        const result = await response.json().catch(() => ({})) as { error?: string };
        throw new Error(result.error || "Could not export registrations.");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "mmc-registrations-shareable.csv";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : "Could not export registrations.");
    } finally {
      setExporting(false);
    }
  }

  if (!loggedIn) return (
    <form className="login-panel" onSubmit={login}>
      <span className="eyebrow">Committee access</span>
      <h1 className="display">Admin desk.</h1>
      <p>Review player registrations, check payment proof, and manage approvals from one place.</p>
      <div className="field"><label htmlFor="admin-user-id">Admin user ID</label><input id="admin-user-id" className="input" value={userId} onChange={(event) => setUserId(event.target.value)} autoComplete="username" placeholder="Enter admin user ID" /></div>
      <div className="field" style={{ marginTop: 14 }}><label htmlFor="admin-password">Password</label><input id="admin-password" className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter admin password" /></div>
      {error && <div className="submit-error">{error}</div>}
      <button className="btn-primary" type="submit" style={{ width: "100%", marginTop: 18 }} disabled={loading}>{loading ? <><LoaderCircle size={16} className="animate-spin" /> Checking...</> : "Open admin desk"}</button>
    </form>
  );

  return (
    <div className="section-wrap">
      <div className="form-topbar"><span className="eyebrow">MM CUP / ADMIN</span><button type="button" className="btn-quiet" onClick={logout}><LogOut size={15} /> Log out</button></div>
      <div className="admin-toolbar"><div><span className="eyebrow">Season 01 registrations</span><h1 className="display">The roster.</h1></div><div className="admin-controls"><input className="admin-search" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void loadRows(); }} placeholder="Search name, mobile, ID" aria-label="Search registrations" /><select className="admin-select" value={status} onChange={(event) => { setStatus(event.target.value); setTimeout(() => void loadRows(), 0); }} aria-label="Filter status"><option value="all">All status</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select><button type="button" className="btn-secondary" onClick={() => void exportCsv()} disabled={exporting}><Download size={15} /> {exporting ? "Preparing..." : "Share CSV"}</button></div></div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 18, marginBottom: 18, color: "#8d98aa", fontSize: 12 }}><span><strong style={{ color: "#fff" }}>{counts.total}</strong> shown</span><span><strong style={{ color: "#f4c84b" }}>{counts.pending}</strong> pending</span><span><strong style={{ color: "#9ef0cf" }}>{counts.approved}</strong> approved</span><span><strong style={{ color: "#ff9e91" }}>{counts.rejected}</strong> rejected</span></div>
      {error && <div className="submit-error" style={{ marginBottom: 15 }}>{error}</div>}
      <div className="admin-table-wrap">
        {loading ? <div className="empty-state"><LoaderCircle size={20} className="animate-spin" style={{ display: "inline" }} /> Loading registrations...</div> : rows.length === 0 ? <div className="empty-state">No registrations match this view.</div> : <table className="admin-table"><thead><tr><th>Player</th><th>Profile</th><th>Game</th><th>Kit</th><th>Proof</th><th>Status</th><th>Review</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td><strong style={{ color: "#fff", display: "block" }}>{row.name}</strong><span style={{ color: "#8d98aa", fontSize: 11 }}>{row.registration_code} · +91 {row.mobile}</span></td><td>{row.photo_preview_url ? <a href={row.photo_preview_url} target="_blank" rel="noreferrer"><img className="admin-thumb" src={row.photo_preview_url} alt={`${row.name} profile`} /></a> : <span style={{ color: "#718096" }}>No photo</span>}</td><td><span style={{ display: "block" }}>{row.role}</span><span style={{ color: "#8d98aa", fontSize: 11 }}>{row.batting_style} · {row.bowling_style}</span></td><td>{row.tshirt_size} / {row.trouser_size}<span style={{ display: "block", color: "#8d98aa", fontSize: 11 }}>#{row.jersey_number ?? "—"}</span></td><td>{row.receipt_preview_url ? <a className="admin-thumb-link" href={row.receipt_preview_url} target="_blank" rel="noreferrer"><Eye size={13} style={{ verticalAlign: "-2px" }} /> View proof</a> : "—"}</td><td><span className={`status status-${row.status}`}>{row.status}</span></td><td><div style={{ display: "flex", gap: 5 }}><button type="button" className="icon-button" onClick={() => setSelectedRow(row)} aria-label={`View all details for ${row.name}`} title="View all details"><FileText size={15} /></button>{row.status !== "approved" && <button type="button" className="icon-button" onClick={() => void updateStatus(row.id, "approved")} aria-label={`Approve ${row.name}`} title="Approve"><Check size={15} /></button>}{row.status !== "rejected" && <button type="button" className="icon-button" onClick={() => void updateStatus(row.id, "rejected")} aria-label={`Reject ${row.name}`} title="Reject"><X size={15} /></button>}</div></td></tr>)}</tbody></table>}
      </div>
      {selectedRow && <div className="admin-detail-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedRow(null); }}><section className="admin-detail-panel" role="dialog" aria-modal="true" aria-labelledby="registration-detail-title"><div className="admin-detail-head"><div><span className="eyebrow">Full registration</span><h2 id="registration-detail-title">{selectedRow.name}</h2><span className={`status status-${selectedRow.status}`}>{selectedRow.status}</span></div><button type="button" className="icon-button" onClick={() => setSelectedRow(null)} aria-label="Close details" title="Close details"><X size={17} /></button></div><div className="admin-detail-grid"><div><span className="admin-detail-label">Registration ID</span><strong>{selectedRow.registration_code}</strong></div><div><span className="admin-detail-label">Submitted</span><strong>{new Date(selectedRow.created_at).toLocaleString("en-IN")}</strong></div><div><span className="admin-detail-label">Mobile</span><strong>+91 {selectedRow.mobile}</strong></div><div><span className="admin-detail-label">Age</span><strong>{selectedRow.age}</strong></div><div><span className="admin-detail-label">Jersey name</span><strong>{selectedRow.jersey_name || "Not provided"}</strong></div><div><span className="admin-detail-label">Jersey number</span><strong>{selectedRow.jersey_number ?? "Not provided"}</strong></div><div><span className="admin-detail-label">T-shirt size</span><strong>{selectedRow.tshirt_size}</strong></div><div><span className="admin-detail-label">Trouser size</span><strong>{selectedRow.trouser_size}</strong></div><div><span className="admin-detail-label">Playing role</span><strong>{selectedRow.role}</strong></div><div><span className="admin-detail-label">Batting style</span><strong>{selectedRow.batting_style}</strong></div><div><span className="admin-detail-label">Bowling style</span><strong>{selectedRow.bowling_style}</strong></div><div className="admin-detail-wide"><span className="admin-detail-label">Notes / experience</span><strong>{selectedRow.notes || "No notes provided"}</strong></div></div><div className="admin-detail-media"><div><span className="admin-detail-label">Profile photo</span>{selectedRow.photo_preview_url ? <a href={selectedRow.photo_preview_url} target="_blank" rel="noreferrer"><img src={selectedRow.photo_preview_url} alt={`${selectedRow.name} profile`} /></a> : <div className="admin-media-empty">No profile photo</div>}<input id="admin-profile-photo" type="file" accept="image/*" onChange={(event) => { const file = event.target.files?.[0]; event.currentTarget.value = ""; if (file) void uploadProfilePhoto(selectedRow.id, file); }} style={{ position: "absolute", width: 1, height: 1, opacity: 0 }} /><label className="btn-secondary admin-photo-upload" htmlFor="admin-profile-photo"><Upload size={14} /> {uploadingPhoto ? "Uploading..." : selectedRow.photo_preview_url ? "Replace photo" : "Upload photo"}</label>{photoUploadError && <span className="error-text">{photoUploadError}</span>}</div><div><span className="admin-detail-label">Payment proof</span>{selectedRow.receipt_preview_url ? <a className="admin-proof-link" href={selectedRow.receipt_preview_url} target="_blank" rel="noreferrer"><Eye size={16} /> Open receipt / screenshot</a> : <div className="admin-media-empty">No receipt</div>}</div></div><div className="admin-detail-actions">{selectedRow.status !== "approved" && <button type="button" className="btn-primary" onClick={() => void updateStatus(selectedRow.id, "approved")}><Check size={15} /> Approve</button>}{selectedRow.status !== "rejected" && <button type="button" className="btn-secondary" onClick={() => void updateStatus(selectedRow.id, "rejected")}><X size={15} /> Reject</button>}<a className="btn-secondary" href={whatsappUrl(selectedRow, selectedRow.status === "approved" ? "approved" : "rejected")} target="_blank" rel="noreferrer"><MessageCircle size={15} /> Notify on WhatsApp</a></div></section></div>}
    </div>
  );
}
