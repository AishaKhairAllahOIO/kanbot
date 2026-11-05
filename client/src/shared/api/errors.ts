import axios from "axios";
import type { ApiErrorBody, ErrorCode } from "../types/api";

export type ApiErrorCode = ErrorCode | "NETWORK_ERROR";
type ErrorDetails = NonNullable<ApiErrorBody["error"]["details"]>;

const NO_STATUS = 0;
const MESSAGES = {
  network: "Cannot reach the server. Is it running?",
  generic: "Something went wrong. Please try again.",
  retryHint: "Please try again shortly.",
} as const;
const RETRY_HINT_CODES: ReadonlySet<ApiErrorCode> = new Set([
  "RATE_LIMITED",
  "AI_ERROR",
]);

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details: ErrorDetails;

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    details: ErrorDetails = [],
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  get isNetworkError() {
    return this.code === "NETWORK_ERROR";
  }
  get isClientError() {
    return this.status >= 400 && this.status < 500;
  }
  get hasFieldErrors() {
    return this.details.length > 0;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (!axios.isAxiosError<ApiErrorBody>(error)) {
    return new ApiError(NO_STATUS, "INTERNAL_ERROR", MESSAGES.generic);
  }
  const { response } = error;
  if (!response)
    return new ApiError(NO_STATUS, "NETWORK_ERROR", MESSAGES.network);

  const body = response.data?.error;
  return body
    ? new ApiError(response.status, body.code, body.message, body.details)
    : new ApiError(response.status, "INTERNAL_ERROR", MESSAGES.generic);
}

export function getErrorMessage(error: unknown): string {
  const apiError = toApiError(error);
  return RETRY_HINT_CODES.has(apiError.code)
    ? `${apiError.message} ${MESSAGES.retryHint}`
    : apiError.message;
}

export function fieldErrors(error: ApiError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const { path, message } of error.details) {
    if (!result[path]) result[path] = message;
  }
  return result;
}
