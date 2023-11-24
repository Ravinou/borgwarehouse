ARG RESOURCESPLACE="/docker-resources"
ARG RUNASUSER="borgwarehouse"
ARG RUNASUSERID="1001"
ARG RUNASGROUP="1001"

FROM node:20.9.0-alpine3.18 as base

# build stages

## no prebuilt jc package for alpine
FROM base AS jc

###################################
# jc installation via pip packages
# For arm64 : gcc lib-dev python3-dev - needed to install jc
RUN apk add --no-cache py3-pip gcc libc-dev python3-dev

RUN python3 -m pip install jc

## npm install
FROM base AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --only=production

## npm build
FROM base AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY . .

ENV NODE_ENV=production

RUN sed -i "s/images:/output: 'standalone',images:/" next.config.js

RUN npm run build

# run stage
FROM base AS runner
ARG RESOURCESPLACE
ARG RUNASUSER
ARG RUNASUSERID
ARG RUNASGROUP

## Packages installation
RUN apk add --no-cache jq python3 borgbackup openssh-server bash openssl supervisor nss_wrapper gettext rsyslog
## install jc FROM jc stage
COPY --from=jc --chown=${RUNASUSER}:${RUNASUSER} /usr/bin/jc /usr/bin/jc
COPY --from=jc --chown=${RUNASUSER}:${RUNASUSER} /usr/lib/python3.11/site-packages/jc /usr/lib/python3.11/site-packages/jc

## Creating user & group
RUN addgroup -S ${RUNASUSER} --gid "${RUNASGROUP}" && adduser -S ${RUNASUSER} -s /bin/bash --uid "${RUNASUSERID}" -G ${RUNASUSER}

## Base configurations
COPY ${RESOURCESPLACE}/sshd_config /sshd_config.conf
COPY ${RESOURCESPLACE}/rsyslog.conf /etc/rsyslog.conf
COPY ${RESOURCESPLACE}/supervisord.conf /etc/supervisord.conf
COPY ${RESOURCESPLACE}/nss_wrapper_profile.sh /etc/bash/.

## Entrypoint
COPY ${RESOURCESPLACE}/entrypoint.sh /entrypoint.sh

## Prepare sshd key files place && set authorizations
RUN chown -R ${RUNASUSER}:${RUNASUSER} /etc/ssh /tmp

USER ${RUNASUSERID}

WORKDIR /home/${RUNASUSER}/app

COPY --from=builder --chown=${RUNASUSER}:${RUNASUSER} /app/LICENSE ./
COPY --from=builder --chown=${RUNASUSER}:${RUNASUSER} /app/helpers/shells ./helpers/shells
COPY --from=builder --chown=${RUNASUSER}:${RUNASUSER} /app/.next/standalone ./
COPY --from=builder --chown=${RUNASUSER}:${RUNASUSER} /app/public ./public
COPY --from=builder --chown=${RUNASUSER}:${RUNASUSER} /app/.next/static ./.next/static

EXPOSE 2222 3000

ENTRYPOINT ["/entrypoint.sh"]

CMD ["supervisord","-c","/etc/supervisord.conf"]
