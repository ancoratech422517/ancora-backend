try {
  self.importScripts("https://sdk.pushy.me/web/1.0.24/pushy-service-worker.js");
} catch (error) {
  console.warn("Pushy indisponível enquanto a aplicação está offline:", error);
}

const SHELL_CACHE = "ancora-shell-v1";
const MEDIA_CACHE = "ancora-media-v1";
const STATIC_RESOURCE = /\.(?:css|js|mjs|svg|png|jpe?g|webp|woff2?)$/i;
const MAX_MEDIA_ENTRIES = 150;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then(async (cache) => {
      const response = await fetch("/index.html", { cache: "no-cache" });
      if (!response.ok) throw new Error(`Não foi possível guardar a aplicação offline (${response.status}).`);
      await cache.put("/index.html", response.clone());
      await cache.put("/", response.clone());

      const html = await response.text();
      const assets = [...html.matchAll(/(?:src|href)=["']([^"']+\.(?:css|js|mjs|svg|woff2?)(?:\?[^"']*)?)["']/gi)]
        .map((match) => match[1]);
      await Promise.all(assets.map(async (asset) => {
        try {
          const assetResponse = await fetch(asset);
          if (assetResponse.ok) await cache.put(asset, assetResponse);
        } catch (error) {
          console.warn(`Não foi possível pré-carregar ${asset}:`, error);
        }
      }));
      await self.skipWaiting();
    }),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith("ancora-") && ![SHELL_CACHE, MEDIA_CACHE].includes(key))
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

async function cacheMediaResponse(request, response) {
  if (response.ok || response.type === "opaque") {
    try {
      const cache = await caches.open(MEDIA_CACHE);
      await cache.put(request, response.clone());
      const keys = await cache.keys();
      if (keys.length > MAX_MEDIA_ENTRIES) await cache.delete(keys[0]);
    } catch (error) {
      console.warn("Não foi possível guardar a imagem no cache offline:", error);
    }
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then((response) => {
        const copy = response.clone();
        return caches.open(SHELL_CACHE)
          .then((cache) => cache.put("/index.html", copy).catch((error) => {
            console.warn("Não foi possível atualizar o shell offline:", error);
          }))
          .then(() => response);
      }).catch(async () => (
        (await caches.match("/index.html"))
        || (await caches.match("/"))
        || new Response("A Âncora ainda não foi guardada para utilização offline.", { status: 503 })
      )),
    );
    return;
  }

  if (request.destination === "image") {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request)
          .then((response) => cacheMediaResponse(request, response))
          .catch((error) => {
            if (cached) {
              console.warn("A usar uma imagem guardada porque a rede está indisponível:", error);
              return cached;
            }
            throw error;
          });
        return cached || network;
      }),
    );
    return;
  }

  if (url.origin === self.location.origin && STATIC_RESOURCE.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const network = fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy)).catch((error) => {
              console.warn("Não foi possível atualizar um recurso do shell:", error);
            });
          }
          return response;
        }).catch((error) => {
          if (cached) {
            console.warn("A usar um recurso guardado porque a rede está indisponível:", error);
            return cached;
          }
          throw error;
        });
        return cached || network;
      }),
    );
  }
});
