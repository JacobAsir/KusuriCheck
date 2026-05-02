# KusuriCheck — Project Notes

Stateless Japan-first utility AI app that helps users understand Japanese
OTC medicine packaging, supplement labels, and pharmacy instruction sheets via
OCR + parsing + safety rules + bilingual (JA/EN) explanations.

## Architecture

- **Frontend:** `artifacts/kusuricheck/` — React + Vite + TypeScript + Tailwind
  + shadcn. Originally requested as Next.js but adapted to React + Vite for
  the Replit pnpm-monorepo template (functional parity, faster dev loop).
  Routes: `/`, `/scan`, `/result`, `/how`, `/safety`, plus 404.
- **Backend:** `artifacts/api-server/` — Python 3.11 + FastAPI + Pydantic.
  Stateless. No database, no auth. Layered:
  `api/ → services/ (pipeline → ocr/classifier/parser/rule_engine/explainer)
   → schemas/ + utils/ + core/`.
- **Contract:** `lib/api-spec/openapi.yaml` drives both the frontend's
  generated React Query hooks (`@workspace/api-client-react`) and the
  Pydantic models on the backend.
- **Multipart upload:** `/api/analyze` is hand-wrapped in
  `artifacts/kusuricheck/src/lib/analyzeClient.ts` because Orval codegen does
  not handle multipart form-data well. Other endpoints use generated hooks.

## Hard rules

- Never diagnose, never recommend doses, never invent content not on the label.
- Stateless: no DB, no auth, no analysis history.
- Mock mode works without any API keys (5 built-in fixtures).
- Optional `GEMINI_API_KEY` switches OCR to Gemini 1.5 Flash.
- Optional `GROQ_API_KEY` switches explainer to a grounded Groq LLM call.
- Failures fall back to the deterministic mock OCR / template explainer so
  the user always gets a structured response.

## Safety rule engine

10 rules (R01–R10) implemented in `artifacts/api-server/app/services/rule_engine.py`.
Escalation 0–3, with R10 alone, R01+R02, or R08+R06 forcing level 3 and
suppressing structured sections. The LLM is never allowed to override this.

## Demo fixtures

In `artifacts/api-server/app/services/ocr/mock_provider.py`:
`otc-cold`, `otc-painkiller`, `supplement-vitamin`, `pharmacy-instruction`,
`high-risk-warning`. The last one is the canonical escalation-3 demonstration.

## How endpoints map to processing modes

`/healthz` reports `processing_mode` based on which keys are set
(mock | gemini | fallback). `/analyze-demo` always runs in `mock` mode
regardless of keys (intentional — demo fixtures bypass real OCR).

## Tests

`artifacts/api-server/tests/` — 18 unit tests across classifier, parser, and
rule engine. Run with `python -m pytest` from `artifacts/api-server/`.

## Docker

`docker-compose.yml` at the repo root brings up backend + nginx-served
frontend. The frontend container's nginx proxies `/api/*` to the backend.

## What I should NOT do here

- Do not add a database. The user explicitly forbade persistence.
- Do not add authentication.
- Do not let the explainer LLM override the deterministic rule engine.
- Do not invent endpoints, entities, or pages beyond the planned product
  surface (the design subagent has been told the same).
