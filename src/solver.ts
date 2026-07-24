import createClient, { type Client } from "openapi-fetch";
import type { components, paths } from "./schema.js";

export type PokeraiClient = Client<paths>;
export type SolverScheduleRequest =
  paths["/v1/gto/solver"]["post"]["requestBody"]["content"]["application/json"];
export type SolverScheduleResponse = components["schemas"]["SolverScheduleResponse"];

export interface PokeraiSolverOptions {
  /** Your Pokerai API key (`gto_...`). */
  apiKey: string;
  /** Override the API base URL. Default: `https://pokerai.bet` */
  baseUrl?: string;
  /** Reuse an existing typed OpenAPI client. */
  client?: PokeraiClient;
  /** Override fetch for tests or custom runtimes. */
  fetch?: typeof fetch;
  /** Override sleep for tests. Receives milliseconds. */
  sleep?: (ms: number) => Promise<void>;
}

export interface SolverScheduleRetryOptions {
  /** Number of busy 429 retries. Default: 3. */
  maxRetries?: number;
}

export interface SolverReleaseResponse {
  status?: string;
  released?: boolean;
  solver_released?: boolean;
  solver_release_reason?: string;
  [key: string]: unknown;
}

export interface SolverReleaseAttempt {
  ok: boolean;
  data?: SolverReleaseResponse;
  error?: string;
}

export class PokeraiApiError extends Error {
  status?: number;
  body?: unknown;

  constructor(message: string, options: { status?: number; body?: unknown } = {}) {
    super(message);
    this.name = "PokeraiApiError";
    this.status = options.status;
    this.body = options.body;
  }
}

export class PokeraiSolver {
  readonly client: PokeraiClient;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly sleepImpl: (ms: number) => Promise<void>;

  constructor(options: PokeraiSolverOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl ?? "https://pokerai.bet").replace(/\/+$/, "");
    this.fetchImpl = options.fetch ?? fetch;
    this.sleepImpl = options.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.client =
      options.client ??
      createClient<paths>({
        baseUrl: this.baseUrl,
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
  }

  async scheduleWithRetry(
    body: SolverScheduleRequest,
    options: SolverScheduleRetryOptions = {},
  ): Promise<SolverScheduleResponse> {
    const maxRetries = options.maxRetries ?? 3;
    for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
      const res = await this.client.POST("/v1/gto/solver", { body });
      if (!res.error && res.data) return res.data;
      if (isSolverBusy429(res.response, res.error) && attempt < maxRetries) {
        await this.sleepImpl(solverRetryAfterMs(res.response, res.error) ?? 2500);
        continue;
      }
      throw new PokeraiApiError(`solver schedule failed: HTTP ${res.response.status}`, {
        status: res.response.status,
        body: res.error,
      });
    }
    throw new Error("unreachable");
  }

  async release(solve: string): Promise<SolverReleaseResponse> {
    const response = await this.fetchImpl(`${this.baseUrl}/v1/gto/solver/release`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ solve }),
    });
    const body = await safeJson(response);
    if (!response.ok) {
      throw new PokeraiApiError(`solver release failed: HTTP ${response.status}`, {
        status: response.status,
        body,
      });
    }
    return body as SolverReleaseResponse;
  }

  async releaseBestEffort(solve: string): Promise<SolverReleaseAttempt> {
    try {
      return { ok: true, data: await this.release(solve) };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : String(error) };
    }
  }

  async withSolve<T>(
    body: SolverScheduleRequest,
    use: (scheduled: SolverScheduleResponse, solver: PokeraiSolver) => Promise<T> | T,
    options: SolverScheduleRetryOptions = {},
  ): Promise<T> {
    const scheduled = await this.scheduleWithRetry(body, options);
    const solve = typeof scheduled.solve === "string" ? scheduled.solve : "";
    try {
      return await use(scheduled, this);
    } finally {
      if (solve) await this.releaseBestEffort(solve);
    }
  }
}

export function createPokeraiSolver(options: PokeraiSolverOptions): PokeraiSolver {
  return new PokeraiSolver(options);
}

export function solverRetryAfterMs(response: Response, body?: unknown): number | undefined {
  const parsedBody = asRecord(body);
  const bodyMs = numberFrom(parsedBody?.retry_after_ms);
  if (bodyMs && bodyMs > 0) return bodyMs;
  const headerSeconds = numberFrom(response.headers.get("Retry-After"));
  if (headerSeconds && headerSeconds > 0) return headerSeconds * 1000;
  return undefined;
}

export function isSolverBusy429(response: Response, body?: unknown): boolean {
  if (response.status !== 429) return false;
  const parsedBody = asRecord(body);
  return [parsedBody?.status, parsedBody?.error, parsedBody?.reason].some((value) =>
    value === "busy" || value === "solver_pool_busy",
  );
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
}

function numberFrom(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}
