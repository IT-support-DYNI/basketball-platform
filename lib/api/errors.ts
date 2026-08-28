/**
 * API error types. Handlers throw these; the route wrapper (lib/api/route.ts)
 * turns them into a consistent HTTP response. Anything that isn't an ApiError
 * becomes a 500 with no detail leaked.
 */

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "VALIDATION"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL";

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  /** Machine-readable extra context (e.g. per-field validation issues). */
  readonly details?: unknown;

  constructor(status: number, code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "That request wasn't valid.", details?: unknown) {
    super(400, "BAD_REQUEST", message, details);
  }
}

export class ValidationError extends ApiError {
  constructor(message = "Some fields need attention.", details?: unknown) {
    super(422, "VALIDATION", message, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "You need to sign in to do that.") {
    super(401, "UNAUTHORIZED", message);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "You don't have permission to do that.") {
    super(403, "FORBIDDEN", message);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "That wasn't found.") {
    super(404, "NOT_FOUND", message);
  }
}

export class ConflictError extends ApiError {
  constructor(message = "That conflicts with something that already exists.", details?: unknown) {
    super(409, "CONFLICT", message, details);
  }
}

export class RateLimitError extends ApiError {
  constructor(message = "Too many requests — slow down and try again shortly.") {
    super(429, "RATE_LIMITED", message);
  }
}

/**
 * Back-compat alias. The old code threw `AuthorizationError(message, status)`
 * from lib/authorization.ts; that now maps onto this. 401 → Unauthorized,
 * anything else → Forbidden.
 */
export class AuthorizationError extends ApiError {
  constructor(message: string, status = 403) {
    super(status, status === 401 ? "UNAUTHORIZED" : "FORBIDDEN", message);
    this.name = "AuthorizationError";
  }
}
