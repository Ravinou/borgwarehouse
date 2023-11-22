ARG RESOURCESPLACE="/docker-resources"
ARG RUNASUSER="borgwarehouse"
ARG RUNASUSERID="1001"
ARG RUNASGROUP="1001"

## For arm64 : gcc lib-dev python3-dev - needed to install jc
## try to play with $BUILDPLATFORM and buildx but impossible to get value
ARG ADDITIONALPACKAGEARM64="gcc libc-dev python3-dev"

FROM node:20.9.0-alpine3.18 as base

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

# # run stage
FROM base AS runner
ARG RESOURCESPLACE
ARG RUNASUSER
ARG RUNASUSERID
ARG RUNASGROUP
ARG ADDITIONALPACKAGEARM64

# Packages installation
RUN apk add --no-cache jq py3-pip borgbackup openssh-server bash openssl nss_wrapper gettext ${ADDITIONALPACKAGEARM64}
## jc installation via pip packages - not alpine package available
RUN python3 -m pip install jc

ENV NODE_ENV production

RUN addgroup -S ${RUNASUSER} --gid "${RUNASGROUP}" && adduser -S ${RUNASUSER} -s /bin/bash --uid "${RUNASUSERID}" -G ${RUNASUSER}
## Prepare sshd configuration place
RUN mkdir -p /etc_ssh/etc/ssh && chown -R ${RUNASUSER}:${RUNASUSER} /etc_ssh

USER ${RUNASUSERID}

## Copy sshd_config
COPY --chown=${RUNASUSER}:${RUNASUSER} ${RESOURCESPLACE}/sshd_config /sshd_config.conf
COPY --chmod=755 --chown=${RUNASUSER}:${RUNASUSER} ${RESOURCESPLACE}/entrypoint.sh /entrypoint.sh
COPY --chmod=755 --chown=${RUNASUSER}:${RUNASUSER} ${RESOURCESPLACE}/nss_wrapper_profile.sh /etc/bash/.

WORKDIR /home/${RUNASUSER}/app

COPY --from=builder --chown=${RUNASUSER}:${RUNASUSER} /app/LICENSE ./
COPY --from=builder --chown=${RUNASUSER}:${RUNASUSER} /app/helpers/shells ./helpers/shells
COPY --from=builder --chown=${RUNASUSER}:${RUNASUSER} /app/.next/standalone ./
COPY --from=builder --chown=${RUNASUSER}:${RUNASUSER} /app/public ./public
COPY --from=builder --chown=${RUNASUSER}:${RUNASUSER} /app/.next/static ./.next/static

EXPOSE 2222 3000

ENTRYPOINT ["/entrypoint.sh"]

CMD ["node", "server.js"]
