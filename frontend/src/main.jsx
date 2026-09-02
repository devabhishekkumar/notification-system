import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";

import App from "./App";
import store from "./redux/store";

import "./index.css";


// ============================================================
// REGISTER SERVICE WORKER
// ============================================================

async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    console.warn(
      "Service Worker is not supported by this browser."
    );
    return;
  }

  try {
    const registration =
      await navigator.serviceWorker.register(
        "/sw.js",
        {
          scope: "/",
        }
      );

    console.log(
      "✅ Service Worker registered:",
      registration.scope
    );

    // ----------------------------------------------------------
    // Wait until the Service Worker is ready
    // ----------------------------------------------------------

    await navigator.serviceWorker.ready;

    console.log(
      "✅ Service Worker is ready."
    );

  } catch (error) {
    console.error(
      "❌ Service Worker registration failed:",
      error
    );
  }
}


// ============================================================
// REGISTER SERVICE WORKER
// ============================================================

registerServiceWorker();


// ============================================================
// REACT APPLICATION
// ============================================================

ReactDOM.createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>

    <Provider store={store}>

      <BrowserRouter>

        <App />

      </BrowserRouter>

    </Provider>

  </React.StrictMode>
);