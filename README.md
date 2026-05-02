# KusuriCheck

Japan-first utility AI app that helps people understand Japanese OTC medicine
packaging, supplement labels, and pharmacy instruction sheets. Take a photo of
a Japanese label and get a careful, bilingual (Japanese + English) summary,
structured fields (intended use, dosage, warnings, ingredients), and clear
pharmacist / doctor consult flags.

KusuriCheck is **not** a doctor, pharmacist, or diagnostic tool. It never
recommends a dose and never invents content that is not visible on the label.

## Architecture

Two artifacts in a pnpm monorepo:

- `artifacts/api-server/` — Python 3.11 + FastAPI backend. Stateless. No
  database. Runs in mock mode without API keys.
- `artifacts/kusuricheck/` — React + Vite frontend (TypeScript, Tailwind,
  shadcn). Communicates with the backend through the shared OpenAPI contract.

### Pipeline

```
Upload / demo sample
        │
        ▼
  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
  │     OCR     │ -> │  Classify   │ -> │   Parse     │
  │ mock|gemini │    │ keyword     │    │ section /   │
  │             │    │ heuristics  │    │ evidence    │
  └─────────────┘    └─────────────┘    └─────────────┘
                                                │
                                                ▼
                                        ┌─────────────┐
                                        │ Rule engine │
                                        │ R01..R10    │
                                        │ deterministic│
                                        └─────────────┘
                                                │
                                                ▼
                                        ┌─────────────┐
                                        │ Explainer   │
                                        │ template OR │
                                        │ Groq LLM    │
                                        │ (grounded)  │
                                        └─────────────┘
                                                │
                                                ▼
                                          AnalyzeResponse
```

### Safety rules (R01–R10)

| Rule | Trigger                                           | Effect                |
| ---- | ------------------------------------------------- | --------------------- |
| R01  | "処方箋医薬品" / "要処方" markers                  | doctor flag           |
| R02  | "劇薬" / "毒薬" wording                           | doctor flag           |
| R03  | Pregnancy/breastfeeding restriction + profile    | pharmacist flag       |
| R04  | Pediatric restriction + profile                  | pharmacist flag       |
| R05  | Liver / kidney / elderly caution + profile       | pharmacist flag       |
| R06  | Confidence < 0.4                                 | low-confidence warn   |
| R07  | Dosage section missing                           | "do not assume" warn  |
| R08  | Document type unclear                            | pharmacist flag       |
| R09  | Serious side-effect / 副作用 / 重篤 wording      | doctor flag           |
| R10  | Boxed warning ("【警告】", "重要な基本的注意")    | escalation 3          |

Escalation levels:

- 0 — calm informational
- 1 — pharmacist suggested
- 2 — doctor suggested
- 3 — sections suppressed; "we cannot safely summarize" fallback. Triggered by
  R10 alone, R01+R02 together, or R08+R06 together.

The rule engine is purely deterministic. The LLM never overrides it.

## Local development on Replit

The Replit workflows wire everything up automatically. Open the preview pane
to see the frontend; the API runs at `/api`.

Useful commands:

```bash
# Run the backend unit tests
cd artifacts/api-server && python -m pytest tests/

# Re-run OpenAPI codegen (after editing lib/api-spec/openapi.yaml)
pnpm --filter @workspace/api-spec run codegen

# Manual API checks
curl http://localhost:80/api/healthz
curl http://localhost:80/api/demo-samples
```

## Local development with Docker

A `docker-compose.yml` is provided for running the full stack outside Replit.

```bash
# Mock mode — no API keys needed
docker compose up --build

# With real OCR / explainer
GEMINI_API_KEY=... GROQ_API_KEY=... docker compose up --build
```

The web app will be available at <http://localhost:8080> and proxies
`/api/*` to the backend container.

## Environment variables

| Var               | Required | Default                       | Notes                              |
| ----------------- | -------- | ----------------------------- | ---------------------------------- |
| `APP_ENV`         | no       | `development`                 | `production` enables JSON logs     |
| `LOG_LEVEL`       | no       | `INFO`                        |                                    |
| `MAX_UPLOAD_MB`   | no       | `10`                          | Per-file upload limit              |
| `GEMINI_API_KEY`  | no       | _(mock OCR)_                  | When set, uses Gemini 1.5 for OCR  |
| `GROQ_API_KEY`    | no       | _(template fallback)_         | When set, uses Groq LLM explainer  |
| `GROQ_MODEL`      | no       | `llama-3.3-70b-versatile`     |                                    |

Without any keys, the stack runs end-to-end in **mock mode** using built-in
fixtures so reviewers always see realistic output.

## Built-in demo samples

Available at `GET /api/demo-samples`:

1. `otc-cold` — OTC cold medicine (Pablon S, 指定第2類)
2. `otc-painkiller` — OTC painkiller (Loxonin S, 第1類)
3. `supplement-vitamin` — Multivitamin (栄養機能食品)
4. `pharmacy-instruction` — Pharmacy instruction sheet (薬剤情報提供書)
5. `high-risk-warning` — High-risk warning (Warfarin, 処方箋医薬品)

Sample 5 deterministically demonstrates escalation level 3 with the
"we cannot safely summarize" fallback.

## API surface

| Method | Path                  | Purpose                                    |
| ------ | --------------------- | ------------------------------------------ |
| GET    | `/api/healthz`        | Health + processing-mode badge             |
| GET    | `/api/demo-samples`   | List built-in demo samples                 |
| POST   | `/api/analyze-demo`   | Analyze a built-in sample (JSON)           |
| POST   | `/api/analyze`        | Analyze an uploaded image (multipart)      |

The OpenAPI contract lives in `lib/api-spec/openapi.yaml`. The frontend's
React Query hooks are generated from it automatically.

## What KusuriCheck will not do

- Diagnose conditions
- Recommend doses beyond what is literally written on the label
- Suggest alternative medicines
- Replace a pharmacist or doctor
- Persist any user data — every request is stateless
