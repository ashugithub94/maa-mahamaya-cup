"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Cropper, { type Area, type MediaSize } from "react-easy-crop";
import { Check, X } from "lucide-react";

async function createCroppedImage(imageSrc: string, crop: Area) {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const imageElement = new Image();
    imageElement.onload = () => resolve(imageElement);
    imageElement.onerror = reject;
    imageElement.src = imageSrc;
  });
  const canvas = document.createElement("canvas");
  canvas.width = 900;
  canvas.height = 900;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Unable to prepare the image crop.");
  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, 900, 900);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", .86));
  if (!blob) throw new Error("Unable to prepare the image crop.");
  return new File([blob], "profile-photo.jpg", { type: "image/jpeg" });
}

export function ImageCropper({ file, onCancel, onComplete }: { file: File; onCancel: () => void; onComplete: (file: File) => void }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [mediaSize, setMediaSize] = useState<MediaSize | null>(null);
  const [working, setWorking] = useState(false);
  const [cropError, setCropError] = useState("");
  const source = useMemo(() => URL.createObjectURL(file), [file]);
  useEffect(() => () => URL.revokeObjectURL(source), [source]);

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => setArea(croppedAreaPixels), []);
  const onMediaLoaded = useCallback((size: MediaSize) => {
    setMediaSize(size);
    setCropError("");
  }, []);
  const onMediaError = useCallback(() => {
    setCropError("This image format cannot be previewed. Please choose a JPG, PNG, or WebP photo.");
  }, []);
  function getFallbackArea() {
    if (!mediaSize?.naturalWidth || !mediaSize.naturalHeight) return null;
    const size = Math.min(mediaSize.naturalWidth, mediaSize.naturalHeight);
    return {
      x: Math.round((mediaSize.naturalWidth - size) / 2),
      y: Math.round((mediaSize.naturalHeight - size) / 2),
      width: size,
      height: size,
    };
  }

  async function finish() {
    const cropArea = area ?? getFallbackArea();
    if (!cropArea) {
      setCropError("This photo is still loading. Please wait a moment and try again.");
      return;
    }
    setWorking(true);
    setCropError("");
    try {
      onComplete(await createCroppedImage(source, cropArea));
    } catch {
      setCropError("We couldn't prepare this photo. Please choose another image.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="crop-overlay" role="dialog" aria-modal="true" aria-labelledby="crop-title">
      <div className="crop-modal">
        <h3 id="crop-title">Square up your profile photo</h3>
        <div className="crop-area"><Cropper image={source} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} onMediaLoaded={onMediaLoaded} mediaProps={{ onError: onMediaError }} /></div>
        <label className="field" style={{ marginTop: 14 }}><span style={{ color: "#aeb9ca", fontSize: 11, fontWeight: 800 }}>Zoom</span><input type="range" min={1} max={3} step={.05} value={zoom} onChange={(event) => setZoom(Number(event.target.value))} /></label>
        {cropError && <p role="alert" style={{ margin: "10px 0 0", color: "#ff8c8c", fontSize: 12 }}>{cropError}</p>}
        <div className="crop-actions"><button type="button" className="btn-quiet" onClick={onCancel}><X size={15} /> Cancel</button><button type="button" className="btn-primary" onClick={finish} disabled={working}>{working ? "Preparing..." : <><Check size={15} /> Use photo</>}</button></div>
      </div>
    </div>
  );
}
