// Hegai Skin — Service Worker v15
const CACHE = 'hegai-v16';
const SHELL = [
  './',
  './onboarding.html',
  './protocolo.html',
  './chat.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './fonts/Raleway-Light.ttf',
  './fonts/Raleway-Regular.ttf',
  './fonts/Raleway-Italic.ttf',
  './fonts/Raleway-Medium.ttf',
  './fonts/Raleway-SemiBold.ttf',
  './fonts/Raleway-SemiBoldItalic.ttf',
  './fonts/EdhanMartine.ttf',
  './logo-hegaiskin.png'
];

// Install: pré-cache do app shell
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE)
      .then(function(c) { return c.addAll(SHELL); })
      .then(function() { return self.skipWaiting(); })
  );
});

// Activate: limpa caches antigas
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

// Fetch: cache-first para assets locais, network para externos
self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);

  // Passa direto para APIs externas (Firebase, Gemini, Google Fonts CDN)
  if (url.origin !== self.location.origin) return;

  // Cache-first com revalidação em background (stale-while-revalidate)
  e.respondWith(
    caches.open(CACHE).then(function(cache) {
      return cache.match(e.request).then(function(cached) {
        var network = fetch(e.request).then(function(fresh) {
          cache.put(e.request, fresh.clone());
          return fresh;
        }).catch(function() { return cached; });
        return cached || network;
      });
    })
  );
});
