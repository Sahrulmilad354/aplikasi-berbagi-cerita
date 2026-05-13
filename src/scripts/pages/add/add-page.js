import L from 'leaflet';

import { Database } from '../../data/database';

import {
  showLoading,
  closeLoading,
  showSuccess,
  showError,
} from '../../utils/alert-helper';

const AddPage = {
  async render() {
    return `
      <section class="add-story">
        <h1 class="add-story__title">
          Tambah Cerita
        </h1>

        <h2>Form Input Cerita</h2>

        <form
          id="story-form"
          class="add-story__form"
        >
          <!-- DESCRIPTION -->

          <div class="form-group">
            <label for="description">
              Deskripsi
            </label>

            <input
              type="text"
              id="description"
              placeholder="Tulis ceritamu..."
              required
            />
          </div>

          <!-- PHOTO -->

          <div class="form-group">
            <label for="photo">
              Upload Gambar
            </label>

            <input
              type="file"
              id="photo"
              accept="image/*"
            />
          </div>

          <!-- CAMERA -->

          <div class="form-group">
            <label>
              Ambil dari Kamera
            </label>

            <button
              type="button"
              id="open-camera"
              class="btn-secondary"
            >
              Buka Kamera
            </button>

            <button
              type="button"
              id="close-camera"
              class="btn-secondary"
              style="display:none;"
            >
              Tutup Kamera
            </button>

            <video
              id="camera"
              autoplay
              playsinline
              style="
                display:none;
                width:100%;
                margin-top:10px;
                border-radius:12px;
              "
            ></video>

            <canvas
              id="snapshot"
              style="display:none;"
            ></canvas>
          </div>

          <!-- MAP -->

          <div class="form-group">
            <label>
              Pilih Lokasi
            </label>

            <div
              id="map"
              class="map"
              style="
                height:400px;
                border-radius:12px;
                margin-bottom:10px;
              "
            ></div>

            <p
              id="location-info"
              class="location-info"
            >
              Klik peta untuk memilih lokasi
            </p>
          </div>

          <!-- SUBMIT -->

          <button
            type="submit"
            class="btn-primary"
            id="submit-story"
          >
            Kirim Cerita
          </button>
        </form>

        <p
          id="message"
          class="form-message"
          aria-live="polite"
        ></p>
      </section>
    `;
  },

  async afterRender() {
    // DOM

    const form =
      document.querySelector(
        '#story-form'
      );

    const message =
      document.querySelector(
        '#message'
      );

    const video =
      document.querySelector(
        '#camera'
      );

    const canvas =
      document.querySelector(
        '#snapshot'
      );

    const openCameraBtn =
      document.querySelector(
        '#open-camera'
      );

    const closeCameraBtn =
      document.querySelector(
        '#close-camera'
      );

    const photoInput =
      document.querySelector(
        '#photo'
      );

    const submitButton =
      document.querySelector(
        '#submit-story'
      );

    // STATE

    let lat = null;
    let lon = null;
    let stream = null;
    let marker = null;

    // MAP

    const map = L.map('map').setView(
      [-2.5, 118],
      5
    );

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    ).addTo(map);

    map.on('click', (e) => {
      lat = e.latlng.lat;
      lon = e.latlng.lng;

      if (marker) {
        map.removeLayer(marker);
      }

      marker = L.marker([
        lat,
        lon,
      ]).addTo(map);

      document.querySelector(
        '#location-info'
      ).innerText =
        `Lokasi: ${lat.toFixed(
          4
        )}, ${lon.toFixed(4)}`;
    });

    // STOP CAMERA

    const stopCamera = () => {
      if (stream) {
        stream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        stream = null;
      }

      video.srcObject = null;

      video.style.display =
        'none';

      closeCameraBtn.style.display =
        'none';

      openCameraBtn.style.display =
        'inline-block';
    };

    // OPEN CAMERA

    openCameraBtn.addEventListener(
      'click',
      async () => {
        try {
          stream =
            await navigator.mediaDevices.getUserMedia(
              {
                video: true,
              }
            );

          video.srcObject = stream;

          video.style.display =
            'block';

          closeCameraBtn.style.display =
            'inline-block';

          openCameraBtn.style.display =
            'none';
        } catch (error) {
          message.innerText =
            'Tidak dapat mengakses kamera';

          showError(
            'Tidak dapat mengakses kamera'
          );
        }
      }
    );

    // CLOSE CAMERA

    closeCameraBtn.addEventListener(
      'click',
      () => {
        stopCamera();
      }
    );

    // FILE INPUT

    photoInput.addEventListener(
      'change',
      () => {
        stopCamera();
      }
    );

    // RESET FORM

    const resetForm = () => {
      form.reset();

      stopCamera();

      lat = null;
      lon = null;

      if (marker) {
        map.removeLayer(marker);

        marker = null;
      }

      document.querySelector(
        '#location-info'
      ).innerText =
        'Klik peta untuk memilih lokasi';
    };

    // SUBMIT

    form.addEventListener(
      'submit',
      async (e) => {
        e.preventDefault();

        message.innerText = '';

        const description =
          document.querySelector(
            '#description'
          ).value;

        // VALIDATION

        if (!description) {
          message.innerText =
            'Deskripsi wajib diisi';

          showError(
            'Deskripsi wajib diisi'
          );

          return;
        }

        if (!lat || !lon) {
          message.innerText =
            'Silakan pilih lokasi di peta';

          showError(
            'Silakan pilih lokasi di peta'
          );

          return;
        }

        let file =
          photoInput.files[0];

        // CAMERA CAPTURE

        if (stream) {
          canvas.width =
            video.videoWidth;

          canvas.height =
            video.videoHeight;

          const ctx =
            canvas.getContext('2d');

          ctx.drawImage(
            video,
            0,
            0
          );

          const blob =
            await new Promise(
              (resolve) =>
                canvas.toBlob(
                  resolve,
                  'image/jpeg'
                )
            );

          file = new File(
            [blob],
            'camera.jpg',
            {
              type: 'image/jpeg',
            }
          );

          stopCamera();
        }

        // VALIDATE PHOTO

        if (!file) {
          message.innerText =
            'Gambar wajib dipilih';

          showError(
            'Gambar wajib dipilih'
          );

          return;
        }

        // TOKEN

        const token =
          localStorage.getItem(
            'token'
          );

        if (!token) {
          message.innerText =
            'Harus login terlebih dahulu';

          showError(
            'Harus login terlebih dahulu'
          );

          return;
        }

        // Disable button

        submitButton.disabled = true;

        submitButton.textContent =
          'Mengirim...';

        // OFFLINE MODE

        if (!navigator.onLine) {
          try {
            showLoading(
              'Menyimpan story offline...'
            );

            await Database.savePendingStory(
              {
                description,
                photoBlob: file,
                lat,
                lon,
                createdAt:
                  new Date().toISOString(),
              }
            );

            // BACKGROUND SYNC

            if (
              'serviceWorker' in
                navigator &&
              'SyncManager' in window
            ) {
              const registration =
                await navigator.serviceWorker.ready;

              await registration.sync.register(
                'sync-story'
              );
            }

            closeLoading();

            message.innerText =
              'Offline: cerita disimpan dan akan disinkronkan saat online';

            showSuccess(
              'Story disimpan offline'
            );

            resetForm();
          } catch (error) {
            console.error(error);

            closeLoading();

            message.innerText =
              'Gagal menyimpan data offline';

            showError(
              'Gagal menyimpan data offline'
            );
          }

          submitButton.disabled = false;

          submitButton.textContent =
            'Kirim Cerita';

          return;
        }

        // ONLINE SUBMIT

        const formData =
          new FormData();

        formData.append(
          'description',
          description
        );

        formData.append(
          'photo',
          file
        );

        formData.append(
          'lat',
          lat
        );

        formData.append(
          'lon',
          lon
        );

        try {
          showLoading(
            'Mengunggah story...'
          );

          const response =
            await fetch(
              'https://story-api.dicoding.dev/v1/stories',
              {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
                body: formData,
              }
            );

          const result =
            await response.json();

          closeLoading();

          submitButton.disabled = false;

          submitButton.textContent =
            'Kirim Cerita';

          if (result.error) {
            message.innerText =
              result.message;

            showError(result.message);

            return;
          }

          message.innerText =
            'Berhasil menambahkan cerita!';

          showSuccess(
            'Story berhasil ditambahkan!'
          );

          resetForm();

          setTimeout(() => {
            window.location.hash =
              '#/home';
          }, 1500);
        } catch (error) {
          console.error(error);

          closeLoading();

          submitButton.disabled = false;

          submitButton.textContent =
            'Kirim Cerita';

          message.innerText =
            'Gagal mengirim data';

          showError(
            'Gagal mengirim data'
          );
        }
      }
    );
  },
};

export default AddPage;