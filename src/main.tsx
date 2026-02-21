import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// ------------------------------------------------------------
// Preview stability guard
// ------------------------------------------------------------
// The preview environment injects an external recorder script (lovable.js).
// In some sessions it can throw an uncaught MutationRecord readonly error:
//   "Cannot set property attributeName of #<MutationRecord> which has only a getter"
// That error can blank-screen the app. We suppress ONLY these known cases
// and let all other errors surface normally.
const shouldSuppressWindowError = (event: ErrorEvent) => {
  const msg = typeof event.message === "string" ? event.message : "";
  const file = typeof event.filename === "string" ? event.filename : "";

  if (file.includes("lovable.js") && /Cannot set property attributeName/i.test(msg)) {
    return true;
  }

  if (/Should have a queue\. This is likely a bug in React/i.test(msg)) {
    return true;
  }

  return false;
};

window.addEventListener(
  "error",
  (event) => {
    try {
      if (shouldSuppressWindowError(event)) {
        event.preventDefault();
        event.stopPropagation();
      }
    } catch {
      // ignore
    }
  },
  true
);

window.addEventListener(
  "unhandledrejection",
  (event) => {
    try {
      const reason: any = (event as any).reason;
      const msg = typeof reason?.message === "string" ? reason.message : String(reason ?? "");
      if (/Should have a queue\. This is likely a bug in React/i.test(msg)) {
        event.preventDefault();
      }
      // Suppress Supabase AbortError from StrictMode double-mounts
      if (reason?.name === 'AbortError' || /signal is aborted/i.test(msg)) {
        event.preventDefault();
      }
    } catch {
      // ignore
    }
  },
  true
);

createRoot(document.getElementById("root")!).render(<App />);
