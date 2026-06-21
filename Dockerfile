# Railway build for the WARLANDS authoritative game server (server/).
# The server imports the shared simulation from src/, so the build context
# is the repo root. Vercel ignores this file (it uses the Next.js preset).
FROM node:24-slim
WORKDIR /app

# Deps imported by the SHARED src/ (wallet-sig crypto: src/sim/coc/auth.ts). Node resolves a
# module relative to the importing FILE, so /app/src/* resolves from /app/node_modules (its
# ancestor) — NOT the sibling server/node_modules. These must live at /app or the server crashes
# on boot (Cannot find module '@noble/curves'). Pinned to match the root app.
RUN npm init -y >/dev/null 2>&1 \
 && npm install --no-audit --no-fund @noble/curves@1.9.1 bs58@6.0.0 \
 && node -e "require('node:fs').accessSync('node_modules/@noble/curves'); require('node:fs').accessSync('node_modules/bs58')" \
 && echo "src deps verified"

# Shared simulation + game rules consumed by the server at runtime.
COPY src ./src

# Server deps (server/index.ts resolves pg/ws/tsx from server/node_modules).
COPY server/package.json server/package-lock.json ./server/
WORKDIR /app/server
RUN npm ci \
 && node -e "require.resolve('bs58'); require('node:fs').accessSync('node_modules/@noble/curves'); require('node:fs').accessSync('node_modules/pg')" \
 && echo "server deps verified"

# Server source.
WORKDIR /app
COPY server ./server

WORKDIR /app/server
ENV PORT=8080
EXPOSE 8080
CMD ["npm", "start"]
