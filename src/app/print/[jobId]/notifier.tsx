"use client";
import { useEffect, useState } from "react";

export function PdfReadyNotifier() {
  const [ready, setReady] = useState(false);
  
  useEffect(() => {
    // Wait for fonts
    document.fonts.ready.then(() => {
      // Wait for any images
      const images = Array.from(document.images);
      Promise.all(
        images.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      ).then(() => {
        // Add a small layout frame delay
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setReady(true);
          });
        });
      });
    });
  }, []);

  if (!ready) return null;
  return <div id="pdf-ready" style={{ display: "none" }} data-status="ready"></div>;
}
