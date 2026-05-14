import App from './app';

import '../styles/main.scss';
import 'leaflet/dist/leaflet.css';

import {
  subscribePushNotification,
  unsubscribePushNotification,
  isCurrentPushSubscriptionAvailable,
} from './utils/notification-helper';

import { syncPendingStories } from './data/sync';

/* =========================
   PWA INSTALL PROMPT
========================= */

let deferredPrompt = null;

// buat tombol install
const installButton = document.createElement(
  'button'
);

installButton.textContent =
  '📲 Install App';

installButton.style.position =
  'fixed';

installButton.style.bottom =
  '20px';

installButton.style.right =
  '20px';

installButton.style.zIndex =
  '9999';

installButton.style.padding =
  '12px 20px';

installButton.style.border =
  'none';

installButton.style.borderRadius =
  '10px';

installButton.style.background =
  '#2563eb';

installButton.style.color =
  'white';

installButton.style.fontWeight =
  'bold';

installButton.style.cursor =
  'pointer';

installButton.style.display =
  'none';

document.body.appendChild(
  installButton
);

// tangkap event install
window.addEventListener(
  'beforeinstallprompt',
  (event) => {
    console.log(
      'PWA install available'
    );

    event.preventDefault();

    deferredPrompt = event;

    installButton.style.display =
      'block';
  }
);

// klik tombol install
installButton.addEventListener(
  'click',
  async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const {
      outcome,
    } =
      await deferredPrompt.userChoice;

    console.log(
      'Install result:',
      outcome
    );

    deferredPrompt = null;

    installButton.style.display =
      'none';
  }
);

// setelah berhasil install
window.addEventListener(
  'appinstalled',
  () => {
    console.log(
      'PWA installed'
    );

    installButton.style.display =
      'none';
  }
);

// ======================
// INIT APP
// ======================

document.addEventListener(
  'DOMContentLoaded',
  async () => {
    // INIT ROUTER APP

    App.init();

    // NAVBAR

    updateNavbar();

    // REGISTER SERVICE WORKER

    await registerServiceWorker();

    // PUSH NOTIFICATION

    await setupNotificationButton();

    // SYNC DATA

    await syncPendingStories();

    // ONLINE EVENT

    window.addEventListener(
      'online',
      async () => {
        console.log(
          'Kembali online'
        );

        showOnlineStatus(
          'Koneksi kembali online'
        );

        await syncPendingStories();
      }
    );

    // OFFLINE EVENT

    window.addEventListener(
      'offline',
      () => {
        console.log(
          'Offline mode'
        );

        showOnlineStatus(
          'Mode offline aktif'
        );
      }
    );
  }
);

// ======================
// REGISTER SERVICE WORKER
// ======================

async function registerServiceWorker() {
  if (
    !(
      'serviceWorker' in
      navigator
    )
  ) {
    console.warn(
      'Service Worker tidak didukung browser'
    );

    return;
  }

  try {
    const registration =
      await navigator.serviceWorker.register(
        '/aplikasi-berbagi-cerita/sw.js'
      );

    console.log(
      'Service Worker berhasil didaftarkan:',
      registration
    );

    // BACKGROUND SYNC READY

    if (
      registration &&
      'sync' in registration
    ) {
      console.log(
        'Background Sync supported'
      );
    }

    // UPDATE FOUND

    registration.addEventListener(
      'updatefound',
      () => {
        console.log(
          'Service Worker update ditemukan'
        );
      }
    );
  } catch (error) {
    console.error(
      'Service Worker registration failed:',
      error
    );
  }
}

// ======================
// ONLINE / OFFLINE INFO
// ======================

function showOnlineStatus(
  text
) {
  let status =
    document.getElementById(
      'network-status'
    );

  if (!status) {
    status =
      document.createElement(
        'div'
      );

    status.id =
      'network-status';

    status.style.position =
      'fixed';

    status.style.top =
      '20px';

    status.style.right =
      '20px';

    status.style.zIndex =
      '9999';

    status.style.padding =
      '12px 16px';

    status.style.borderRadius =
      '12px';

    status.style.color =
      '#ffffff';

    status.style.fontWeight =
      'bold';

    status.style.boxShadow =
      '0 4px 10px rgba(0,0,0,0.2)';

    document.body.appendChild(
      status
    );
  }

  // COLOR

  if (navigator.onLine) {
    status.style.background =
      '#16a34a';
  } else {
    status.style.background =
      '#dc2626';
  }

  status.innerText = text;

  // AUTO HIDE

  clearTimeout(
    status.hideTimeout
  );

  status.hideTimeout =
    setTimeout(() => {
      status.remove();
    }, 3000);
}

// ======================
// NAVBAR
// ======================

function updateNavbar() {
  const token =
    localStorage.getItem(
      'token'
    );

  const authMenu =
    document.getElementById(
      'auth-menu'
    );

  if (!authMenu) return;

  if (token) {
    authMenu.innerHTML = `
      <a
        href="#"
        id="logout-btn"
      >
        Logout
      </a>
    `;
  } else {
    authMenu.innerHTML = `
      <a href="#/login">
        Login
      </a>

      <a href="#/register">
        Register
      </a>
    `;
  }
}

// ======================
// LOGOUT
// ======================

document.addEventListener(
  'click',
  (e) => {
    if (
      e.target.id ===
      'logout-btn'
    ) {
      localStorage.removeItem(
        'token'
      );

      window.location.hash =
        '#/login';

      updateNavbar();

      showOnlineStatus(
        'Berhasil logout'
      );
    }
  }
);

window.addEventListener(
  'hashchange',
  updateNavbar
);

// ======================
// PUSH NOTIFICATION
// ======================

async function setupNotificationButton() {
  const button =
    document.getElementById(
      'notification-button'
    );

  if (!button) return;

  const text =
    button.querySelector(
      '.notification-text'
    );

  const icon =
    button.querySelector(
      '.notification-icon'
    );

  async function updateButtonState() {
    const isSubscribed =
      await isCurrentPushSubscriptionAvailable();

    if (isSubscribed) {
      button.classList.add(
        'active'
      );

      if (text) {
        text.textContent =
          'ON';
      }

      if (icon) {
        icon.textContent =
          '🔔';
      }
    } else {
      button.classList.remove(
        'active'
      );

      if (text) {
        text.textContent =
          'OFF';
      }

      if (icon) {
        icon.textContent =
          '🔕';
      }
    }
  }

  await updateButtonState();

  // HINDARI DUPLICATE LISTENER

  const newButton =
    button.cloneNode(true);

  button.parentNode.replaceChild(
    newButton,
    button
  );

  newButton.addEventListener(
    'click',
    async () => {
      try {
        if (
          !(
            'Notification' in
            window
          )
        ) {
          alert(
            'Browser tidak mendukung notification'
          );

          return;
        }

        const permission =
          await Notification.requestPermission();

        if (
          permission !==
          'granted'
        ) {
          alert(
            'Izin notification ditolak'
          );

          return;
        }

        const isSubscribed =
          await isCurrentPushSubscriptionAvailable();

        if (
          isSubscribed
        ) {
          const success =
            await unsubscribePushNotification();

          if (success) {
            console.log(
              'Notification disabled'
            );
          }
        } else {
          const success =
            await subscribePushNotification();

          if (success) {
            console.log(
              'Notification enabled'
            );
          }
        }

        await setupNotificationButton();
      } catch (error) {
        console.error(
          'Notification toggle error:',
          error
        );

        showOnlineStatus(
          'Gagal mengubah notification'
        );
      }
    }
  );
}