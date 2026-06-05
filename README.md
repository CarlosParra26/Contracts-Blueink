# Contracts BlueInk Backend

Backend NestJS para envío y seguimiento de contratos con [BlueInk](https://developer.blueink.com/).

Todo se identifica por un `templateId` de BlueInk.

## Inicio rápido

```bash
cp .env.example .env
docker compose up -d
npx pnpm@9.15.0 install
npx pnpm@9.15.0 run db:push
npx pnpm@9.15.0 run dev
```

API: `http://localhost:3000/v1`  
Header: `x-api-key: <API_KEY>`

## Flujo

1. Creas la plantilla en **BlueInk Dashboard** (PDF + campos + roles).
2. `GET /v1/templates/:templateId` → obtienes roles y campos (`inp-xxxx`).
3. `POST /v1/contracts/send` con `templateId`, signers y `fields`.
4. Webhooks actualizan Postgres; al firmar se guarda PDF y notifica a todos.

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/v1/templates/:templateId` | Roles y campos desde BlueInk |
| POST | `/v1/contracts/send` | Enviar contrato |
| GET | `/v1/contracts` | Listar (`?templateId=uuid`) |
| GET | `/v1/contracts/:id` | Detalle + eventos |
| POST | `/v1/webhooks/blueink` | Webhooks |

## Ejemplo POST

```json
{
  "templateId": "36c26810-c5a3-4335-a0b8-7cd369ba8076",
  "requesterName": "HR Admin",
  "requesterEmail": "carlos.parra@immilandcanada.com",
  "isTest": true,
  "signers": [
    { "role": "employer", "name": "Carlos Employer", "email": "email-employer@gmail.com", "order": 0 },
    { "role": "employee-1", "name": "Carlos Employee", "email": "carlos2027@gmail.com", "order": 1 }
  ],
  "fields": {
    "inp-8a5e": "Carlos",
    "inp-c86a": "Parra"
  }
}
```

`signers[].role` debe coincidir **exactamente** con los roles del template en BlueInk (`employer`, `employee-1`, etc.).
