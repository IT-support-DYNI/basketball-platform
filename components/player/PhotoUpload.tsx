"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Overlay control on the profile avatar — click, pick an image, done. Same
 * three-step flow as the coach video uploader: presigned PUT URL, upload
 * straight to storage, then PATCH the player record with the resulting key.
 */
export default function PhotoUpload({ playerId }: { playerId: number }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File) {
    setError("");
    setBusy(true);
    try {
      const urlRes = await fetch(`/api/v1/players/${playerId}/photo-upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType: file.type || "image/jpeg" }),
      });
      const urlBody = await urlRes.json();
      if (!urlRes.ok) {
        setError(urlBody.error ?? "Couldn't start the upload.");
        return;
      }

      let putRes: Response;
      try {
        putRes = await fetch(urlBody.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type || "image/jpeg" },
          body: file,
        });
      } catch {
        setError("Upload to storage failed — check the bucket's CORS settings.");
        return;
      }
      if (!putRes.ok) {
        setError(`Upload to storage failed (HTTP ${putRes.status}).`);
        return;
      }

      const patchRes = await fetch(`/api/v1/players/${playerId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoUrl: urlBody.key }),
      });
      if (!patchRes.ok) {
        const patchBody = await patchRes.json().catch(() => ({}));
        setError(patchBody.error ?? "Photo uploaded but couldn't be saved to your profile.");
        return;
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="absolute -bottom-1 -right-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        aria-label={busy ? "Uploading photo…" : "Change profile photo"}
        title={busy ? "Uploading…" : "Change profile photo"}
        className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-surface bg-flame text-on-flame shadow-pop transition hover:bg-flame-ink disabled:opacity-60"
      >
        {busy ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
            <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 13.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3.5M12 15V4M12 4 8 8M12 4l4 4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>
      {error && (
        <p role="alert" className="absolute right-0 top-9 w-44 rounded-control border border-danger/40 bg-surface p-2 text-xs text-danger shadow-pop">
          {error}
        </p>
      )}
    </div>
  );
}
