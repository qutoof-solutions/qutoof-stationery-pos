const CACHE = "qutoof-pos-demo-v1";
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (event) => { if (event.request.method === "GET") event.respondWith(caches.open(CACHE).then((cache) => cache.match(event.request).then((hit) => hit || fetch(event.request).then((response) => { cache.put(event.request, response.clone()); return response; })))); });
