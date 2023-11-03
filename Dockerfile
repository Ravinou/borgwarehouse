FROM node:20-bookworm-slim as base

# build stage
FROM base AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --only=production

FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN sed -i "s/images:/output: 'standalone',images:/" next.config.js

RUN npm run build

# run stage
FROM base AS runner

ENV NODE_ENV production

RUN apt-get update && apt-get install -y \
    curl jq jc borgbackup openssh-server sudo cron && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN echo "borgwarehouse ALL=(ALL) NOPASSWD: /usr/sbin/service ssh restart" >> /etc/sudoers

RUN echo "borgwarehouse ALL=(ALL) NOPASSWD: /usr/sbin/service cron restart" >> /etc/sudoers

RUN groupadd borgwarehouse

RUN useradd -m -g borgwarehouse borgwarehouse

RUN cp /etc/ssh/sshd_config /etc/ssh/moduli /home/borgwarehouse/

WORKDIR /home/borgwarehouse/app

COPY --from=builder --chown=borgwarehouse:borgwarehouse /app/docker-bw-init.sh /app/LICENSE ./
COPY --from=builder --chown=borgwarehouse:borgwarehouse /app/helpers/shells ./helpers/shells
COPY --from=builder --chown=borgwarehouse:borgwarehouse /app/.next/standalone ./
COPY --from=builder --chown=borgwarehouse:borgwarehouse /app/public ./public
COPY --from=builder --chown=borgwarehouse:borgwarehouse /app/.next/static ./.next/static

USER borgwarehouse

EXPOSE 3000 22

ENTRYPOINT ["./docker-bw-init.sh"]

CMD ["node", "server.js"]