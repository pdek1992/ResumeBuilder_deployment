import { DOMMatrix, DOMPoint, DOMRect } from "@napi-rs/canvas";

/**
 * Polyfills browser geometry globals required by pdfjs-dist in Node.js environments.
 * This must be imported before any pdf-parse or pdfjs-dist imports.
 */
if (typeof globalThis !== "undefined") {
  (globalThis as any).DOMMatrix = (globalThis as any).DOMMatrix || DOMMatrix;
  (globalThis as any).DOMPoint = (globalThis as any).DOMPoint || DOMPoint;
  (globalThis as any).DOMRect = (globalThis as any).DOMRect || DOMRect;
}
