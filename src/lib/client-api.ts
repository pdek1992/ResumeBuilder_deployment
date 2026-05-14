"use client";

const CSRF_COOKIE_NAME = "vrb_csrf";

function readCookie(name: string) {
  if (typeof document === "undefined") {
    return "";
  }

  return (
    document.cookie
      .split("; ")
      .find((entry) => entry.startsWith(`${name}=`))
      ?.split("=")[1] ?? ""
  );
}

function writeCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/${secure}; SameSite=Lax`;
}

export async function apiFetch<T>(input: RequestInfo | URL, init?: RequestInit) {
  let csrf = decodeURIComponent(readCookie(CSRF_COOKIE_NAME));

  if (!csrf) {
    try {
      const csrfRes = await fetch("/api/csrf");
      if (csrfRes.ok) {
        const csrfData = (await csrfRes.json()) as { token: string };
        csrf = csrfData.token ?? "";
        // Write to cookie immediately so subsequent calls use it too
        if (csrf) {
          writeCookie(CSRF_COOKIE_NAME, csrf);
        }
      }
    } catch (e) {
      console.error("[API] Failed to fetch CSRF token:", e);
    }
  }

  const response = await fetch(input, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-csrf-token": csrf,
      ...(init?.headers ?? {}),
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "error" in payload ? String(payload.error) : "Request failed";
    throw new Error(message);
  }

  return payload as T;
}
