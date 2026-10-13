/**
 * /api/v1 toolkit. Every route handler is wrapped in `route()` and uses these
 * helpers for responses and errors so the surface is consistent (brief §37).
 */

export { route, type RouteContext } from "./route";
export { ok, created, noContent, paginated, errorResponse, type Page } from "./response";
export {
  ApiError,
  BadRequestError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  type ApiErrorCode,
} from "./errors";
export { parseListParams, type ListParams } from "./pagination";
