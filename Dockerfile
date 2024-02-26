FROM node:20-bookworm-slim as base

ARG UID=1001
ARG GID=1001

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

RUN echo 'deb http://deb.debian.org/debian bookworm-backports main' >> /etc/apt/sources.list
RUN apt-get update && apt-get install -y \
    supervisor curl jq jc borgbackup/bookworm-backports openssh-server rsyslog && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

RUN groupadd -g ${GID} borgwarehouse && useradd -m -u ${UID} -g ${GID} borgwarehouse

RUN cp /etc/ssh/moduli /home/borgwarehouse/

WORKDIR /home/borgwarehouse/app

COPY --from=builder --chown=borgwarehouse:borgwarehouse /app/docker/docker-bw-init.sh /app/LICENSE ./
COPY --from=builder --chown=borgwarehouse:borgwarehouse /app/helpers/shells ./helpers/shells
COPY --from=builder --chown=borgwarehouse:borgwarehouse /app/.next/standalone ./
COPY --from=builder --chown=borgwarehouse:borgwarehouse /app/public ./public
COPY --from=builder --chown=borgwarehouse:borgwarehouse /app/.next/static ./.next/static
COPY --from=builder --chown=borgwarehouse:borgwarehouse /app/docker/supervisord.conf ./
COPY --from=builder --chown=borgwarehouse:borgwarehouse /app/docker/rsyslog.conf /etc/rsyslog.conf
COPY --from=builder --chown=borgwarehouse:borgwarehouse /app/docker/sshd_config ./

USER borgwarehouse

EXPOSE 3000 22

ENTRYPOINT ["./docker-bw-init.sh"]