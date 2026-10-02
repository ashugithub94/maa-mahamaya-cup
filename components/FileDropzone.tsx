"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, UploadCloud, UserRound, X } from "lucide-react";

export function FileDropzone({ kind, file, onFile, onRemove }: { kind: "photo" | "receipt"; file?: File; onFile: (file: File) => void; onRemove: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [active, setActive] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>();
  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) { setImagePreview(undefined); return; }
    const preview = URL.createObjectURL(file);
    setImagePreview(preview);
    return () => URL.revokeObjectURL(preview);
  }, [file]);
  return file ? (
    <div className={`preview-box ${!imagePreview ? "pdf-preview" : ""}`}>
      {imagePreview ? <img src={imagePreview} alt={`${kind} preview`} /> : <FileText size={30} color="#f4c84b" />}
      <div style={{ minWidth: 0, flex: 1 }}><p>{file.name}</p><button type="button" onClick={onRemove}><X size={12} style={{ verticalAlign: "-2px" }} /> Remove file</button></div>
    </div>
  ) : (
    <div className={`file-zone ${active ? "active" : ""}`} onDragOver={(event) => { event.preventDefault(); setActive(true); }} onDragLeave={() => setActive(false)} onDrop={(event) => { event.preventDefault(); setActive(false); const dropped = event.dataTransfer.files[0]; if (dropped) onFile(dropped); }}>
      <input ref={inputRef} type="file" accept={kind === "photo" ? "image/*" : "image/*,.pdf,application/pdf"} onClick={(event) => { event.currentTarget.value = ""; }} onChange={(event) => { const chosen = event.target.files?.[0]; if (chosen) onFile(chosen); }} />
      <div>{kind === "photo" ? <UserRound size={25} /> : <UploadCloud size={25} />}<strong>{kind === "photo" ? "Add profile photo" : "Upload payment receipt"}</strong><small>{kind === "photo" ? "Optional · image only · max 2MB · square crop" : "Image or PDF · max 2MB · tap to browse"}</small></div>
    </div>
  );
}
