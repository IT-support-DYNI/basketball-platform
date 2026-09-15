"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES = [
  "SHOOTING", "BALL_HANDLING", "DEFENSE", "PASSING", "FINISHING",
  "FITNESS", "FOOTWORK", "CONDITIONING", "GAME_ANALYSIS", "OTHER",
] as const;

export default function UploadVideoForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"upload" | "link">("upload");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("SHOOTING");
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /** Presigned PUT straight to storage — same shape for the video itself and its optional thumbnail. */
  async function uploadToStorage(fileToUpload: File, fallbackContentType: string) {
    const contentType = fileToUpload.type || fallbackContentType;
    const uploadUrlRes = await fetch("/api/v1/videos/upload-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contentType }),
    });
    const uploadUrlBody = await uploadUrlRes.json();
    if (!uploadUrlRes.ok) {
      throw new Error(uploadUrlBody.error ?? "Storage isn't configured yet — see README for R2 setup.");
    }

    let putRes: Response;
    try {
      putRes = await fetch(uploadUrlBody.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: fileToUpload,
      });
    } catch {
      // A rejected fetch here (as opposed to a non-2xx response) almost always means the storage
      // bucket's CORS rules don't allow this origin — see README's "Video/photo storage" section.
      throw new Error("Upload to storage failed — likely a CORS setting on the bucket. Check the browser console for the exact blocked-origin error.");
    }
    if (!putRes.ok) {
      throw new Error(`Upload to storage failed (HTTP ${putRes.status}).`);
    }

    return uploadUrlBody.key as string;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    if (mode === "upload" && !file) {
      setError("Choose a video file first.");
      return;
    }
    if (mode === "link" && !videoUrl.trim()) {
      setError("Paste a video link first.");
      return;
    }
    setLoading(true);

    try {
      const thumbnailKey = thumbnailFile ? await uploadToStorage(thumbnailFile, "image/jpeg") : undefined;
      const videoField =
        mode === "upload"
          ? { key: await uploadToStorage(file!, "video/mp4") }
          : { externalUrl: videoUrl.trim() };

      const createRes = await fetch("/api/v1/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: description || undefined, category, ...videoField, thumbnailKey }),
      });
      const createBody = await createRes.json();
      if (!createRes.ok) {
        setError(createBody.error ?? "Something went wrong.");
        return;
      }

      setTitle("");
      setDescription("");
      setFile(null);
      setVideoUrl("");
      setThumbnailFile(null);
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="rounded-full bg-gradient-to-r from-court-500 to-court-700 px-5 py-2.5 text-sm font-bold text-white shadow-court-500/30 transition hover:border-flame">
        + Add Video
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-card border border-line bg-surface p-5 space-y-4">
      <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full rounded-control border border-line px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20" />
      <textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-control border border-line px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20" />
      <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="w-full rounded-control border border-line px-3 py-2.5 outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20">
        {CATEGORIES.map((c) => <option key={c} value={c}>{c.replace(/_/g, " ")}</option>)}
      </select>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={() => setMode("upload")}
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${mode === "upload" ? "border-court-500/40 bg-court-50 text-court-700" : "border-line text-slate-500 hover:text-slate-800"}`}
        >
          Upload a file
        </button>
        <button
          type="button"
          onClick={() => setMode("link")}
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${mode === "link" ? "border-court-500/40 bg-court-50 text-court-700" : "border-line text-slate-500 hover:text-slate-800"}`}
        >
          Paste a link
        </button>
      </div>
      {mode === "upload" ? (
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Video file</label>
          <input type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required className="w-full text-sm" />
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Video link</label>
          <input
            type="url"
            placeholder="https://youtube.com/..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            required
            className="w-full rounded-control border border-line px-3 py-2.5 text-sm outline-none focus:border-court-500 focus:ring-2 focus:ring-court-500/20"
          />
        </div>
      )}
      <div>
        <label className="mb-1 block text-xs font-semibold text-slate-600">Thumbnail (optional)</label>
        <input type="file" accept="image/*" onChange={(e) => setThumbnailFile(e.target.files?.[0] ?? null)} className="w-full text-sm" />
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="rounded-full bg-gradient-to-r from-court-500 to-court-700 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50">
          {loading ? (mode === "upload" ? "Uploading…" : "Saving…") : mode === "upload" ? "Upload" : "Add link"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-full px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
      </div>
    </form>
  );
}
