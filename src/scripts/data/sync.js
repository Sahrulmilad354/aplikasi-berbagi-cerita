import { Database } from './database';
import { addStory } from './api';

export async function syncPendingStories() {
  if (!navigator.onLine) return;

  const pendingStories = await Database.getPendingStories();

  for (const story of pendingStories) {
    try {
      const formData = new FormData();

      formData.append('description', story.description);
      formData.append('photo', story.photoBlob);

      if (story.lat) {
        formData.append('lat', story.lat);
      }

      if (story.lon) {
        formData.append('lon', story.lon);
      }

      await addStory(formData);

      await Database.deletePendingStory(story.id);

      console.log('Story synced');
    } catch (error) {
      console.error('Sync failed', error);
    }
  }
}