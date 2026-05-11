import {
  sendSubscriptionToServer,
  removeSubscriptionFromServer,
} from '../data/api';

const VAPID_PUBLIC_KEY =
  'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);

  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export async function isCurrentPushSubscriptionAvailable() {
  const registration = await navigator.serviceWorker.ready;

  const subscription =
    await registration.pushManager.getSubscription();

  return !!subscription;
}

export async function subscribePushNotification() {
  try {
    const registration =
      await navigator.serviceWorker.ready;

    // CEK existing subscription
    let subscription =
      await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription =
        await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey:
            urlBase64ToUint8Array(
              VAPID_PUBLIC_KEY
            ),
        });
    }

    await sendSubscriptionToServer(
      subscription
    );

    console.log(
      'Successfully subscribed'
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

export async function unsubscribePushNotification() {
  try {
    const registration = await navigator.serviceWorker.ready;

    const subscription =
      await registration.pushManager.getSubscription();

    if (!subscription) {
      return true;
    }

    await removeSubscriptionFromServer(subscription);

    await subscription.unsubscribe();

    return true;
  } catch (error) {
    console.error('Unsubscribe failed:', error);

    return false;
  }
}