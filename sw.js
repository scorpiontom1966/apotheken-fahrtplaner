const CACHE = "apo-fahrtplaner-v2";
const SHELL = ["./", "./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("message", (event) => {
  if (event.data === "skipWaiting") self.skipWaiting();
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Nur die eigene Oberfläche cachen (same-origin). Adresssuche und Routing
// (photon.komoot.io, nominatim.openstreetmap.org, router.project-osrm.org)
// laufen immer live über das Netz, damit die Daten aktuell sind.
//
// Für die Seite selbst (HTML/JS/Manifest): Netz-zuerst, damit Änderungen
// sofort sichtbar sind, sobald Internet da ist. Der Cache dient nur als
// Rückfallebene, wenn gerade kein Netz verfügbar ist.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request, { cache: "no-store" })
      .then((resp) => {
        if (resp && resp.ok) {
          const copy = resp.clone();
          caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        }
        return resp;
      })
      .catch(() => caches.match(event.request))
  );
});
