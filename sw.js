const CACHE_NAME = 'inventario-pro-cache-v1.1'; // Incrementa este número si actualizas los archivos
const APP_SHELL_FILES = [
  'index.html',
  'styles.css',
  'script.js',
  'manifest.json',
  'logo.png', // Asumo que el logo.png está en la raíz
  'icons/icon-192x192.png' // Ícono principal para la PWA
];

// Lista de todas las dependencias externas (CDNs)
const EXTERNAL_DEPS = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  'https://fonts.gstatic.com/s/inter/v13/UcC73FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2', // Esto es lo que google fonts realmente carga
  'https://cdn.tailwindcss.com/',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
  'https://unpkg.com/html5-qrcode',
  'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-solid-900.woff2' // El CDN de font-awesome carga esto
];

// Evento de Instalación: Se cachea el App Shell y las dependencias
self.addEventListener('install', (e) => {
  console.log('[Service Worker] Instalando...');
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Cacheando App Shell y dependencias');
      // Usamos cache.addAll() para las dependencias externas
      // Usamos cache.add() para los archivos locales
      return Promise.all([
        cache.addAll(EXTERNAL_DEPS).catch(err => console.warn('Error al cachear dependencias externas:', err)),
        cache.addAll(APP_SHELL_FILES).catch(err => console.warn('Error al cachear app shell:', err))
      ]);
    })
  );
});

// Evento de Activación: Se limpian los cachés viejos
self.addEventListener('activate', (e) => {
  console.log('[Service Worker] Activando...');
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          console.log('[Service Worker] Eliminando caché antiguo', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim();
});

// Evento Fetch: Responde desde el caché (Cache-First)
self.addEventListener('fetch', (e) => {
  // Ignoramos peticiones que no sean GET
  if (e.request.method !== 'GET') {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((response) => {
      if (response) {
        // 1. Si está en el caché, lo retornamos
        // console.log(`[Service Worker] Sirviendo desde caché: ${e.request.url}`);
        return response;
      }

      // 2. Si no está en el caché, vamos a la red
      // console.log(`[Service Worker] Buscando en red: ${e.request.url}`);
      return fetch(e.request).then((networkResponse) => {
        // (Opcional) Podemos clonar y guardar la respuesta de red en el caché
        // Pero para esta app, con un caché de "instalación" es suficiente.
        return networkResponse;
      }).catch(() => {
        // Manejo de error si falla la red (ej. offline y no está en caché)
        console.warn(`[Service Worker] Fallo de red para: ${e.request.url}`);
        // Podríamos retornar una página offline genérica aquí si quisiéramos
      });
    })
  );
});