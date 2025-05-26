import React from "react";
import { createRoot } from "react-dom/client";
import App from "./components/App";
import ErrorBoundary from "./components/ErrorBoundary";
import "../styles/design-system.css";

function waitForDOMReady(): Promise<void> {
  return new Promise((resolve) => {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => resolve());
    } else {
      resolve();
    }
  });
}

async function initializeApp(): Promise<void> {
  try {
    await waitForDOMReady();

    const container =
      document.getElementById("react-page") || document.getElementById("root");
    if (!container) {
      throw new Error("Container element not found");
    }

    const root = createRoot(container);
    root.render(
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    );
  } catch (error) {
    console.error("Failed to initialize app:", error);
    document.body.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #666;">
        <h3>Failed to load plugin</h3>
        <p>Please refresh and try again.</p>
        <pre style="font-size: 12px; color: #999;">${error}</pre>
      </div>
    `;
  }
}

initializeApp();
