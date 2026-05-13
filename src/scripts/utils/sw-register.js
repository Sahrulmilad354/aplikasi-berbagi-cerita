const registerServiceWorker =
  async () => {
    if (
      !(
        'serviceWorker' in navigator
      )
    ) {
      console.log(
        'Service Worker tidak didukung browser'
      );

      return null;
    }

    try {
      // Registrasi service worker
      const registration =
        await navigator.serviceWorker.register(
          '/aplikasi-berbagi-cerita/sw.js'
        );

      console.log(
        'Service Worker berhasil didaftarkan:',
        registration
      );

      // Tunggu hingga service worker benar-benar aktif
      await navigator.serviceWorker.ready;

      console.log(
        'Service Worker siap digunakan'
      );

      return registration;
    } catch (error) {
      console.error(
        'Gagal registrasi Service Worker:',
        error
      );

      return null;
    }
  };

const getActiveServiceWorker =
  async () => {
    if (
      !(
        'serviceWorker' in navigator
      )
    ) {
      return null;
    }

    return navigator.serviceWorker.ready;
  };

export {
  registerServiceWorker,
  getActiveServiceWorker,
};