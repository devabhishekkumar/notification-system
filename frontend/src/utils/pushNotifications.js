const API_BASE_URL =
  "http://127.0.0.1:8000/api/v1/notifications";


// ============================================================
// BASE64 URL → UINT8 ARRAY
// ============================================================

function urlBase64ToUint8Array(base64String) {
  const padding =
    "=".repeat(
      (4 - (base64String.length % 4)) % 4
    );

  const base64 = (
    base64String + padding
  )
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(
    [...rawData].map(
      (char) => char.charCodeAt(0)
    )
  );
}


// ============================================================
// REGISTER PUSH NOTIFICATIONS
// ============================================================

export async function registerPushNotifications(
  accessToken
) {

  // ==========================================================
  // VALIDATION
  // ==========================================================

  if (!accessToken) {
    throw new Error(
      "Access token is missing. Please login again."
    );
  }

  if (!("serviceWorker" in navigator)) {
    throw new Error(
      "Service Worker is not supported."
    );
  }

  if (!("PushManager" in window)) {
    throw new Error(
      "Web Push is not supported."
    );
  }

  if (!("Notification" in window)) {
    throw new Error(
      "Browser notifications are not supported."
    );
  }


  // ==========================================================
  // NOTIFICATION PERMISSION
  // ==========================================================

  let permission =
    Notification.permission;

  if (permission !== "granted") {
    permission =
      await Notification.requestPermission();
  }

  if (permission !== "granted") {
    throw new Error(
      "Notification permission was not granted."
    );
  }


  // ==========================================================
  // SERVICE WORKER
  // ==========================================================

  const registration =
    await navigator.serviceWorker.register(
      "/sw.js"
    );

  await navigator.serviceWorker.ready;

  console.log(
    "Service Worker ready."
  );


  // ==========================================================
  // GET CURRENT VAPID PUBLIC KEY
  // ==========================================================

  const keyResponse =
    await fetch(
      `${API_BASE_URL}/vapid-public-key/`
    );

  let keyData = null;

  try {
    keyData =
      await keyResponse.json();
  } catch {
    keyData = null;
  }

  if (!keyResponse.ok) {
    throw new Error(
      keyData?.detail ||
        keyData?.message ||
        "Failed to get VAPID public key."
    );
  }

  const publicKey =
    keyData?.public_key;

  if (!publicKey) {
    throw new Error(
      "VAPID public key is missing."
    );
  }

  console.log(
    "VAPID public key received."
  );


  // ==========================================================
  // GET EXISTING BROWSER SUBSCRIPTION
  // ==========================================================

  let subscription =
    await registration.pushManager.getSubscription();


  // ==========================================================
  // CREATE / REFRESH SUBSCRIPTION
  // ==========================================================

  if (subscription) {
    console.log(
      "Existing browser push subscription found."
    );

    /*
     * IMPORTANT:
     *
     * If the browser subscription was created using
     * an old VAPID public key, Django may return:
     *
     * 403:
     * "VAPID credentials ... do not correspond..."
     *
     * To avoid that, we unsubscribe the old subscription
     * and create a fresh one using the current public key.
     */

    try {
      await subscription.unsubscribe();

      console.log(
        "Old browser subscription removed."
      );
    } catch (error) {
      console.warn(
        "Could not remove old subscription:",
        error
      );
    }

    subscription = null;
  }


  // ==========================================================
  // CREATE NEW BROWSER SUBSCRIPTION
  // ==========================================================

  if (!subscription) {
    console.log(
      "Creating new browser push subscription..."
    );

    subscription =
      await registration.pushManager.subscribe({
        userVisibleOnly: true,

        applicationServerKey:
          urlBase64ToUint8Array(
            publicKey
          ),
      });

    console.log(
      "New browser push subscription created."
    );
  }


  // ==========================================================
  // CONVERT SUBSCRIPTION TO JSON
  // ==========================================================

  const subscriptionJSON =
    subscription.toJSON();


  // ==========================================================
  // VALIDATE SUBSCRIPTION
  // ==========================================================

  if (
    !subscriptionJSON?.endpoint ||
    !subscriptionJSON?.keys?.p256dh ||
    !subscriptionJSON?.keys?.auth
  ) {
    throw new Error(
      "Browser push subscription is invalid."
    );
  }

  console.log(
    "Push endpoint:",
    subscriptionJSON.endpoint
  );


  // ==========================================================
  // REGISTER SUBSCRIPTION WITH DJANGO
  // ==========================================================

  const response =
    await fetch(
      `${API_BASE_URL}/push-subscriptions/register/`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${accessToken}`,
        },

        body: JSON.stringify({
          endpoint:
            subscriptionJSON.endpoint,

          subscription:
            subscriptionJSON,

          is_active: true,
        }),
      }
    );


  // ==========================================================
  // READ RESPONSE
  // ==========================================================

  let result = null;

  try {
    result =
      await response.json();
  } catch {
    result = null;
  }


  console.log(
    "Push registration status:",
    response.status
  );

  console.log(
    "Push registration response:",
    result
  );


  // ==========================================================
  // HANDLE API ERROR
  // ==========================================================

  if (!response.ok) {

    const message =
      result?.detail ||
      result?.message ||
      result?.error ||
      `Push subscription registration failed (${response.status}).`;

    throw new Error(message);
  }


  // ==========================================================
  // SUCCESS
  // ==========================================================

  console.log(
    "Push notification registration successful."
  );

  return result;
}