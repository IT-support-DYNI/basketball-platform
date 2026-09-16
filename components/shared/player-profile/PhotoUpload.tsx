"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import * as RadixMenu from "@radix-ui/react-dropdown-menu";

interface PreviousPhoto {
  key: string;
  url: string;
}

/**
 * Overlay control on the profile avatar. Opens a small menu: pick a photo
 * already uploaded before (no re-upload needed), or upload a new one — same
 * three-step upload flow as the coach video uploader underneath either way:
 * presigned PUT URL, upload straight to storage, then PATCH the player
 * record with the resulting key.
 */
export default function PhotoUpload({ playerId }: { playerId: number }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<PreviousPhoto[] | null>(null);
  const [loadingPhotos, setLoadingPhotos] = useState(false);

  async function loadPhotos() {
    setLoadingPhotos(true);
    try {
      const res = await fetch(`/api/v1/players/${playerId}/photos`);
      const body = await res.json().catch(() => ({}));
      setPhotos(res.ok && Array.isArray(body.photos) ? body.photos : []);
    } catch {
      setPhotos([]);
    } finally {
      setLoadingPhotos(false);
    }
  }

  async function applyPhotoUrl(photoUrl: string, failureMessage: string) {
    const patchRes = await fetch(`/api/v1/players/${playerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoUrl }),
    });
    if (!patchRes.ok) {
      const patchBody = await patchRes.json().catch(() => ({}));
      setError(patchBody.error ?? failureMessage);
      return false;
    }
    return true;
  }

  async function selectExisting(key: string) {
    setError("");
    setBusy(true);
    try {
      if (await applyPhotoUrl(key, "Couldn't switch to that photo.")) {
        // Re-fetch next time the menu opens, in case this reorders the list.
        setPhotos(null);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

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

      if (await applyPhotoUrl(urlBody.key, "Photo uploaded but couldn't be saved to your profile.")) {
        setPhotos(null);
        router.refresh();
      }
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
      <RadixMenu.Root
        onOpenChange={(open) => {
          if (open && photos === null && !loadingPhotos) loadPhotos();
        }}
      >
        <RadixMenu.Trigger asChild>
          <button
            type="button"
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
        </RadixMenu.Trigger>
        <RadixMenu.Portal>
          <RadixMenu.Content
            align="end"
            sideOffset={8}
            className="z-50 w-56 rounded-card border border-line-strong bg-surface p-2 shadow-pop data-[state=open]:animate-fade-in motion-reduce:animate-none"
          >
            <p className="px-1 pb-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-dim">Profile photo</p>

            {loadingPhotos && <p className="px-1 pb-2 text-xs text-ink-dim">Loading your photos…</p>}

            {!loadingPhotos && photos && photos.length > 0 && (
              <div className="grid grid-cols-4 gap-1.5 pb-2">
                {photos.map((photo) => (
                  <RadixMenu.Item
                    key={photo.key}
                    asChild
                    onSelect={(e) => {
                      e.preventDefault();
                      selectExisting(photo.key);
                    }}
                  >
                    <button
                      type="button"
                      aria-label="Use this photo"
                      className="aspect-square overflow-hidden rounded-control outline-none transition data-[highlighted]:ring-2 data-[highlighted]:ring-flame"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.url} alt="" className="h-full w-full object-cover" />
                    </button>
                  </RadixMenu.Item>
                ))}
              </div>
            )}

            {!loadingPhotos && photos && photos.length === 0 && (
              <p className="px-1 pb-2 text-xs text-ink-dim">No previous photos yet.</p>
            )}

            <RadixMenu.Item
              asChild
              onSelect={(e) => {
                e.preventDefault();
                inputRef.current?.click();
              }}
            >
              <button
                type="button"
                className="flex w-full items-center justify-center gap-1.5 rounded-control border border-dashed border-line-strong px-2 py-2 text-xs text-ink-dim outline-none transition hover:border-flame hover:text-flame-on-bg data-[highlighted]:border-flame data-[highlighted]:text-flame-on-bg"
              >
                Upload new photo
              </button>
            </RadixMenu.Item>
          </RadixMenu.Content>
        </RadixMenu.Portal>
      </RadixMenu.Root>
      {error && (
        <p role="alert" className="absolute right-0 top-9 w-44 rounded-control border border-danger/40 bg-surface p-2 text-xs text-danger shadow-pop">
          {error}
        </p>
      )}
    </div>
  );
}
