import { NextResponse } from "next/server";

type ErrorOpts = {
  details?: any;
  message?: string;
};

export function jsonError(status: number, code: string, opts: ErrorOpts = {}) {
  const payload: Record<string, any> = {
    error: code,
    code,
  };
  if (opts.message) payload.message = opts.message;
  if (typeof opts.details !== "undefined") payload.details = opts.details;
  return NextResponse.json(payload, { status });
}