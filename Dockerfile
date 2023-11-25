ARG RESOURCESPLACE="/docker-resources"
ARG RUNASUSER="borgwarehouse"
ARG RUNASUSERID="1001"
ARG RUNASGROUP="1001"
ARG BASE_IMAGE="node:20.9.0-alpine3.18"

FROM ${BASE_IMAGE} as base
FROM --platform=${BUILDPLATFORM:-linux/amd64} ${BASE_IMAGE} as build_base

# build stages

## npm install
FROM build_base AS deps

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --only=production

## npm build
FROM build_base AS builder

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
# NOTE: jc isn't available in alpine repos, so we need to install it via pip
# NOTE2: we pre-install all the available dependencies for jc from the alpine repos to avoid having to build them ourselves
RUN apk add jq python3 borgbackup openssh-server bash coreutils openssl supervisor nss_wrapper gettext rsyslog py3-pip py3-ruamel.yaml py3-xmltodict \
    && python3 -m pip install --root-user-action=ignore jc \
    && apk del py3-pip \
    && rm -rf /var/cache/apk/*

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
