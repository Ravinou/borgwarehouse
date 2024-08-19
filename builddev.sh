#!/bin/bash
set -e
set -u
. .envMytinydc
#NOCACHE="--no-cache"
NOCACHE=""
PLATFORM="--platform=linux/arm64"
PROGRESS="--progress plain"
docker buildx build --load $PROGRESS $NOCACHE $PLATFORM -t "${IMAGE}":"${TAG}" -f Dockerfile .
