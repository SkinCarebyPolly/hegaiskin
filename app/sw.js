const CACHE = 'sbp-app-v8';

self.addEventListener('install', function(e) {
  e.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  
  var url = e.request.url;
  
  // Nunca cachear páginas principais, API calls ou recursos externos
  if (url.includes('onboarding') || 
      url.includes('protocolo') ||
      url.includes('api.anthropic.com') ||
      url.includes('googleapis.com') ||
      url.includes('firestore') ||
      url.includes('identitytoolkit') ||
      url.includes('securetoken')) {
    return; // passa direto ao servidor
  }
  
  // Para icons, manifest e fontes: cache
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      var fetchFresh = fetch(e.request).then(function(response) {
        if (response && response.status === 200) {
          var clone = response.clone();
          caches.open(CACHE).then(function(c) { c.put(e.request, clone); });
        }
        return response;
      });
      return cached || fetchFresh;
    })
  );
});
