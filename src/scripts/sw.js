// ======================
// CACHE
// ======================

const CACHE_NAME =
  'story-app-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ======================
// INSTALL
// ======================

self.addEventListener(
  'install',
  (event) => {
    console.log(
      'Service Worker Installed'
    );

    event.waitUntil(
      caches.open(CACHE_NAME).then(
        (cache) => {
          return cache.addAll(
            STATIC_ASSETS
          );
        }
      )
    );

    self.skipWaiting();
  }
);

// ======================
// ACTIVATE
// ======================

self.addEventListener(
  'activate',
  (event) => {
    console.log(
      'Service Worker Activated'
    );

    event.waitUntil(
      (async () => {
        // DELETE OLD CACHE

        const cacheNames =
          await caches.keys();

        await Promise.all(
          cacheNames.map(
            (cache) => {
              if (
                cache !==
                CACHE_NAME
              ) {
                return caches.delete(
                  cache
                );
              }

              return null;
            }
          )
        );

        await clients.claim();
      })()
    );
  }
);

// ======================
// PUSH NOTIFICATION
// ======================

self.addEventListener('push', (event) => {
  let payload = {
    title: 'Story Baru',
    options: {
      body: 'Ada story baru ditambahkan',
      icon: '/aplikasi-berbagi-cerita/icons/icon-192.png',
      badge: '/aplikasi-berbagi-cerita/icons/icon-192.png',

      // URL tujuan ketika notifikasi diklik
      data: {
        url: 'https://sahrulmilad354.github.io/aplikasi-berbagi-cerita/#/home',
      },
    },
  };

  try {
    payload = event.data.json();
  } catch (error) {
    console.error('Push payload error:', error);
  }

  event.waitUntil(
    self.registration.showNotification(
      payload.title,
      {
        ...payload.options,

        // fallback agar tetap ada URL
        data: {
          url:
            payload.options?.data?.url ||
            'https://sahrulmilad354.github.io/aplikasi-berbagi-cerita/#/home',
        },
      }
    )
  );
});

// ======================
// NOTIFICATION CLICK
// ======================

self.addEventListener(
  'notificationclick',
  (event) => {
    event.notification.close();

    // URL home terbaru
    const targetUrl =
      'https://sahrulmilad354.github.io/aplikasi-berbagi-cerita/#/home';

    event.waitUntil(
      (async () => {
        // Ambil semua tab aplikasi
        const clientList =
          await clients.matchAll({
            type: 'window',
            includeUncontrolled: true,
          });

        // Jika aplikasi sudah terbuka
        for (const client of clientList) {
          // Cocokkan aplikasi GitHub Pages
          if (
            client.url.includes(
              '/aplikasi-berbagi-cerita'
            )
          ) {
            // Fokus ke tab
            await client.focus();

            // Paksa navigasi ke halaman home terbaru
            await client.navigate(
              targetUrl
            );

            return;
          }
        }

        // Jika belum ada tab aplikasi
        await clients.openWindow(
          targetUrl
        );
      })()
    );
  }
);

// ======================
// BACKGROUND SYNC
// ======================

self.addEventListener(
  'sync',
  (event) => {
    console.log(
      'Background Sync:',
      event.tag
    );

    if (
      event.tag ===
      'sync-story'
    ) {
      event.waitUntil(
        syncPendingStories()
      );
    }
  }
);

// ======================
// SYNC FUNCTION
// ======================

async function syncPendingStories() {
  try {
    // TRIGGER APP SYNC

    const allClients =
      await clients.matchAll({
        includeUncontrolled: true,
      });

    allClients.forEach(
      (client) => {
        client.postMessage({
          type: 'SYNC_PENDING_STORIES',
        });
      }
    );

    // OPTIONAL NOTIFICATION

    self.registration.showNotification(
      'Sinkronisasi Berhasil',
      {
        body:
          'Story offline berhasil disinkronkan',

        icon:
          '/icons/icon-192.png',
      }
    );
  } catch (error) {
    console.error(
      'Sync failed:',
      error
    );
  }
}

// ======================
// FETCH
// ======================

self.addEventListener(
  'fetch',
  (event) => {
    // HANYA GET

    if (
      event.request.method !==
      'GET'
    ) {
      return;
    }

    event.respondWith(
      caches
        .match(event.request)
        .then(
          async (
            cachedResponse
          ) => {
            // CACHE FIRST

            if (
              cachedResponse
            ) {
              return cachedResponse;
            }

            try {
              // NETWORK

              const response =
                await fetch(
                  event.request
                );

              // SIMPAN KE CACHE

              const cache =
                await caches.open(
                  CACHE_NAME
                );

              cache.put(
                event.request,
                response.clone()
              );

              return response;
            } catch (error) {
              console.error(
                'Fetch failed:',
                error
              );

              // OFFLINE PAGE

              if (
                event.request
                  .mode ===
                'navigate'
              ) {
                return new Response(
                  `
                  <html>
                    <head>
                      <title>
                        Offline
                      </title>
                    </head>

                    <body
                      style="
                        font-family:sans-serif;
                        padding:20px;
                        text-align:center;
                      "
                    >
                      <h1>
                        Offline
                      </h1>

                      <p>
                        Aplikasi sedang offline.
                      </p>

                      <p>
                        Silakan cek koneksi internet Anda.
                      </p>
                    </body>
                  </html>
                  `,
                  {
                    headers: {
                      'Content-Type':
                        'text/html',
                    },
                  }
                );
              }

              // FALLBACK RESPONSE

              return new Response(
                'Offline mode aktif',
                {
                  status: 503,
                  statusText:
                    'Offline',
                }
              );
            }
          }
        )
    );
  }
);

// ======================
// MESSAGE FROM CLIENT
// ======================

self.addEventListener(
  'message',
  (event) => {
    if (
      event.data &&
      event.data.type ===
        'SKIP_WAITING'
    ) {
      self.skipWaiting();
    }
  }
);