import { openDB } from 'idb';

const DATABASE_NAME = 'story-app-db';
const DATABASE_VERSION = 1;

const STORY_STORE = 'stories';
const PENDING_STORE = 'pending-stories';

const dbPromise = openDB(
  DATABASE_NAME,
  DATABASE_VERSION,
  {
    upgrade(database) {
      // ======================
      // STORY STORE
      // ======================

      if (
        !database.objectStoreNames.contains(
          STORY_STORE
        )
      ) {
        const storyStore =
          database.createObjectStore(
            STORY_STORE,
            {
              keyPath: 'id',
            }
          );

        // Optional index
        storyStore.createIndex(
          'name',
          'name',
          {
            unique: false,
          }
        );
      }

      // ======================
      // PENDING STORE
      // ======================

      if (
        !database.objectStoreNames.contains(
          PENDING_STORE
        )
      ) {
        database.createObjectStore(
          PENDING_STORE,
          {
            keyPath: 'id',
            autoIncrement: true,
          }
        );
      }
    },
  }
);

export const Database = {
  // ======================
  // STORY CRUD
  // ======================

  async saveStories(stories) {
    try {
      const db = await dbPromise;

      const tx = db.transaction(
        STORY_STORE,
        'readwrite'
      );

      stories.forEach((story) => {
        tx.store.put(story);
      });

      await tx.done;

      return true;
    } catch (error) {
      console.error(
        'Gagal menyimpan stories:',
        error
      );

      return false;
    }
  },

  async saveStory(story) {
    try {
      const db = await dbPromise;

      // Cegah duplikasi
      const existingStory =
        await db.get(
          STORY_STORE,
          story.id
        );

      if (existingStory) {
        return {
          success: false,
          message:
            'Story sudah tersimpan',
        };
      }

      await db.put(
        STORY_STORE,
        story
      );

      return {
        success: true,
        message:
          'Story berhasil disimpan',
      };
    } catch (error) {
      console.error(
        'Gagal menyimpan story:',
        error
      );

      return {
        success: false,
        message:
          'Gagal menyimpan story',
      };
    }
  },

  async getStories() {
    try {
      return (
        await dbPromise
      ).getAll(STORY_STORE);
    } catch (error) {
      console.error(
        'Gagal mengambil stories:',
        error
      );

      return [];
    }
  },

  async getStoryById(id) {
    try {
      return (
        await dbPromise
      ).get(STORY_STORE, id);
    } catch (error) {
      console.error(
        'Gagal mengambil story:',
        error
      );

      return null;
    }
  },

  async deleteStory(id) {
    try {
      await (
        await dbPromise
      ).delete(STORY_STORE, id);

      return {
        success: true,
        message:
          'Story berhasil dihapus',
      };
    } catch (error) {
      console.error(
        'Gagal menghapus story:',
        error
      );

      return {
        success: false,
        message:
          'Gagal menghapus story',
      };
    }
  },

  async clearStories() {
    try {
      await (
        await dbPromise
      ).clear(STORY_STORE);

      return true;
    } catch (error) {
      console.error(
        'Gagal membersihkan stories:',
        error
      );

      return false;
    }
  },

  // ======================
  // PENDING STORY CRUD
  // ======================

  async savePendingStory(story) {
    try {
      return (
        await dbPromise
      ).add(PENDING_STORE, story);
    } catch (error) {
      console.error(
        'Gagal menyimpan pending story:',
        error
      );

      return null;
    }
  },

  async getPendingStories() {
    try {
      return (
        await dbPromise
      ).getAll(PENDING_STORE);
    } catch (error) {
      console.error(
        'Gagal mengambil pending stories:',
        error
      );

      return [];
    }
  },

  async deletePendingStory(id) {
    try {
      await (
        await dbPromise
      ).delete(PENDING_STORE, id);

      return true;
    } catch (error) {
      console.error(
        'Gagal menghapus pending story:',
        error
      );

      return false;
    }
  },

  async clearPendingStories() {
    try {
      await (
        await dbPromise
      ).clear(PENDING_STORE);

      return true;
    } catch (error) {
      console.error(
        'Gagal membersihkan pending stories:',
        error
      );

      return false;
    }
  },
};