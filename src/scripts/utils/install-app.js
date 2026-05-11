let deferredPrompt = null;

export function initInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();

    deferredPrompt = event;

    showInstallButton();
  });
}

function showInstallButton() {
  let installButton = document.getElementById('installApp');

  if (!installButton) {
    installButton = document.createElement('button');

    installButton.id = 'installApp';
    installButton.innerText = 'Install App';

    installButton.style.position = 'fixed';
    installButton.style.bottom = '20px';
    installButton.style.right = '20px';
    installButton.style.zIndex = '9999';

    document.body.appendChild(installButton);

    installButton.addEventListener('click', async () => {
      if (!deferredPrompt) return;

      deferredPrompt.prompt();

      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('Aplikasi diinstall');
      }

      deferredPrompt = null;

      installButton.remove();
    });
  }
}