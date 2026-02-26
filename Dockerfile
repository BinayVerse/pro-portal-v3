# Stage 1: Build
FROM node:22-slim AS builder

WORKDIR /app

# Install only deps needed for build
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Production runtime (distroless)
FROM gcr.io/distroless/nodejs22-debian12:nonroot

WORKDIR /app

# Copy only the built output and prod node_modules
COPY --from=builder /app/.output ./.output

# If you actually need runtime deps, do this:
# COPY --from=builder /app/package*.json ./
# RUN npm install --omit=dev --legacy-peer-deps

ENV NUXT_PUBLIC_APP_URL=http://localhost:80
ENV HOST=0.0.0.0
ENV PORT=80

EXPOSE 80

CMD ["./.output/server/index.mjs"]