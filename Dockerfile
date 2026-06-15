# Railway build for the WARLANDS authoritative game server (server/).
# The server imports the shared simulation from src/, so the build context
# is the repo root. Vercel ignores this file (it uses the Next.js preset).
FROM node:24-slim
WORKDIR /app

# Shared simulation + game rules consumed by the server at runtime.
COPY src ./src

# Server deps (cached layer).
COPY server/package.json server/package-lock.json ./server/
WORKDIR /app/server
RUN npm ci

# Server source.
WORKDIR /app
COPY server ./server

WORKDIR /app/server
ENV PORT=8080
EXPOSE 8080
CMD ["npm", "start"]
