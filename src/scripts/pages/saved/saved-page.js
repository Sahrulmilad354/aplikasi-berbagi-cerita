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

        <!-- ======================
             STORY LIST
        ======================= -->

        <div
          id="saved-stories"
          class="story-list"
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
    // RESET CONTAINER
    // ======================

    container.innerHTML = '';

    // ======================
    // RENDER STORIES
    // ======================

    stories.forEach((story) => {
      const item =
        document.createElement(
          'article'
        );

      // ======================
      // SAME STYLE AS HOME
      // ======================

      item.classList.add(
        'story-card'
      );

      item.setAttribute(
        'tabindex',
        '0'
      );

      item.setAttribute(
        'aria-label',
        `Story dari ${story.name}`
      );

      item.style.padding =
        '12px';

      item.style.marginBottom =
        '16px';

      item.style.borderRadius =
        '12px';

      item.style.background =
        '#ffffff';

      item.style.boxShadow =
        '0 2px 8px rgba(0,0,0,0.1)';

      item.innerHTML = `
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

        <div class="story-card__content">
          <h3>
            ${story.name}
          </h3>

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

          <br/><br/>

          <!-- ======================
               ACTION BUTTON
          ======================= -->

          <div
            style="
              display:flex;
              gap:10px;
              flex-wrap:wrap;
            "
          >
            <button
              class="delete-story-btn"
              data-id="${story.id}"
              aria-label="Hapus story ${story.name}"
              style="
                padding:8px 12px;
                border:none;
                border-radius:8px;
                cursor:pointer;
              "
            >
              Hapus Story
            </button>
          </div>
        </div>
      `;

      // ======================
      // DELETE STORY
      // ======================

      const deleteButton =
        item.querySelector(
          '.delete-story-btn'
        );

      deleteButton.addEventListener(
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
                story.id
              );

            alert(
              result.message
            );

            if (result.success) {
              // Remove card directly
              item.remove();

              // Empty state
              if (
                !container.children
                  .length
              ) {
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
              }
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

      container.appendChild(item);
    });
  },
};

export default SavedPage;