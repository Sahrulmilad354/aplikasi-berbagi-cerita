/* eslint-disable no-restricted-globals */

//
// ======================
// CACHE
// ======================
//

const CACHE_NAME =
  'story-app-v3';

const BASE_PATH =
  '/aplikasi-berbagi-cerita';

const HOME_URL =
  'https://sahrulmilad354.github.io/aplikasi-berbagi-cerita/#/home';

const STATIC_ASSETS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/index.html`,
  `${BASE_PATH}/manifest.webmanifest`,

  // ICONS
  `${BASE_PATH}/icons/icon-192.png`,
  `${BASE_PATH}/icons/icon-512.png`,
];

//
// ======================
// INSTALL
// ======================
//

self.addEventListener(
  'install',
  (event) => {
    console.log(
      '[SW] Installed'
    );

    event.waitUntil(
      (async () => {
        try {
          const cache =
            await caches.open(
              CACHE_NAME
            );

          await cache.addAll(
            STATIC_ASSETS
          );
        } catch (error) {
          console.error(
            '[SW] Cache install failed:',
            error
          );
        }
      })()
    );

    self.skipWaiting();
  }
);

//
// ======================
// ACTIVATE
// ======================
//

self.addEventListener(
  'activate',
  (event) => {
    console.log(
      '[SW] Activated'
    );

    event.waitUntil(
      (async () => {
        try {
          //
          // DELETE OLD CACHE
          //

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
        } catch (error) {
          console.error(
            '[SW] Activate failed:',
            error
          );
        }
      })()
    );
  }
);

//
// ======================
// PUSH NOTIFICATION
// ======================
//

self.addEventListener(
  'push',
  (event) => {
    console.log(
      '[SW] Push received'
    );

    //
    // DEFAULT PAYLOAD
    //

    let payload = {
      title:
        'Story berhasil dibuat',

      options: {
        body:
          'Anda telah membuat story baru',

        icon:
          `${BASE_PATH}/icons/icon-192.png`,

        badge:
          `${BASE_PATH}/icons/icon-192.png`,

        vibrate: [
          100,
          50,
          100,
        ],

        data: {
          url: HOME_URL,
        },
      },
    };

    //
    // PARSE PAYLOAD
    //

    try {
      if (event.data) {
        const data =
          event.data.json();

        payload = {
          title:
            data.title ||
            payload.title,

          options: {
            body:
              data.options
                ?.body ||
              payload.options
                .body,

            icon:
              data.options
                ?.icon ||
              payload.options
                .icon,

            badge:
              data.options
                ?.badge ||
              payload.options
                .badge,

            vibrate: [
              100,
              50,
              100,
            ],

            data: {
              url:
                data.options
                  ?.data
                  ?.url ||
                HOME_URL,
            },
          },
        };
      }
    } catch (error) {
      console.error(
        '[SW] Push parse error:',
        error
      );
    }

    //
    // SHOW NOTIFICATION
    //

    event.waitUntil(
      self.registration.showNotification(
        payload.title,
        payload.options
      )
    );
  }
);

//
// ======================
// NOTIFICATION CLICK
// ======================
//

self.addEventListener(
  'notificationclick',
  (event) => {
    console.log(
      '[SW] Notification clicked'
    );

    event.notification.close();

    const targetUrl =
      event.notification.data
        ?.url || HOME_URL;

    event.waitUntil(
      (async () => {
        try {
          //
          // CHECK OPENED CLIENTS
          //

          const clientList =
            await clients.matchAll({
              type: 'window',
              includeUncontrolled: true,
            });

          //
          // FOCUS EXISTING TAB
          //

          for (const client of clientList) {
            if (
              'focus' in client
            ) {
              await client.focus();

              //
              // REDIRECT TO HOME
              //

              if (
                'navigate' in client
              ) {
                await client.navigate(
                  targetUrl
                );
              }

              return;
            }
          }

          //
          // OPEN NEW TAB
          //

          if (
            clients.openWindow
          ) {
            await clients.openWindow(
              targetUrl
            );
          }
        } catch (error) {
          console.error(
            '[SW] Notification click failed:',
            error
          );
        }
      })()
    );
  }
);

//
// ======================
// BACKGROUND SYNC
// ======================
//

self.addEventListener(
  'sync',
  (event) => {
    console.log(
      '[SW] Background Sync:',
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

//
// ======================
// SYNC FUNCTION
// ======================
//

async function syncPendingStories() {
  try {
    //
    // SEND MESSAGE TO CLIENT
    //

    const allClients =
      await clients.matchAll({
        includeUncontrolled: true,
      });

    allClients.forEach(
      (client) => {
        client.postMessage({
          type:
            'SYNC_PENDING_STORIES',
        });
      }
    );

    //
    // OPTIONAL NOTIFICATION
    //

    await self.registration.showNotification(
      'Sinkronisasi Berhasil',
      {
        body:
          'Story offline berhasil disinkronkan',

        icon:
          `${BASE_PATH}/icons/icon-192.png`,

        badge:
          `${BASE_PATH}/icons/icon-192.png`,
      }
    );
  } catch (error) {
    console.error(
      '[SW] Sync failed:',
      error
    );
  }
}

//
// ======================
// FETCH
// ======================
//

self.addEventListener(
  'fetch',
  (event) => {
    //
    // ONLY GET
    //

    if (
      event.request.method !==
      'GET'
    ) {
      return;
    }

    event.respondWith(
      (async () => {
        //
        // CACHE FIRST
        //

        const cachedResponse =
          await caches.match(
            event.request
          );

        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          //
          // NETWORK REQUEST
          //

          const response =
            await fetch(
              event.request
            );

          //
          // ONLY CACHE VALID RESPONSE
          //

          if (
            response &&
            response.status === 200
          ) {
            const cache =
              await caches.open(
                CACHE_NAME
              );

            cache.put(
              event.request,
              response.clone()
            );
          }

          return response;
        } catch (error) {
          console.error(
            '[SW] Fetch failed:',
            error
          );

          //
          // OFFLINE FALLBACK
          //

          if (
            event.request
              .mode ===
            'navigate'
          ) {
            return new Response(
              `
              <html>
                <head>
                  <title>Offline</title>
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

          //
          // GENERIC FALLBACK
          //

          return new Response(
            'Offline mode aktif',
            {
              status: 503,
              statusText:
                'Offline',
            }
          );
        }
      })()
    );
  }
);

//
// ======================
// MESSAGE FROM CLIENT
// ======================
//

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