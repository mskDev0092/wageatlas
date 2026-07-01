# Configuration & Deployment

> **File:** `docs/config-deploy.md`

---

## 1. Build Pipeline

```
bun install
  │
  ▼
bun run build
  │  └─ next build (produces .next/standalone/)
  │  └─ cp .next/static → .next/standalone/.next/
  │  └─ cp public/ → .next/standalone/
  │
  ▼
.zscripts/build.sh
  │  └─ Runs full pipeline
  │  └─ Copies SQLite DB
  │  └─ Packages into .tar.gz
  │
  ▼
Production artifact: /tmp/build_fullstack_{BUILD_ID}/wageatlas.tar.gz
```

---

## 2. Scripts Reference

| Script | Command | Purpose |
|---|---|---|
| dev | `bun run dev` | Next.js dev server on port 3000 |
| build | `bun run build` | Production build + asset copy |
| start | `NODE_ENV=production bun .next/standalone/server.js` | Run standalone server |
| lint | `eslint .` | Run ESLint |
| db:push | `prisma db push` | Push schema to SQLite |
| db:generate | `prisma generate` | Generate Prisma client |
| db:migrate | `prisma migrate dev` | Run migrations |
| db:reset | `prisma migrate reset` | Reset database |

---

## 3. Key Configuration Files

### `next.config.ts`
```ts
const nextConfig: NextConfig = {
  output: "standalone",           // Self-contained Node.js server
  typescript: { ignoreBuildErrors: true },  // Type errors don't block build
  reactStrictMode: false,         // Disabled to reduce double-render issues
}
```

### `Caddyfile`
```
:81 {
  reverse_proxy localhost:3000
}
```
Routes port 81 → Next.js on port 3000.

### `components.json` (shadcn/ui)
```json
{
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": { "config": "tailwind.config.ts" },
  "aliases": { "components": "@/components", "utils": "@/lib/utils" }
}
```

---

## 4. Environment Variables

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `DATABASE_URL` | No | — | Prisma SQLite path (app is fully static — not used at runtime) |

---

## 5. Deployment

### Standalone Server
The `next build` command with `output: "standalone"` produces a self-contained server in `.next/standalone/`:

```
.next/standalone/
├── server.js          # Node.js server
├── .next/             # Static files + chunks
│   └── static/
├── public/            # Copied from project root
└── package.json
```

To deploy:
```bash
cp -r .next/standalone /deploy/path
cd /deploy/path && NODE_ENV=production node server.js
```

### Full Package (via build.sh)
The `.zscripts/build.sh` script produces a `.tar.gz` containing:
- Next.js standalone server
- SQLite database
- Mini-services (if any)
- Start script
- Caddyfile
