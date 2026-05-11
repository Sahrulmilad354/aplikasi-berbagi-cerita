import { openDB } from 'idb';

const DATABASE_NAME = 'story-app-db';
const DATABASE_VERSION = 1;

const STORY_STORE = 'stories';
const PENDING_STORE = 'pending-stories';

const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(database) {
    if (!database.objectStoreNames.contains(STORY_STORE)) {
      database.createObjectStore(STORY_STORE, {
        keyPath: 'id',
      });
    }

    if (!database.objectStoreNames.contains(PENDING_STORE)) {
      database.createObjectStore(PENDING_STORE, {
        keyPath: 'id',
        autoIncrement: true,
      });
    }
  },
});

export const Database = {
  async saveStories(stories) {
    const db = await dbPromise;
    const tx = db.transaction(STORY_STORE, 'readwrite');

    stories.forEach((story) => {
      tx.store.put(story);
    });

    await tx.done;
  },

  async getStories() {
    return (await dbPromise).getAll(STORY_STORE);
  },

  async deleteStory(id) {
    return (await dbPromise).delete(STORY_STORE, id);
  },

  async savePendingStory(story) {
    return (await dbPromise).add(PENDING_STORE, story);
  },

  async getPendingStories() {
    return (await dbPromise).getAll(PENDING_STORE);
  },

  async deletePendingStory(id) {
    return (await dbPromise).delete(PENDING_STORE, id);
  },
};