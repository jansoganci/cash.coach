import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { I18nextProvider } from "react-i18next";
import i18n from "./lib/i18n";
import "remixicon/fonts/remixicon.css";

// Import auth interceptor to automatically attach JWT tokens to API requests
import "./lib/authInterceptor";

createRoot(document.getElementById("root")!).render(
  <I18nextProvider i18n={i18n}>
    <App />
  </I18nextProvider>
);
