import { Database } from '../../data/database';

const SavedPage = {
  async render() {
    return `
      <section class="saved-page">
        <h1>Story Tersimpan</h1>

        <p
          style="
            margin-bottom:20px;
            color:#555;
          "
        >
          Daftar story yang telah Anda simpan.
        </p>

        <div
          id="saved-stories"
          class="saved-stories"
          aria-live="polite"
        >
          <p>Loading...</p>
        </div>
      </section>
    `;
  },

  async afterRender() {
    const container =
      document.querySelector(
        '#saved-stories'
      );

    // ======================
    // LOADING STATE
    // ======================

    container.innerHTML = `
      <p>Loading...</p>
    `;

    // ======================
    // GET SAVED STORIES
    // ======================

    let stories = [];

    try {
      stories =
        await Database.getStories();
    } catch (error) {
      console.error(
        'Gagal mengambil story:',
        error
      );

      container.innerHTML = `
        <p>
          Gagal memuat story tersimpan
        </p>
      `;

      return;
    }

    // ======================
    // EMPTY STATE
    // ======================

    if (!stories.length) {
      container.innerHTML = `
        <div
          style="
            background:#ffffff;
            padding:20px;
            border-radius:12px;
            box-shadow:
              0 2px 8px rgba(0,0,0,0.1);
          "
        >
          <p>
            Belum ada story tersimpan
          </p>
        </div>
      `;

      return;
    }

    // ======================
    // SORT STORIES
    // ======================

    stories.sort((a, b) => {
      return (
        new Date(
          b.createdAt
        ) -
        new Date(
          a.createdAt
        )
      );
    });

    // ======================
    // RENDER STORIES
    // ======================

    container.innerHTML =
      stories
        .map(
          (story) => `
            <article
              class="story-item"
              tabindex="0"
              aria-label="Story dari ${story.name}"
              style="
                background:#ffffff;
                border-radius:12px;
                padding:16px;
                margin-bottom:20px;
                box-shadow:
                  0 2px 8px rgba(0,0,0,0.1);
              "
            >
              <!-- ======================
                   IMAGE
              ======================= -->

              <img
                src="${story.photoUrl}"
                alt="Gambar story ${story.name}"
                loading="lazy"
                style="
                  width:100%;
                  border-radius:12px;
                  margin-bottom:12px;
                "
              />

              <!-- ======================
                   CONTENT
              ======================= -->

              <div
                class="story-content"
              >
                <h2>
                  ${story.name}
                </h2>

                <p>
                  ${story.description}
                </p>

                <small>
                  ${new Date(
                    story.createdAt
                  ).toLocaleString()}
                </small>

                ${
                  story.lat &&
                  story.lon
                    ? `
                  <p
                    style="
                      margin-top:8px;
                      font-size:14px;
                      color:#555;
                    "
                  >
                    Lokasi:
                    ${story.lat},
                    ${story.lon}
                  </p>
                `
                    : ''
                }

                <br/>

                <!-- ======================
                     ACTION BUTTON
                ======================= -->

                <div
                  style="
                    display:flex;
                    gap:10px;
                    flex-wrap:wrap;
                    margin-top:12px;
                  "
                >
                  <button
                    class="delete-story-btn"
                    data-id="${story.id}"
                    aria-label="Hapus story ${story.name}"
                    style="
                      padding:10px 14px;
                      border:none;
                      border-radius:8px;
                      cursor:pointer;
                    "
                  >
                    Hapus Story
                  </button>
                </div>
              </div>
            </article>
          `
        )
        .join('');

    // ======================
    // DELETE STORY
    // ======================

    const deleteButtons =
      document.querySelectorAll(
        '.delete-story-btn'
      );

    deleteButtons.forEach(
      (button) => {
        button.addEventListener(
          'click',
          async (event) => {
            event.preventDefault();

            const confirmDelete =
              confirm(
                'Yakin ingin menghapus story ini?'
              );

            if (!confirmDelete) {
              return;
            }

            try {
              const result =
                await Database.deleteStory(
                  button.dataset.id
                );

              alert(
                result.message
              );

              if (result.success) {
                // Re-render
                await this.afterRender();
              }
            } catch (error) {
              console.error(
                'Gagal menghapus story:',
                error
              );

              alert(
                'Terjadi kesalahan saat menghapus story'
              );
            }
          }
        );
      }
    );
  },
};

export default SavedPage;