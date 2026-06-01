import { useEffect } from "react";

/**
 * Warn the user before they leave (tab close, refresh, external navigation)
 * while a form has unsaved changes. Covers the browser-level cases; pass the
 * form's `dirty` flag.
 */
export function useUnsavedChanges(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    function handler(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
}
