export class Beds24Error extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "Beds24Error";
  }
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export class AuthError extends Beds24Error {
  constructor(message: string, status?: number, details?: unknown) {
    super(message, "AUTH_ERROR", status, details);
    this.name = "AuthError";
  }
}

export class RateLimitError extends Beds24Error {
  constructor(message: string, public readonly retryAfterMs: number) {
    super(message, "RATE_LIMIT", 429);
    this.name = "RateLimitError";
  }
}

export class ApiError extends Beds24Error {
  constructor(message: string, status: number, details?: unknown) {
    super(message, "API_ERROR", status, details);
    this.name = "ApiError";
  }
}
