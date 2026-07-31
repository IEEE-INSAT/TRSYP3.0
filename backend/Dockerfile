# Build the Nest API and its generated Prisma client.
FROM node:22.13.1-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN npm ci

COPY . .
RUN npm run prisma:generate && npm run build

# Keep Prisma CLI available because the free Render service applies pending
# migrations immediately before starting the API.
FROM node:22.13.1-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3001

CMD ["sh", "-c", "npm run prisma:deploy && npm run start:prod"]
