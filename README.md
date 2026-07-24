# @pokerai/client

Official TypeScript/JavaScript client for the **[Pokerai API](https://pokerai.bet)** — solver-grade
GTO strategy for 6-max No-Limit Hold'em, over HTTP. Paths, request bodies, and responses are all
**fully typed** — the types are **auto-generated from the [OpenAPI spec](https://pokerai.bet/openapi.yaml)**
(openapi-typescript) and driven by a tiny type-safe fetch runtime (openapi-fetch), so it always
tracks the live API.

Get a free API key at **https://pokerai.bet/login**. Docs: https://pokerai.bet/docs.en

```bash
npm install @pokerai/client
```

## Quickstart

```ts
import { createPokeraiClient } from "@pokerai/client";

const client = createPokeraiClient({ apiKey: "gto_your_key" });

const { data, error } = await client.POST("/v1/gto/preflop", {
  body: {
    hole_cards: "AhKh",
    positions: { hero: "MP" },
    preflop_actions: [
      { position: "SB", action: "small blind", amount: 0.5 },
      { position: "BB", action: "big blind", amount: 1 },
      { position: "UTG", action: "raise", amount: 3 },
    ],
  },
});

if (error) throw new Error(JSON.stringify(error));
console.log(data.situation, data.strategy); // "Raise", [{ action: "raise", frequency: 1, amount_bb: 9, ... }]
```

Every endpoint, body field, and response field is type-checked at compile time — your editor
autocompletes the whole API. `data` is the parsed response; `error` is the typed error body.

## What you get

- `createPokeraiClient({ apiKey, baseUrl? })` → a typed [openapi-fetch](https://openapi-ts.dev/openapi-fetch/)
  client. Call `client.GET(...)` / `client.POST(...)` with the exact API paths.
- `paths` / `components` types are re-exported if you want to reference request/response shapes directly.

Endpoints: `preflop`, `preflop/range`, `preflop/versions`, `flop/tree`, `flop/node` (presolved);
`solver`, `solver/tree`, `solver/node` (real-time); `range`, `evs`, projected ranges. See the
[reference](https://pokerai.bet/reference). Auth is your API key, sent as `Authorization: Bearer`.

## Real-time solver lifecycle

Real-time solves hold a shared solver slot while you poll/query the tree. Use `createPokeraiSolver`
when you want a lifecycle-safe wrapper: it retries temporary `429 busy` responses using
`retry_after_ms` / `Retry-After`, and releases the solve in `finally` after your callback finishes.
Quota 429s are not retried.

```ts
import { createPokeraiSolver } from "@pokerai/client";

const solver = createPokeraiSolver({ apiKey: "gto_your_key" });

const tree = await solver.withSolve(
  {
    board: "2c2d2h9s",
    oop_range: "AA,KK",
    ip_range: "QQ,JJ",
    pot: 20,
    effective_stack: 90,
    hero: "OOP",
  },
  async (scheduled) => {
    // Query every tree/node/runout you still need for this solve inside this callback.
    const { data, error } = await solver.client.POST("/v1/gto/solver/tree", {
      body: { solve: scheduled.solve ?? "" },
    });
    if (error) throw new Error(JSON.stringify(error));
    return data;
  },
);
```

## Prefer named tools for an LLM agent?

See **[@pokerai/mcp](https://www.npmjs.com/package/@pokerai/mcp)** — the same API as MCP tools.

MIT licensed.
