"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import * as RadixMenu from "@radix-ui/react-dropdown-menu";
import * as RadixRadio from "@radix-ui/react-radio-group";

import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

interface PreviousPhoto {
  key: string;
  url: string;
}

/** A photo picked for upload. Still working while it has neither a cut-out
 *  nor a note saying why there isn't one. */
interface Pending {
  file: File;
  originalUrl: string;
  cutout: { blob: Blob; url: string } | null;
  note?: string;
  choice: "cutout" | "original";
}

/**
 * Overlay control on the profile avatar. Opens a small menu: pick a photo
 * already uploaded before (no re-upload needed), or upload a new one — same
 * three-step upload flow as the coach video uploader underneath either way:
 * presigned PUT URL, upload straight to storage, then PATCH the player
 * record with the resulting key.
 *
 * A new photo first goes through a preview: the browser removes the
 * background (lib/photo-cutout.ts) so the public profile can show the
 * player NBA-style, standing on the banner. The player sees the cut-out
 * next to the original and picks one, so a poor cut-out never goes live.
 */
export default function PhotoUpload({ playerId }: { playerId: number }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [photos, setPhotos] = useState<PreviousPhoto[] | null>(null);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);

  // Free the preview images' memory once they're replaced or the dialog closes.
  const originalUrl = pending?.originalUrl;
  const cutoutUrl = pending?.cutout?.url;
  useEffect(() => () => { if (originalUrl) URL.revokeObjectURL(originalUrl); }, [originalUrl]);
  useEffect(() => () => { if (cutoutUrl) URL.revokeObjectURL(cutoutUrl); }, [cutoutUrl]);

  async function preparePhoto(file: File) {
    setError("");
    const url = URL.createObjectURL(file);
    setPending({ file, originalUrl: url, cutout: null, choice: "original" });
    // Only the latest pick may update the dialog.
    const update = (patch: Partial<Pending>) => setPending((p) => (p && p.originalUrl === url ? { ...p, ...patch } : p));
    try {
      // Loaded on demand: the segmenter is only needed once someone picks a photo.
      const { cutOutPerson } = await import("@/lib/photo-cutout");
      const blob = await cutOutPerson(file);
      if (blob) update({ cutout: { blob, url: URL.createObjectURL(blob) }, choice: "cutout" });
      else update({ note: "We couldn't find one person clearly enough to cut out. A photo of just the player, from the waist up, against a plain wall works best." });
    } catch {
      update({ note: "The background couldn't be removed on this device. You can still use the original photo." });
    }
  }

  async function savePending() {
    if (!pending) return;
    const { choice, cutout, file } = pending;
    const ok = choice === "cutout" && cutout ? await handleFile(cutout.blob, true) : await handleFile(file, false);
    if (ok) setPending(null);
  }

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

  async function applyPhotoUrl(photoUrl: string, failureMessage: string, photoIsCutout?: boolean) {
    const patchRes = await fetch(`/api/v1/players/${playerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoUrl, photoIsCutout }),
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

  /** Upload a photo and make it the profile photo. True when it worked. */
  async function handleFile(file: Blob, isCutout: boolean): Promise<boolean> {
    // A cut-out is WebP, or PNG where the browser can't encode WebP; a picked
    // file carries its own type. Either way the blob knows.
    const contentType = file.type || "image/jpeg";
    setError("");
    setBusy(true);
    try {
      const urlRes = await fetch(`/api/v1/players/${playerId}/photo-upload-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentType }),
      });
      const urlBody = await urlRes.json();
      if (!urlRes.ok) {
        setError(urlBody.error ?? "Couldn't start the upload.");
        return false;
      }

      let putRes: Response;
      try {
        putRes = await fetch(urlBody.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": contentType },
          body: file,
        });
      } catch {
        setError("Upload failed. Please try again, or contact your site administrator if this keeps happening.");
        return false;
      }
      if (!putRes.ok) {
        setError("Upload failed. Please try again, or contact your site administrator if this keeps happening.");
        return false;
      }

      if (await applyPhotoUrl(urlBody.key, "Photo uploaded but couldn't be saved to your profile.", isCutout)) {
        setPhotos(null);
        router.refresh();
        return true;
      }
      return false;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      return false;
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
          if (file) preparePhoto(file);
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
      <Dialog open={!!pending} onOpenChange={(open) => !open && !busy && setPending(null)}>
        {pending && (
          <DialogContent
            title="Your new photo"
            description="Pick how it shows on your public profile. The cut-out stands you on the banner, like a pro player page. It works best with a photo of just you, waist up."
            className="max-w-lg"
          >
            <RadixRadio.Root
              aria-label="Photo style"
              value={pending.choice}
              onValueChange={(v) => setPending((p) => (p ? { ...p, choice: v as Pending["choice"] } : p))}
              className="grid grid-cols-2 gap-3"
            >
              <PhotoChoice
                value="cutout"
                label="Cut-out"
                disabled={!pending.cutout}
                src={pending.cutout?.url}
                alt="Your photo with the background removed"
                contain
              >
                {pending.note ? (
                  "Not available"
                ) : (
                  <>
                    Removing the background...
                    <br />
                    The first time can take a minute.
                  </>
                )}
              </PhotoChoice>
              <PhotoChoice value="original" label="Original" src={pending.originalUrl} alt="Your original photo" />
            </RadixRadio.Root>
            {pending.note && <p className="mt-3 text-sm text-ink-dim">{pending.note}</p>}
            {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setPending(null)} disabled={busy}>
                Cancel
              </Button>
              <Button onClick={savePending} loading={busy} disabled={!pending.cutout && !pending.note}>
                Use this photo
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
      {error && !pending && (
        <p role="alert" className="absolute right-0 top-9 w-44 rounded-control border border-danger/40 bg-surface p-2 text-xs text-danger shadow-pop">
          {error}
        </p>
      )}
    </div>
  );
}

/** One option in the preview: the photo on the profile banner's dark ground,
 *  or `children` (a status line) until there is one. A Radix radio item, so
 *  the pair gets arrow-key navigation like components/ui/RadioGroup. */
function PhotoChoice({
  value,
  label,
  disabled,
  src,
  alt,
  contain = false,
  children,
}: {
  value: string;
  label: string;
  disabled?: boolean;
  src?: string;
  alt: string;
  contain?: boolean;
  children?: ReactNode;
}) {
  return (
    <RadixRadio.Item
      value={value}
      disabled={disabled}
      className={cn(
        "flex flex-col gap-1.5 rounded-card border-2 border-line p-1.5 text-left outline-none transition hover:border-line-strong",
        "focus-visible:ring-2 focus-visible:ring-flame data-[state=checked]:border-flame data-[disabled]:cursor-not-allowed",
      )}
    >
      <span className="flex aspect-[4/5] items-end justify-center overflow-hidden rounded-control bg-[#1C1915]">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} className={cn("h-full w-full", contain ? "object-contain object-bottom" : "object-cover")} />
        ) : (
          <span className="p-3 text-center text-xs text-[#C9C3B6]">{children}</span>
        )}
      </span>
      <span className="px-1 text-sm font-semibold text-ink">{label}</span>
    </RadixRadio.Item>
  );
}
