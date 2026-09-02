// ============================================================
// SERVICE WORKER
// ============================================================

self.addEventListener("install", (event) => {
  console.log("🔧 Service Worker installing...");

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("✅ Service Worker activated");

  event.waitUntil(
    self.clients.claim()
  );
});

// ============================================================
// PUSH NOTIFICATION
// ============================================================

self.addEventListener("push", (event) => {
  console.log("🔔 Push event received");

  let data = {};

  // ----------------------------------------------------------
  // Read push payload
  // ----------------------------------------------------------

  if (event.data) {
    try {
      data = event.data.json();

      console.log(
        "📦 Push data:",
        data
      );
    } catch (error) {
      console.warn(
        "Push payload is not JSON. Using text.",
        error
      );

      data = {
        title: "Notification System",
        body: event.data.text(),
      };
    }
  }

  // ----------------------------------------------------------
  // Notification title
  // ----------------------------------------------------------

  const title =
    data.title ||
    "Notification System";

  // ----------------------------------------------------------
  // Notification options
  // ----------------------------------------------------------

  const options = {
    body:
      data.body ||
      data.message ||
      "You have a new notification.",

    icon: "/favicon.svg",

    badge: "/favicon.svg",

    tag:
      data.tag ||
      `notification-${Date.now()}`,

    renotify: true,

    requireInteraction: false,

    data: {
      url:
        data.url ||
        "/dashboard",
    },
  };

  console.log(
    "🔔 Showing notification:",
    title,
    options
  );

  // ----------------------------------------------------------
  // Show notification
  // ----------------------------------------------------------

  event.waitUntil(
    self.registration
      .showNotification(
        title,
        options
      )
      .then(() => {
        console.log(
          "✅ Notification displayed"
        );
      })
      .catch((error) => {
        console.error(
          "❌ Failed to display notification:",
          error
        );
      })
  );
});

// ============================================================
// NOTIFICATION CLICK
// ============================================================

self.addEventListener(
  "notificationclick",
  (event) => {
    console.log(
      "🔔 Notification clicked"
    );

    event.notification.close();

    const url =
      event.notification?.data?.url ||
      "/dashboard";

    event.waitUntil(
      self.clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        .then((clientList) => {

          // --------------------------------------------------
          // Find existing application window
          // --------------------------------------------------

          for (const client of clientList) {
            if (
              "focus" in client
            ) {
              return client
                .navigate(url)
                .then(() => client.focus());
            }
          }

          // --------------------------------------------------
          // Open new application window
          // --------------------------------------------------

          if (
            "openWindow" in clients
          ) {
            return clients.openWindow(
              url
            );
          }

          return null;
        })
    );
  }
);

// ============================================================
// NOTIFICATION CLOSE
// ============================================================

self.addEventListener(
  "notificationclose",
  (event) => {
    console.log(
      "🔕 Notification closed"
    );
  }
);