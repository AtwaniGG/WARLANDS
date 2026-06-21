# Railway build for the WARLANDS authoritative game server (server/).
# The server imports the shared simulation from src/, so the build context
# is the repo root. Vercel ignores this file (it uses the Next.js preset).
FROM node:24-slim
WORKDIR /app

# Shared simulation + game rules consumed by the server at runtime.
COPY src ./src

# Server deps. The server resolves modules ONLY from server/node_modules, so assert the wallet-sig
# runtime deps actually installed — failing at BUILD beats a runtime crash-loop. The assertion also
# keys this layer to its command so the install can't be served from a stale cache.
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
