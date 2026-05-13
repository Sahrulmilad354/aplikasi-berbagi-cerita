import routes from '../routes/routes';
import { getActiveRoute } from '../routes/url-parser';

import {
  registerServiceWorker,
} from '../utils/sw-register';

import {
  initNotificationButton,
} from '../utils/notification-helper';

class App {
  #content = null;
  #drawerButton = null;
  #navigationDrawer = null;

  constructor({
    navigationDrawer,
    drawerButton,
    content,
  }) {
    this.#content = content;
    this.#drawerButton = drawerButton;
    this.#navigationDrawer =
      navigationDrawer;

    this.#setupDrawer();

    // Inisialisasi service worker
    this.#initializeServiceWorker();
  }

  #setupDrawer() {
    this.#drawerButton.addEventListener(
      'click',
      () => {
        this.#navigationDrawer.classList.toggle(
          'open'
        );
      }
    );

    document.body.addEventListener(
      'click',
      (event) => {
        if (
          !this.#navigationDrawer.contains(
            event.target
          ) &&
          !this.#drawerButton.contains(
            event.target
          )
        ) {
          this.#navigationDrawer.classList.remove(
            'open'
          );
        }

        this.#navigationDrawer
          .querySelectorAll('a')
          .forEach((link) => {
            if (
              link.contains(event.target)
            ) {
              this.#navigationDrawer.classList.remove(
                'open'
              );
            }
          });
      }
    );
  }

  async #initializeServiceWorker() {
    try {
      // Registrasi Service Worker
      await registerServiceWorker();

      // Tunggu hingga SW benar-benar aktif
      const registration =
        await navigator.serviceWorker.ready;

      console.log(
        'Service Worker ready:',
        registration
      );

      // Inisialisasi tombol notifikasi
      await initNotificationButton(
        registration
      );
    } catch (error) {
      console.error(
        'Failed initialize service worker:',
        error
      );
    }
  }

  async renderPage() {
    const url = getActiveRoute();
    const page = routes[url];

    // Fallback jika browser tidak support
    if (
      !document.startViewTransition
    ) {
      this.#content.innerHTML =
        await page.render();

      await page.afterRender();
      return;
    }

    // View Transition API
    document.startViewTransition(
      async () => {
        this.#content.innerHTML =
          await page.render();

        await page.afterRender();
      }
    );
  }
}

export default App;