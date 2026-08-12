# Inventory Management System — Local Development Setup

Repo: [github.com/Cundanreddy/inventory-its](https://github.com/Cundanreddy/inventory-its)

This repo runs a full-stack app (Postgres + Redis + Node API + Vite client + Nginx reverse proxy) via Docker Compose, with hot-reload support through Compose Watch.

> This README covers **local development** (`docker-compose.yml`). The repo also has a `docker-compose.prod.yml` for production — use that instead when deploying, and expect a different (locked-down) Postgres/Nginx configuration there.

## Architecture

| Service    | Image / Build         | Port(s)         | Purpose                              |
|------------|------------------------|------------------|---------------------------------------|
| `postgres` | `postgres:16-alpine`   | `5432`           | Primary database (`inventory_db`)     |
| `redis`    | `redis:7-alpine`       | internal only    | Cache / session store (password-protected) |
| `api`      | built from `./server`  | `3001`           | Node backend (runs migrations, seed, then dev server) |
| `client`   | built from `./client`  | `5173`           | Vite dev server for the frontend      |
| `nginx`    | `nginx:alpine`         | `80`, `443`      | Reverse proxy / TLS termination       |

Data persists in two named volumes: `pg_data` and `redis_data`.

## Requirements

- **Docker** 24+ and **Docker Compose** v2.22+ (needed for the `develop.watch` hot-reload feature)
- **Git**
- A `.env` file in the repo root (used by `docker-compose.yml` for `DB_PASSWORD` / `REDIS_PASSWORD`)
- A `server/.env` file (loaded by the `api` service via `env_file`)
- TLS certs placed in `./certs` (mounted into Nginx read-only) if you're serving HTTPS locally
- An `./nginx/nginx.conf` file with your proxy configuration

> **Note:** Ports `5432` (Postgres) and `3001` (API) are published to the host. The comment in the compose file says Postgres is "only accessible inside LAN" — restrict this at your firewall/router if the host is reachable from other machines, since Compose's port mapping alone does not scope access to the LAN.

## 1. Clone the repo

```bash
git clone https://github.com/Cundanreddy/inventory-its.git
cd inventory-its
```

## 2. Create environment files

Two `.env` files are required and are **not committed to git** (see `.gitignore`). Copy the examples below and fill in real values — never commit actual secrets.

**Root `.env`** (used by `docker-compose.yml`):

```env
DB_PASSWORD=your_postgres_password
REDIS_PASSWORD=your_redis_password
```

**`server/.env`** (used by the API container):

```env
# ── Database ─────────────────────────────────────────────────
DB_HOST=postgres
DB_PORT=5432
DB_NAME=inventory_db
DB_USER=its_user
DB_PASSWORD=your_postgres_password

# ── Redis ────────────────────────────────────────────────────
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# ── JWT ──────────────────────────────────────────────────────
# Generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=generate_your_own_64byte_hex_secret
JWT_REFRESH_SECRET=generate_a_different_64byte_hex_secret

# ── App ──────────────────────────────────────────────────────
PORT=3001
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# ── Email (optional) ─────────────────────────────────────────
SMTP_HOST=mail.office.local
SMTP_PORT=587
SMTP_USER=inventory@office.local
SMTP_PASS=smtp_password
SMTP_FROM=inventory@office.local
```

`DB_PASSWORD` and `REDIS_PASSWORD` must match between the root `.env` and `server/.env`. `JWT_SECRET` and `JWT_REFRESH_SECRET` must each be unique, high-entropy values — generate your own per environment, and rotate them immediately if they're ever shared, logged, or committed. The SMTP block is only needed if the app sends email (e.g. password resets, notifications); leave it out otherwise.

## 3. Add Nginx config and certs

- Place your reverse proxy config at `./nginx/nginx.conf`
- Place TLS certificate/key files in `./certs` (referenced by your `nginx.conf`)

If you don't need HTTPS locally yet, you can point `nginx.conf` at HTTP only and skip the certs step.

## 4. Build and start the stack

```bash
docker compose up --build
```

This will:
1. Start Postgres and wait for its healthcheck to pass
2. Start Redis
3. Build and start the API container, which runs `npm run migrate && npm run seed` before starting the dev server
4. Build and start the client (Vite) dev server
5. Start Nginx in front of `api` and `client`

To run in the background:

```bash
docker compose up -d --build
```

## 5. Enable hot-reload (optional but recommended)

Instead of `up`, use Compose Watch so file changes rebuild/sync containers automatically:

```bash
docker compose watch
```

Behavior per service:
- **`api`**: any change under `./server` (excluding `node_modules/`, `dist/`, `.env`) triggers a full **rebuild**
- **`client`**: any change under `./client` (excluding `node_modules/`, `dist/`) triggers a full **rebuild**
- **`nginx`**: changes to `./nginx` or `./certs` are **synced** into the container live (no rebuild)

## Useful commands

```bash
# View logs for a specific service
docker compose logs -f api

# Rebuild a single service
docker compose build api

# Restart a single service
docker compose restart client

# Stop everything
docker compose down

# Stop everything and wipe volumes (Postgres + Redis data)
docker compose down -v

# Open a shell inside a running container
docker compose exec api sh
docker compose exec postgres psql -U its_user -d inventory_db
```

## Accessing the app

| What              | URL                          |
|-------------------|-------------------------------|
| Frontend (direct)  | http://localhost:5173         |
| API (direct)       | http://localhost:3001         |
| Via Nginx          | http://localhost / https://localhost |
| Postgres           | localhost:5432 (from host tools like pgadmin/psql/DBeaver) |

## Troubleshooting

- **API keeps restarting**: check `docker compose logs api` — likely a failed migration/seed step or a missing `server/.env` variable.
- **"password authentication failed" for Postgres**: confirm `DB_PASSWORD` in root `.env` matches the connection string in `server/.env`.
- **Redis auth errors**: confirm `REDIS_PASSWORD` matches between root `.env` and any `REDIS_URL` used by the API.
- **Port already in use**: another process on the host is using `5432`, `3001`, `5173`, `80`, or `443` — stop it or change the mapped host port in `docker-compose.yml`.
- **Watch isn't rebuilding**: confirm you're on Docker Compose v2.22+ (`docker compose version`) and that you started the stack with `docker compose watch`, not just `up`.

## Notes

- `node_modules` for both `api` and `client` are kept in anonymous volumes (`/server/node_modules`, `/app/node_modules`) so the host's `node_modules` (if any) doesn't clash with the container's Linux-built binaries.
- The `NODE_ENV: development` build arg on `api` means this compose file is intended for **local development**, not production.

## Secrets & git hygiene

- Never commit `.env` or `server/.env`. This repo already has a `.gitignore` at the root — double-check it excludes both `.env` and `server/.env` before your first commit, and commit `.env.example` / `server/.env.example` instead (same keys, dummy values).
- If a secret (DB password, Redis password, `JWT_SECRET`, `JWT_REFRESH_SECRET`, SMTP credentials) is ever pasted into a chat, ticket, log, or committed by accident, treat it as compromised and rotate it — this is especially important for the JWT secrets, since anyone holding them can forge valid auth tokens.
- Generate JWT secrets per environment (dev/staging/prod) rather than reusing one value everywhere:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```