FROM node:22.13.1-alpine AS frontend-builder

WORKDIR /app

ARG NEXT_PUBLIC_API_URL=/api
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_FEATURE_REGISTRATION_API=true
ARG NEXT_PUBLIC_FEATURE_ADMIN_API=false
ARG NEXT_PUBLIC_COMPETITION_PHASE=open
ARG NEXT_PUBLIC_CHALLENGE_PHASE=soon

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY \
    NEXT_PUBLIC_FEATURE_REGISTRATION_API=$NEXT_PUBLIC_FEATURE_REGISTRATION_API \
    NEXT_PUBLIC_FEATURE_ADMIN_API=$NEXT_PUBLIC_FEATURE_ADMIN_API \
    NEXT_PUBLIC_COMPETITION_PHASE=$NEXT_PUBLIC_COMPETITION_PHASE \
    NEXT_PUBLIC_CHALLENGE_PHASE=$NEXT_PUBLIC_CHALLENGE_PHASE

COPY package*.json ./
RUN npm ci
COPY app ./app
COPY components ./components
COPY lib ./lib
COPY public ./public
COPY next.config.ts next-env.d.ts tsconfig.json ./
RUN npm run build && npm prune --omit=dev

FROM node:22.13.1-alpine AS backend-builder

WORKDIR /app/backend

COPY backend/package*.json ./
COPY backend/prisma ./prisma
COPY backend/prisma.config.ts ./
RUN npm ci
COPY backend .
RUN npm run prisma:generate && npm run build

FROM node:22.13.1-alpine AS production

WORKDIR /app
ENV NODE_ENV=production

COPY --from=frontend-builder /app/.next ./.next
COPY --from=frontend-builder /app/node_modules ./node_modules
COPY --from=frontend-builder /app/package*.json ./
COPY --from=frontend-builder /app/public ./public
COPY --from=frontend-builder /app/next.config.ts ./next.config.ts

COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/package*.json ./backend/
COPY --from=backend-builder /app/backend/prisma ./backend/prisma
COPY --from=backend-builder /app/backend/prisma.config.ts ./backend/prisma.config.ts

COPY scripts/start-production.mjs ./scripts/start-production.mjs

EXPOSE 10000

CMD ["node", "scripts/start-production.mjs"]
