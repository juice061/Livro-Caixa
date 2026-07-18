const CACHE_NAME = "livro-caixa-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "https://unpkg.com/react@18/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js",
  "https://unpkg.com/@babel/standalone/babel.min.js"
];

// Domínios de dados dinâmicos — NUNCA devem ser servidos do cache, sempre buscados na rede.
const DOMINIOS_DINAMICOS = ["supabase.co", "rss2json.com", "awesomeapi.com.br"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Cache-first com atualização em segundo plano (stale-while-revalidate) — só pro esqueleto do app.
// Chamadas de dados (Supabase, notícias, cotações) NUNCA são interceptadas: vão sempre direto pra rede.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (DOMINIOS_DINAMICOS.some((d) => event.request.url.includes(d))) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((resp) => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return resp;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
