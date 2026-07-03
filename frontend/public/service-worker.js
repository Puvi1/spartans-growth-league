/* eslint-disable no-restricted-globals */
// Spartans Growth League — Service Worker (basic offline shell)
const CACHE_NAME = "sgl-v1";
const OFFLINE_URLS = ["/", "/index.html", "/manifest.json"];

self.addEventListener("install", (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS).catch(() => {})),
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
        ).then(() => self.clients.claim()),
    );
});

self.addEventListener("fetch", (event) => {
    const req = event.request;
    // Never cache API calls — always go to network
    if (req.url.includes("/api/")) return;
    // Network-first for navigation, fallback to cache
    if (req.mode === "navigate") {
        event.respondWith(
            fetch(req).catch(() => caches.match("/index.html")),
        );
        return;
    }
    // Cache-first for static assets
    event.respondWith(
        caches.match(req).then((cached) => cached || fetch(req).then((resp) => {
            if (resp && resp.status === 200 && req.method === "GET") {
                const copy = resp.clone();
                caches.open(CACHE_NAME).then((c) => c.put(req, copy)).catch(() => {});
            }
            return resp;
        }).catch(() => cached)),
    );
});
