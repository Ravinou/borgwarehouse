#!/usr/bin/env bash

# Clean up test environment for BorgWarehouse
# SAFE: Only removes files in tests/docker/dev

set -e

# Working directory is tests/docker/dev
WORKDIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VOLUMES_DIR="${WORKDIR}/volumes"
LOCAL_ENV="${WORKDIR}/.env"

echo "🧹 BorgWarehouse - Cleanup Script"
echo "Working in: ${WORKDIR}"
echo ""

# Stop containers
echo "🛑 Stopping containers..."
cd "${WORKDIR}/../../../"  # Go to project root
docker compose --env-file "${LOCAL_ENV}" -f docker-compose.yml -f "${WORKDIR}/docker-compose.override.yml" down -v --rmi local 2>/dev/null || true

# Ask before removing files (ONLY in tests/docker/dev)
echo "Files to be removed:"
[ -d "${VOLUMES_DIR}" ] && echo "  - ${VOLUMES_DIR}/"
[ -f "${LOCAL_ENV}" ] && echo "  - ${LOCAL_ENV}"
echo ""

read -p "❓ Remove test data (volumes/, .env) in tests/docker/dev? [y/N] " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🗑️  Removing test data from ${WORKDIR}..."
    [ -d "${VOLUMES_DIR}" ] && rm -rIv "${VOLUMES_DIR}"
    [ -f "${LOCAL_ENV}" ] && rm -Iv "${LOCAL_ENV}"
    echo "✅ Cleanup complete!"
else
    echo "⏭️ Keeping test data"
fi

echo ""
echo "Done!"
