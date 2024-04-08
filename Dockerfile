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

ARG UID
ARG GID

ENV NODE_ENV production

RUN echo 'deb http://deb.debian.org/debian bookworm-backports main' >> /etc/apt/sources.list

# Adding nss_wrapper support
# && export DEBIAN_FRONTEND=noninteractive
# to avoid ERROR: debconf: (Can't locate Term/ReadLine.pm in @INC (you may need to install the Term::ReadLine module)
RUN apt-get update \
&& export DEBIAN_FRONTEND=noninteractive \
&& apt-get install -y supervisor curl jq jc borgbackup/bookworm-backports openssh-server rsyslog libnss-wrapper \ 
&& apt-get clean && rm -rf /var/lib/apt/lists/*

# nss_wrapper build with predefined user/group (keep original 1001:1001)
RUN groupadd -g 1001 borgwarehouse && useradd -m -u 1001 -g 1001 borgwarehouse

#nss_wrapper profile installation
COPY --from=builder --chown=borgwarehouse:borgwarehouse /app/docker/nss_wrapper_profile.sh /etc/profile.d/.
RUN echo '. /etc/profile.d/nss_wrapper_profile.sh' >> /etc/bash.bashrc

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
