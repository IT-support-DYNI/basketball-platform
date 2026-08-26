"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

type Status = "unsupported" | "checking" | "denied" | "subscribed" | "unsubscribed";

export default function PushNotificationToggle() {
  const [status, setStatus] = useState<Status>("checking");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setStatus("unsupported");
      return;
    }
    if (Notification.permission === "denied") {
      setStatus("denied");
      return;
    }

    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((sub) => setStatus(sub ? "subscribed" : "unsubscribed"))
      .catch(() => setStatus("unsubscribed"));
  }, []);

  async function subscribe() {
    setError("");
    setLoading(true);
    try {
      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicKey) {
        setError("Push isn't configured on this deployment yet.");
        return;
      }

      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "unsubscribed");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const json = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });

      setStatus("subscribed");
    } catch {
      setError("Couldn't enable notifications — try again.");
    } finally {
      setLoading(false);
    }
  }

  async function unsubscribe() {
    setError("");
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setStatus("unsubscribed");
    } finally {
      setLoading(false);
    }
  }

  if (status === "checking") return null;

  if (status === "unsupported") {
    return <p className="mb-4 text-xs text-slate-400">Push notifications aren't supported in this browser.</p>;
  }

  if (status === "denied") {
    return (
      <p className="mb-4 text-xs text-slate-500">
        Notifications are blocked for this site in your browser settings — enable them there to turn this on.
      </p>
    );
  }

  return (
    <div className="mb-4 flex items-center gap-3">
      <button
        type="button"
        onClick={status === "subscribed" ? unsubscribe : subscribe}
        disabled={loading}
        className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-50 ${
          status === "subscribed"
            ? "border border-slate-200 text-slate-600 hover:bg-slate-100"
            : "bg-gradient-to-r from-court-500 to-court-700 text-white shadow-sm shadow-court-500/30 hover:shadow-md"
        }`}
      >
        {loading ? "Working..." : status === "subscribed" ? "Push notifications on — turn off" : "Enable push notifications"}
      </button>
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
}
