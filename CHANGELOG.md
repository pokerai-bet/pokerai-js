# Changelog

## 0.2.1

README only: the About section gives the current Free tier, 10 presolved
lookups + 5 real-time solves per month. The package now also includes the
MIT LICENSE file. `dist/` is unchanged from 0.2.0.

## 0.2.0

The types in `src/schema.ts` are regenerated from the current Pokerai OpenAPI
spec (`openapi.yaml`). The spec now describes 40 endpoints; 0.1.0 described 12.

### Added

Endpoints added since 0.1.0:

- `POST /v1/gto/availability`
- `POST /v1/gto/solver/release`
- `GET /health`
- `GET /v1/pokerkit/meta`
- `GET /v1/pokerkit/combined-openapi.json`
- `POST /v1/pokerkit/blockers`
- `POST /v1/pokerkit/board-report`
- `POST /v1/pokerkit/cards/normalize`
- `POST /v1/pokerkit/category-combos`
- `POST /v1/pokerkit/draws`
- `POST /v1/pokerkit/equity`
- `POST /v1/pokerkit/eval/compare`
- `POST /v1/pokerkit/eval/hand`
- `POST /v1/pokerkit/games/state`
- `POST /v1/pokerkit/games/step`
- `POST /v1/pokerkit/hand-report`
- `POST /v1/pokerkit/hand-strength`
- `POST /v1/pokerkit/hand-tier`
- `POST /v1/pokerkit/icm`
- `POST /v1/pokerkit/notation/parse`
- `POST /v1/pokerkit/notation/replay`
- `POST /v1/pokerkit/nuts`
- `POST /v1/pokerkit/outs`
- `POST /v1/pokerkit/range/equity-advantage`
- `POST /v1/pokerkit/range/expand`
- `POST /v1/pokerkit/range/nut-advantage`
- `POST /v1/pokerkit/range/value`
- `POST /v1/pokerkit/texture`

### Unchanged

Code written for 0.1.0 keeps working. `createPokeraiClient` and its options
are the same, and the 12 endpoints from 0.1.0 keep their paths. Their changes
are additive:

- new optional request fields: `include_flop_pruning_guarantees` and
  `flop_version` on `/v1/gto/preflop/range`, `hole_cards` on
  `/v1/gto/flop/tree`, and `raise_sizes`, `donk_sizes` and `raise_limit` on
  `/v1/gto/solver`;
- new optional response fields on `/v1/gto/flop/tree`: `ranges`,
  `range_provenance` and `hero_hand_coverage`;
- `/v1/gto/flop/node` now also documents a `422` response.

### Package links

- `package.json`: the `bugs` link now points to https://pokerai.bet/contact
  instead of the old docs address, and a new `repository` field points to
  https://github.com/pokerai-bet/pokerai-js.
- The bundled README now links to the docs at https://pokerai.bet/docs.
