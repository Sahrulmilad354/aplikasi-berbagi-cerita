import {
  sendSubscriptionToServer,
  removeSubscriptionFromServer,
} from '../data/api';

const VAPID_PUBLIC_KEY =
  'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

// ======================
// CONVERT VAPID KEY
// ======================

function urlBase64ToUint8Array(
  base64String
) {
  const padding = '='.repeat(
    (4 - (base64String.length % 4)) %
      4
  );

  const base64 = (
    base64String + padding
  )
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData =
    window.atob(base64);

  const outputArray =
    new Uint8Array(rawData.length);

  for (
    let i = 0;
    i < rawData.length;
    ++i
  ) {
    outputArray[i] =
      rawData.charCodeAt(i);
  }

  return outputArray;
}

// ======================
// CHECK SUBSCRIPTION
// ======================

export async function isCurrentPushSubscriptionAvailable() {
  try {
    // Pastikan SW benar-benar ready
    const registration =
      await navigator.serviceWorker.ready;

    const subscription =
      await registration.pushManager.getSubscription();

    return !!subscription;
  } catch (error) {
    console.error(
      'Check subscription failed:',
      error
    );

    return false;
  }
}

// ======================
// SUBSCRIBE
// ======================

export async function subscribePushNotification(
  registrationParam = null
) {
  try {
    // Gunakan registration dari parameter
    // jika tersedia
    const registration =
      registrationParam ||
      (await navigator.serviceWorker.ready);

    if (!registration) {
      throw new Error(
        'Service Worker belum siap'
      );
    }

    // Request permission
    const permission =
      await Notification.requestPermission();

    if (permission !== 'granted') {
      console.warn(
        'Notification permission denied'
      );

      return false;
    }

    // Cek existing subscription
    let subscription =
      await registration.pushManager.getSubscription();

    // Jika belum subscribe
    if (!subscription) {
      subscription =
        await registration.pushManager.subscribe(
          {
            userVisibleOnly: true,

            applicationServerKey:
              urlBase64ToUint8Array(
                VAPID_PUBLIC_KEY
              ),
          }
        );
    }

    // Kirim ke backend
    await sendSubscriptionToServer(
      subscription
    );

    console.log(
      'Successfully subscribed:',
      subscription
    );

    return true;
  } catch (error) {
    console.error(
      'Subscribe failed:',
      error
    );

    return false;
  }
}

// ======================
// UNSUBSCRIBE
// ======================

export async function unsubscribePushNotification(
  registrationParam = null
) {
  try {
    // Gunakan registration dari parameter
    // jika tersedia
    const registration =
      registrationParam ||
      (await navigator.serviceWorker.ready);

    if (!registration) {
      throw new Error(
        'Service Worker belum siap'
      );
    }

    const subscription =
      await registration.pushManager.getSubscription();

    // Jika belum subscribe
    if (!subscription) {
      return true;
    }

    // Hapus dari backend
    await removeSubscriptionFromServer(
      subscription
    );

    // Hapus dari browser
    await subscription.unsubscribe();

    console.log(
      'Successfully unsubscribed'
    );

    return true;
  } catch (error) {
    console.error(
      'Unsubscribe failed:',
      error
    );

    return false;
  }
}

// ======================
// INIT NOTIFICATION BUTTON
// ======================

export async function initNotificationButton(
  registration
) {
  const notificationButton =
    document.querySelector(
      '#notification-button'
    );

  // Jika tombol tidak ada
  if (!notificationButton) {
    return;
  }

  // Cek status subscription awal
  const isSubscribed =
    await isCurrentPushSubscriptionAvailable();

  updateNotificationButton(
    notificationButton,
    isSubscribed
  );

  // Hindari duplicate listener
  notificationButton.replaceWith(
    notificationButton.cloneNode(true)
  );

  const newButton =
    document.querySelector(
      '#notification-button'
    );

  // Event klik tombol
  newButton.addEventListener(
    'click',
    async () => {
      const subscribed =
        await isCurrentPushSubscriptionAvailable();

      let success = false;

      if (subscribed) {
        success =
          await unsubscribePushNotification(
            registration
          );
      } else {
        success =
          await subscribePushNotification(
            registration
          );
      }

      // Refresh state tombol
      if (success) {
        const latestState =
          await isCurrentPushSubscriptionAvailable();

        updateNotificationButton(
          newButton,
          latestState
        );
      }
    }
  );
}

// ======================
// UPDATE BUTTON UI
// ======================

function updateNotificationButton(
  button,
  isSubscribed
) {
  button.textContent =
    isSubscribed
      ? 'Nonaktifkan Notifikasi'
      : 'Aktifkan Notifikasi';

  button.setAttribute(
    'aria-label',
    isSubscribed
      ? 'Nonaktifkan notifikasi'
      : 'Aktifkan notifikasi'
  );
}