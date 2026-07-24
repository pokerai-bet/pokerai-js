import createClient, { type Client } from "openapi-fetch";
import type { paths } from "./schema.js";

/** A fully-typed Pokerai API client (paths, request bodies, and responses are type-checked). */
export type PokeraiClient = Client<paths>;

export interface PokeraiClientOptions {
  /** Your Pokerai API key (`gto_...`). Get one free at https://pokerai.bet/login */
  apiKey: string;
  /** Override the API base URL. Default: `https://pokerai.bet` */
  baseUrl?: string;
}

/**
 * Create a typed Pokerai API client.
 *
 * @example
 * ```ts
 * const client = createPokeraiClient({ apiKey: "gto_..." });
 * const { data, error } = await client.POST("/v1/gto/preflop", {
 *   body: {
 *     hole_cards: "AhKh",
 *     positions: { hero: "MP" },
 *     preflop_actions: [
 *       { position: "SB", action: "small blind", amount: 0.5 },
 *       { position: "BB", action: "big blind", amount: 1 },
 *       { position: "UTG", action: "raise", amount: 3 },
 *     ],
 *   },
 * });
 * ```
 */
export function createPokeraiClient(options: PokeraiClientOptions): PokeraiClient {
  return createClient<paths>({
    baseUrl: options.baseUrl ?? "https://pokerai.bet",
    headers: { Authorization: `Bearer ${options.apiKey}` },
  });
}

export {
  PokeraiApiError,
  PokeraiSolver,
  createPokeraiSolver,
  isSolverBusy429,
  solverRetryAfterMs,
  type PokeraiSolverOptions,
  type SolverReleaseAttempt,
  type SolverReleaseResponse,
  type SolverScheduleRequest,
  type SolverScheduleResponse,
  type SolverScheduleRetryOptions,
} from "./solver.js";
export type { paths, components } from "./schema.js";
