import { Database } from '../../data/database';

const SavedPage = {
  async render() {
    return `
      <section class="saved-page">
        <h1>Story Tersimpan</h1>

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
    // GET STORIES
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
        <p>
          Belum ada story tersimpan
        </p>
      `;

      return;
    }

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

              <br/><br/>

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
            </article>
          `
        )
        .join('');

    // ======================
    // DELETE STORY
    // ======================

    document
      .querySelectorAll(
        '.delete-story-btn'
      )
      .forEach((button) => {
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

              if (result.success) {
                alert(
                  result.message
                );

                // Re-render page
                this.afterRender();
              } else {
                alert(
                  result.message
                );
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
      });
  },
};

export default SavedPage;