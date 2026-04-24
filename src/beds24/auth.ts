import { AuthError } from "../utils/errors.js";
import type { Logger } from "../utils/logger.js";

interface TokenState {
  token: string;
  expiresAt: number;
}

export class TokenManager {
  private writeState: TokenState | null = null;
  private inflight: Promise<string> | null = null;

  constructor(
    private readonly opts: {
      baseUrl: string;
      readToken?: string;
      writeRefreshToken?: string;
      logger: Logger;
    },
  ) {}

  readToken(): string | null {
    return this.opts.readToken ?? null;
  }

  hasWriteCapability(): boolean {
    return Boolean(this.opts.writeRefreshToken);
  }

  async writeToken(): Promise<string> {
    if (!this.opts.writeRefreshToken) {
      throw new AuthError("No BEDS24_WRITE_REFRESH_TOKEN configured");
    }

    const now = Date.now();
    if (this.writeState && this.writeState.expiresAt > now + 60_000) {
      return this.writeState.token;
    }

    if (this.inflight) return this.inflight;

    this.inflight = this.refresh().finally(() => {
      this.inflight = null;
    });
    return this.inflight;
  }

  private async refresh(): Promise<string> {
    if (!this.opts.writeRefreshToken) {
      throw new AuthError("No refresh token available");
    }

    this.opts.logger.debug("refreshing write token");

    const res = await fetch(`${this.opts.baseUrl}/authentication/token`, {
      method: "GET",
      headers: {
        refreshToken: this.opts.writeRefreshToken,
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new AuthError(
        `Refresh token request failed: ${res.status}`,
        res.status,
        body,
      );
    }

    const payload = (await res.json()) as {
      token?: string;
      expiresIn?: number;
    };
    if (!payload.token) {
      throw new AuthError("Refresh token response missing token field", 502, payload);
    }

    const expiresIn = (payload.expiresIn ?? 86400) * 1000;
    this.writeState = {
      token: payload.token,
      expiresAt: Date.now() + expiresIn,
    };
    return payload.token;
  }
}
