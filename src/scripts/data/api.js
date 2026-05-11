import CONFIG from '../config';

const BASE_URL =
  'https://story-api.dicoding.dev/v1';

// ======================
// TOKEN
// ======================

function getAccessToken() {
  return localStorage.getItem(
    'token'
  );
}

// ======================
// GENERIC FETCH
// ======================

async function fetchWithToken(
  url,
  options = {}
) {
  const token =
    getAccessToken();

  const headers = {
    ...options.headers,
  };

  // AUTO TOKEN

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response =
    await fetch(url, {
      ...options,
      headers,
    });

  const responseJson =
    await response.json();

  if (responseJson.error) {
    throw new Error(
      responseJson.message
    );
  }

  return responseJson;
}

// ======================
// REGISTER
// ======================

export async function register(
  {
    name,
    email,
    password,
  }
) {
  return fetchWithToken(
    `${BASE_URL}/register`,
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify({
        name,
        email,
        password,
      }),
    }
  );
}

// ======================
// LOGIN
// ======================

export async function login({
  email,
  password,
}) {
  return fetchWithToken(
    `${BASE_URL}/login`,
    {
      method: 'POST',

      headers: {
        'Content-Type':
          'application/json',
      },

      body: JSON.stringify({
        email,
        password,
      }),
    }
  );
}

// ======================
// GET STORIES
// ======================

export async function getStories(
  {
    page = 1,
    size = 20,
    location = 1,
  } = {}
) {
  return fetchWithToken(
    `${BASE_URL}/stories?page=${page}&size=${size}&location=${location}`
  );
}

// ======================
// GET DETAIL STORY
// ======================

export async function getStoryDetail(
  id
) {
  return fetchWithToken(
    `${BASE_URL}/stories/${id}`
  );
}

// ======================
// ADD STORY
// ======================

export async function addStory(
  formData
) {
  return fetchWithToken(
    `${BASE_URL}/stories`,
    {
      method: 'POST',

      body: formData,
    }
  );
}

// ======================
// PUSH NOTIFICATION
// ======================

export async function sendSubscriptionToServer(
  subscription
) {
  try {
    const response =
      await fetchWithToken(
        `${BASE_URL}/notifications/subscribe`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',
          },

          body: JSON.stringify({
            endpoint:
              subscription.endpoint,

            keys: {
              p256dh:
                subscription.toJSON()
                  .keys.p256dh,

              auth:
                subscription.toJSON()
                  .keys.auth,
            },
          }),
        }
      );

    console.log(
      'Subscribe response:',
      response
    );

    return response;
  } catch (error) {
    console.error(
      'sendSubscriptionToServer error:',
      error
    );

    throw error;
  }
}

// ======================
// REMOVE SUBSCRIPTION
// ======================

export async function removeSubscriptionFromServer(
  subscription
) {
  try {
    return await fetchWithToken(
      `${BASE_URL}/notifications/subscribe`,
      {
        method: 'DELETE',

        headers: {
          'Content-Type':
            'application/json',
        },

        body: JSON.stringify({
          endpoint:
            subscription.endpoint,
        }),
      }
    );
  } catch (error) {
    console.error(
      'removeSubscriptionFromServer error:',
      error
    );

    throw error;
  }
}

// ======================
// VAPID PUBLIC KEY
// ======================

export function getVapidPublicKey() {
  return CONFIG
    .VAPID_PUBLIC_KEY;
}