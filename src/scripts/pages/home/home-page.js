import L from 'leaflet';
import { Database } from '../../data/database';

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',

  iconUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',

  shadowUrl:
    'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const HomePage = {
  async render() {
    return `
      <section class="home-page">
        <h1>Daftar Cerita</h1>

        <!-- ======================
             FILTER SECTION
        ======================= -->

        <section
          class="story-filter"
          aria-label="Filter cerita"
          style="
            margin-bottom:20px;
            display:flex;
            gap:12px;
            flex-wrap:wrap;
          "
        >
          <input
            id="search-story"
            type="text"
            placeholder="Cari cerita..."
            aria-label="Cari cerita"
            style="
              flex:1;
              min-width:220px;
              padding:10px;
              border-radius:8px;
            "
          />

          <select
            id="sort-story"
            aria-label="Urutkan cerita"
            style="
              padding:10px;
              border-radius:8px;
            "
          >
            <option value="newest">
              Terbaru
            </option>

            <option value="oldest">
              Terlama
            </option>
          </select>
        </section>

        <!-- ======================
             MAP
        ======================= -->

        <h2>Peta Lokasi Cerita</h2>

        <div
          id="map"
          aria-label="Peta lokasi cerita"
          style="
            height:400px;
            margin-bottom:20px;
            border-radius:12px;
          "
        ></div>

        <!-- ======================
             STORY LIST
        ======================= -->

        <h2>Daftar Cerita Pengguna</h2>

        <div
          id="story-list"
          class="story-list"
          aria-live="polite"
        >
          <p>Loading...</p>
        </div>
      </section>
    `;
  },

  async afterRender() {
    // ======================
    // INIT MAP
    // ======================

    const map = L.map('map').setView(
      [-2.5, 118],
      5
    );

    // ======================
    // TILE LAYERS
    // ======================

    const street = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; OpenStreetMap contributors',
      }
    );

    const topo = L.tileLayer(
      'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      {
        attribution:
          '&copy; OpenTopoMap contributors',
      }
    );

    street.addTo(map);

    // ======================
    // LAYER CONTROL
    // ======================

    L.control.layers({
      Street: street,
      Topography: topo,
    }).addTo(map);

    // ======================
    // DOM
    // ======================

    const listContainer =
      document.querySelector(
        '#story-list'
      );

    const searchInput =
      document.querySelector(
        '#search-story'
      );

    const sortSelect =
      document.querySelector(
        '#sort-story'
      );

    // ======================
    // TOKEN
    // ======================

    const token =
      localStorage.getItem('token');

    if (!token) {
      listContainer.innerHTML = `
        <p>
          Silakan login terlebih dahulu
        </p>
      `;

      return;
    }

    // ======================
    // STORIES STATE
    // ======================

    let stories = [];

    // ======================
    // FETCH STORIES
    // ======================

    try {
      const response = await fetch(
        'https://story-api.dicoding.dev/v1/stories?location=1',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result =
        await response.json();

      if (result.error) {
        throw new Error(
          result.message
        );
      }

      stories =
        result.listStory || [];

      renderStories({
        stories,
        map,
        container:
          listContainer,
      });
    } catch (error) {
      console.error(
        'Fetch stories failed:',
        error
      );

      listContainer.innerHTML = `
        <p>
          Gagal memuat data cerita.
          Periksa koneksi internet Anda.
        </p>
      `;
    }

    // ======================
    // SEARCH + SORT
    // ======================

    const applyFilters = () => {
      let filteredStories = [
        ...stories,
      ];

      // SEARCH
      filteredStories =
        filteredStories.filter(
          (story) =>
            story.name
              ?.toLowerCase()
              .includes(
                searchInput.value.toLowerCase()
              ) ||
            story.description
              ?.toLowerCase()
              .includes(
                searchInput.value.toLowerCase()
              )
        );

      // SORT
      filteredStories.sort(
        (a, b) => {
          if (
            sortSelect.value ===
            'newest'
          ) {
            return (
              new Date(
                b.createdAt
              ) -
              new Date(
                a.createdAt
              )
            );
          }

          return (
            new Date(
              a.createdAt
            ) -
            new Date(
              b.createdAt
            )
          );
        }
      );

      renderStories({
        stories:
          filteredStories,
        map,
        container:
          listContainer,
      });
    };

    searchInput.addEventListener(
      'input',
      applyFilters
    );

    sortSelect.addEventListener(
      'change',
      applyFilters
    );
  },
};

// ======================
// RENDER STORIES
// ======================

async function renderStories({
  stories,
  map,
  container,
}) {
  // ======================
  // RESET CONTAINER
  // ======================

  container.innerHTML = '';

  // ======================
  // REMOVE OLD MARKERS
  // ======================

  map.eachLayer((layer) => {
    if (
      layer instanceof L.Marker
    ) {
      map.removeLayer(layer);
    }
  });

  // ======================
  // EMPTY STATE
  // ======================

  if (!stories.length) {
    container.innerHTML = `
      <p>
        Tidak ada data cerita
      </p>
    `;

    return;
  }

  // ======================
  // RENDER STORY
  // ======================

  for (const story of stories) {
    // ======================
    // CHECK SAVED STATUS
    // ======================

    const isSaved =
      await Database.isStorySaved(
        story.id
      );

    // ======================
    // MARKER
    // ======================

    let marker = null;

    if (
      story.lat &&
      story.lon
    ) {
      marker = L.marker([
        story.lat,
        story.lon,
      ])
        .addTo(map)
        .bindPopup(`
          <b>${story.name}</b>
          <br/>
          ${story.description}
        `);
    }

    // ======================
    // STORY CARD
    // ======================

    const item =
      document.createElement(
        'article'
      );

    item.classList.add(
      'story-card'
    );

    item.setAttribute(
      'tabindex',
      '0'
    );

    item.setAttribute(
      'aria-label',
      `Cerita dari ${story.name}`
    );

    item.style.padding =
      '12px';

    item.style.marginBottom =
      '16px';

    item.style.borderRadius =
      '12px';

    item.style.background =
      '#ffffff';

    item.style.cursor =
      'pointer';

    item.style.boxShadow =
      '0 2px 8px rgba(0,0,0,0.1)';

    item.innerHTML = `
      <img
        src="${story.photoUrl}"
        alt="Gambar cerita oleh ${story.name}"
        loading="lazy"
        style="
          width:100%;
          border-radius:12px;
          margin-bottom:12px;
        "
      />

      <div class="story-card__content">
        <h3>${story.name}</h3>

        <p>
          ${story.description}
        </p>

        <small>
          ${new Date(
            story.createdAt
          ).toLocaleString()}
        </small>

        <br/><br/>

        <div
          style="
            display:flex;
            gap:10px;
            flex-wrap:wrap;
          "
        >
          <!-- ======================
               SAVE BUTTON
          ======================= -->

          <button
            class="save-story"
            aria-label="Simpan cerita ${story.name}"
            style="
              padding:8px 12px;
              border:none;
              border-radius:8px;
              cursor:pointer;
            "
          >
            ${
              isSaved
                ? 'Tersimpan'
                : 'Simpan'
            }
          </button>

          <!-- ======================
               DELETE BUTTON
          ======================= -->

          <button
            class="delete-story"
            data-id="${story.id}"
            aria-label="Hapus cerita ${story.name}"
            style="
              padding:8px 12px;
              border:none;
              border-radius:8px;
              cursor:pointer;
            "
          >
            Hapus
          </button>
        </div>
      </div>
    `;

    // ======================
    // CARD → MAP
    // ======================

    if (marker) {
      item.addEventListener(
        'click',
        () => {
          map.setView(
            [
              story.lat,
              story.lon,
            ],
            10
          );

          marker.openPopup();
        }
      );

      item.addEventListener(
        'keydown',
        (event) => {
          if (
            event.key === 'Enter'
          ) {
            item.click();
          }
        }
      );
    }

    // ======================
    // SAVE STORY
    // ======================

    const saveButton =
      item.querySelector(
        '.save-story'
      );

    if (isSaved) {
      saveButton.disabled =
        true;

      saveButton.style.opacity =
        '0.7';
    }

    saveButton.addEventListener(
      'click',
      async (event) => {
        event.stopPropagation();

        const result =
          await Database.saveStory(
            story
          );

        alert(result.message);

        if (result.success) {
          saveButton.textContent =
            'Tersimpan';

          saveButton.disabled =
            true;

          saveButton.style.opacity =
            '0.7';
        }
      }
    );

    // ======================
    // DELETE STORY
    // ======================

    const deleteButton =
      item.querySelector(
        '.delete-story'
      );

    deleteButton.addEventListener(
      'click',
      async (event) => {
        event.stopPropagation();

        const confirmDelete =
          confirm(
            'Hapus cerita tersimpan ini?'
          );

        if (!confirmDelete) {
          return;
        }

        const result =
          await Database.deleteStory(
            story.id
          );

        alert(result.message);

        if (result.success) {
          saveButton.textContent =
            'Simpan';

          saveButton.disabled =
            false;

          saveButton.style.opacity =
            '1';
        }
      }
    );

    container.appendChild(item);
  }
}

export default HomePage;