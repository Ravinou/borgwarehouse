FROM node:22-bookworm-slim AS base

# build stage
FROM base AS deps

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile --prod

FROM base AS builder

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN sed -i "s/images:/output: 'standalone',images:/" next.config.ts

RUN pnpm run build

# run stage
FROM base AS runner

ENV NODE_ENV=production
ENV HOSTNAME=

RUN echo 'deb http://deb.debian.org/debian bookworm-backports main' >> /etc/apt/sources.list
RUN apt-get update && apt-get install -y \
    supervisor curl jq jc borgbackup/bookworm-backports openssh-server gosu && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Remove the default 'node' user (UID 1000) to avoid conflicts with PUID=1000
RUN userdel -r node 2>/dev/null || true

RUN groupadd -g 1001 borgwarehouse && useradd -m -u 1001 -g 1001 borgwarehouse

RUN cp /etc/ssh/moduli /home/borgwarehouse/

WORKDIR /home/borgwarehouse/app

COPY --from=builder --chown=borgwarehouse:borgwarehouse /app/docker/docker-bw-init.sh /app/LICENSE ./
COPY --from=builder --chown=borgwarehouse:borgwarehouse /app/helpers/shells ./helpers/shells
COPY --from=builder --chown=borgwarehouse:borgwarehouse /app/.next/standalone ./
COPY --from=builder --chown=borgwarehouse:borgwarehouse /app/public ./public
COPY --from=builder --chown=borgwarehouse:borgwarehouse /app/.next/static ./.next/static
COPY --from=builder --chown=borgwarehouse:borgwarehouse /app/docker/supervisord.conf ./
COPY --from=builder --chown=borgwarehouse:borgwarehouse /app/docker/sshd_config ./

# Container starts as root to handle PUID/PGID remapping at runtime.
# The entrypoint drops to borgwarehouse before starting the app.

EXPOSE 3000 22

ENTRYPOINT ["./docker-bw-init.sh"]
