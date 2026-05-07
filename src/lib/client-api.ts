"use client";

function readCookie(name: string) {
  if (typeof document === "undefined") {
    return "";
  }

  return document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`))
    ?.split("=")[1] ?? "";
}

export async function apiFetch<T>(input: RequestInfo | URL, init?: RequestInit) {
  const csrf = decodeURIComponent(readCookie("vrb_csrf"));

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
