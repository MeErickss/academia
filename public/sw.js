/*
 * Service worker do Girassol: deixa o app abrir mesmo com internet ruim na academia.
 * - Páginas: tenta a internet primeiro (pra pegar atualizações), cai no cache se falhar.
 * - Arquivos com hash do Next, fotos dos exercícios e ícones: cache primeiro.
 * Os dados dela não passam por aqui — ficam no IndexedDB.
 */
const VERSION = "girassol-v2";
const PAGES = ["/", "/fichas", "/evolucao", "/corpo", "/ajustes", "/treino", "/treino/resumo", "/exercicio", "/fichas/editar", "/comida"];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(VERSION).then((cache) => Promise.all(PAGES.map((p) => cache.add(p).catch(() => undefined)))),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isStatic(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/exercicios/") ||
    url.pathname.startsWith("/icons/")
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (isStatic(url)) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(VERSION).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Páginas e o resto: rede primeiro, cache como reserva.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && (req.mode === "navigate" || url.pathname.endsWith(".txt") || url.pathname.endsWith(".webmanifest"))) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches
          .match(req, { ignoreSearch: true })
          .then((hit) => hit || (req.mode === "navigate" ? caches.match("/") : undefined))
          .then((hit) => hit || new Response("Sem internet", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } })),
      ),
  );
});
