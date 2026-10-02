"use client";

import { useState, type ReactNode } from "react";

export function AssetImage({ src, alt, className, fallback }: { src: string; alt: string; className?: string; fallback?: ReactNode }) {
  const [failed, setFailed] = useState(false);
  if (failed) return fallback ? <>{fallback}</> : null;
  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}
