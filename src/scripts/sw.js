//
// ======================
// CACHE
// ======================
//

const CACHE_NAME =
  'story-app-v2';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',

  // ICONS
  '/icons/icon-192.png',
  '/icons/icon-512.png',
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
      'Service Worker Installed'
    );

    event.waitUntil(
      (async () => {
        const cache =
          await caches.open(
            CACHE_NAME
          );

        await cache.addAll(
          STATIC_ASSETS
        );
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
      title: 'Story Baru',
      options: {
        body:
          'Ada story baru ditambahkan',

        icon:
          '/icons/icon-192.png',

        badge:
          '/icons/icon-192.png',

        vibrate: [
          100,
          50,
          100,
        ],

        data: {
          url:
            'https://sahrulmilad354.github.io/aplikasi-berbagi-cerita/#/home',
        },
      },
    };

    //
    // PARSE PAYLOAD
    //

    if (event.data) {
      try {
        const data =
          event.data.json();

        payload = {
          title:
            data.title ||
            'Story Baru',

          options: {
            body:
              data.options
                ?.body ||
              'Ada story baru ditambahkan',

            icon:
              data.options
                ?.icon ||
              '/icons/icon-192.png',

            badge:
              data.options
                ?.badge ||
              '/icons/icon-192.png',

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
                'https://sahrulmilad354.github.io/aplikasi-berbagi-cerita/#/home',
            },
          },
        };
      } catch (error) {
        console.error(
          'Push parse error:',
          error
        );
      }
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
        ?.url ||
      'https://sahrulmilad354.github.io/aplikasi-berbagi-cerita/#/home';

    event.waitUntil(
      (async () => {
        //
        // CHECK OPENED CLIENT
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
            client.url.includes(
              '/aplikasi-berbagi-cerita'
            )
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

        await clients.openWindow(
          targetUrl
        );
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
          '/icons/icon-192.png',

        badge:
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
          // SAVE TO CACHE
          //

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