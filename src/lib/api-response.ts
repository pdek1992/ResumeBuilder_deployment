import { NextResponse } from "next/server";

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(error: unknown, status = 400) {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "Unexpected error";
  return NextResponse.json({ error: message }, { status });
}
