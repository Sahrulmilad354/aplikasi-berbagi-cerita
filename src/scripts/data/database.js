import { openDB } from 'idb';

const DATABASE_NAME = 'story-app-db';
const DATABASE_VERSION = 2;

// ======================
// OBJECT STORE
// ======================

// Story yang disimpan user
const SAVED_STORY_STORE =
  'saved-stories';

// Story pending offline sync
const PENDING_STORE =
  'pending-stories';

const dbPromise = openDB(
  DATABASE_NAME,
  DATABASE_VERSION,
  {
    upgrade(
      database,
      oldVersion
    ) {
      // ======================
      // MIGRATION
      // ======================

      // Hapus store lama "stories"
      // karena sebelumnya dipakai
      // sebagai cache fetch API
      if (
        oldVersion < 2 &&
        database.objectStoreNames.contains(
          'stories'
        )
      ) {
        database.deleteObjectStore(
          'stories'
        );
      }

      // ======================
      // SAVED STORIES
      // ======================

      if (
        !database.objectStoreNames.contains(
          SAVED_STORY_STORE
        )
      ) {
        const savedStoryStore =
          database.createObjectStore(
            SAVED_STORY_STORE,
            {
              keyPath: 'id',
            }
          );

        // optional index
        savedStoryStore.createIndex(
          'name',
          'name',
          {
            unique: false,
          }
        );
      }

      // ======================
      // PENDING STORIES
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
  // SAVED STORY CRUD
  // ======================

  async saveStory(story) {
    try {
      if (!story?.id) {
        return {
          success: false,
          message:
            'ID story tidak valid',
        };
      }

      const db = await dbPromise;

      // Cek duplikasi
      const existingStory =
        await db.get(
          SAVED_STORY_STORE,
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
        SAVED_STORY_STORE,
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
      ).getAll(
        SAVED_STORY_STORE
      );
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
      ).get(
        SAVED_STORY_STORE,
        id
      );
    } catch (error) {
      console.error(
        'Gagal mengambil story:',
        error
      );

      return null;
    }
  },

  async isStorySaved(id) {
    try {
      const story =
        await (
          await dbPromise
        ).get(
          SAVED_STORY_STORE,
          id
        );

      return !!story;
    } catch (error) {
      console.error(
        'Gagal mengecek story:',
        error
      );

      return false;
    }
  },

  async deleteStory(id) {
    try {
      await (
        await dbPromise
      ).delete(
        SAVED_STORY_STORE,
        id
      );

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
      ).clear(
        SAVED_STORY_STORE
      );

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

  async savePendingStory(
    story
  ) {
    try {
      return (
        await dbPromise
      ).add(
        PENDING_STORE,
        story
      );
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
      ).getAll(
        PENDING_STORE
      );
    } catch (error) {
      console.error(
        'Gagal mengambil pending stories:',
        error
      );

      return [];
    }
  },

  async deletePendingStory(
    id
  ) {
    try {
      await (
        await dbPromise
      ).delete(
        PENDING_STORE,
        id
      );

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
      ).clear(
        PENDING_STORE
      );

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