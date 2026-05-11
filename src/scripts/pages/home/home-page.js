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
          <label
            for="search-story"
            class="sr-only"
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
      document.querySelector('#story-list');

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

      // ======================
      // SAVE TO INDEXEDDB
      // ======================

      await Database.saveStories(
        stories
      );

      renderStories({
        stories,
        map,
        container: listContainer,
      });
    } catch (error) {
      console.error(
        'Fetch stories failed:',
        error
      );

      // ======================
      // LOAD FROM INDEXEDDB
      // ======================

      stories =
        await Database.getStories();

      if (stories.length) {
        renderStories({
          stories,
          map,
          container: listContainer,
          isOffline: true,
        });
      } else {
        listContainer.innerHTML = `
          <p>
            Gagal memuat data dan
            tidak ada cache offline.
          </p>
        `;
      }
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

function renderStories({
  stories,
  map,
  container,
  isOffline = false,
}) {
  // ======================
  // RESET
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
  // OFFLINE INFO
  // ======================

  if (isOffline) {
    const offlineInfo =
      document.createElement(
        'div'
      );

    offlineInfo.innerHTML = `
      Mode offline:
      menampilkan data dari IndexedDB.
    `;

    offlineInfo.style.background =
      '#fef3c7';

    offlineInfo.style.color =
      '#92400e';

    offlineInfo.style.padding =
      '10px';

    offlineInfo.style.borderRadius =
      '8px';

    offlineInfo.style.marginBottom =
      '16px';

    container.appendChild(
      offlineInfo
    );
  }

  // ======================
  // RENDER STORY
  // ======================

  stories.forEach((story) => {
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
    // CARD
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

    item.innerHTML = `
      <img
        src="${story.photoUrl}"
        alt="Gambar cerita oleh ${story.name}"
        loading="lazy"
        style="
          width:100%;
          border-radius:12px;
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
            'Hapus cerita ini?'
          );

        if (!confirmDelete)
          return;

        await Database.deleteStory(
          story.id
        );

        item.remove();

        if (marker) {
          map.removeLayer(
            marker
          );
        }
      }
    );

    container.appendChild(item);
  });
}

export default HomePage;