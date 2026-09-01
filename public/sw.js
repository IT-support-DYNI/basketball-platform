const CACHE_NAME = "dyni-blazers-shell-v2";
const PRECACHE_URLS = ["/icons/icon-192.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
  );
  self.clients.claim();
});

/*
 * Training schedules, attendance, and performance data change often and
 * must always be current (ARCHITECTURE.md's reliability requirement), so
 * we deliberately do NOT cache pages or API responses — only the tiny
 * static app-shell set above, just enough for installability.
 */
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (PRECACHE_URLS.includes(url.pathname)) {
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
  }
});

/*
 * Web Push — the payload is whatever lib/push.ts sent as the raw string
 * body (title/body/url). Falls back to a generic message if the push
 * event somehow has no data, since showNotification is required here
 * (the browser mandates one visible notification per push event).
 */
self.addEventListener("push", (event) => {
  let data = { title: "DYNI Blazers", body: "You have a new notification.", url: "/" };
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: data.url },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(targetUrl) && "focus" in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    })
  );
});
