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

self.addEventListener(
  'push',
  (event) => {
    let payload = {
      title: 'Story Baru',

      options: {
        body:
          'Ada story baru ditambahkan',

        data: {},
      },
    };

    try {
      if (event.data) {
        payload =
          event.data.json();
      }
    } catch (error) {
      console.error(
        'Push payload error:',
        error
      );
    }

    const title =
      payload.title ||
      'Story App';

    const options = {
      body:
        payload.options?.body ||
        'Ada update terbaru',

      icon:
        '/icons/icon-192.png',

      badge:
        '/icons/icon-192.png',

      vibrate: [
        100,
        50,
        100,
      ],

      data:
        payload.options
          ?.data || {},

      actions: [
        {
          action: 'open',
          title: 'Buka',
        },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(
        title,
        options
      )
    );
  }
);

// ======================
// NOTIFICATION CLICK
// ======================

self.addEventListener(
  'notificationclick',
  (event) => {
    event.notification.close();

    const storyId =
      event.notification.data
        ?.storyId;

    // TARGET URL

    const targetUrl =
      storyId
        ? `${self.location.origin}/#/stories/${storyId}`
        : `${self.location.origin}/#/`;

    event.waitUntil(
      clients
        .matchAll({
          type: 'window',
          includeUncontrolled: true,
        })
        .then(
          (clientList) => {
            // APP SUDAH TERBUKA

            for (const client of clientList) {
              if (
                client.url.includes(
                  self.location.origin
                )
              ) {
                client.navigate(
                  targetUrl
                );

                return client.focus();
              }
            }

            // APP BELUM TERBUKA

            return clients.openWindow(
              targetUrl
            );
          }
        )
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