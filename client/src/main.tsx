import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./lib/auth";
import "./index.css";

// The GitHub Pages build uses HashRouter so deep links work without server-side
// SPA fallback; local/hosted builds use clean BrowserRouter paths.
const STATIC_MODE = import.meta.env.VITE_STATIC === "true";
const Router = STATIC_MODE ? HashRouter : BrowserRouter;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <App />
      </AuthProvider>
    </Router>
  </React.StrictMode>,
);
