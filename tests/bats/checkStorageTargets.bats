#!/usr/bin/env bats

setup() {
  export testroot="/tmp/borgwarehouse-cst"
  mkdir -p "${testroot}/online"
  chmod 755 "${testroot}/online"

  # A broken symlink simulates an unreachable / disappeared external storage.
  ln -s "${testroot}/does-not-exist" "${testroot}/broken"
}

teardown() {
  rm -rf /tmp/borgwarehouse-cst
}

@test "Test checkStorageTargets.sh reports an existing writable directory as online" {
  run bash /test/scripts/checkStorageTargets.sh "${testroot}/online"

  status_value=$(echo "$output" | jq -r '.[0].status')
  path_value=$(echo "$output" | jq -r '.[0].path')

  [ "$status" -eq 0 ]
  [ "$status_value" = "online" ]
  [ "$path_value" = "${testroot}/online" ]
}

@test "Test checkStorageTargets.sh reports a missing path as unreachable" {
  run bash /test/scripts/checkStorageTargets.sh "${testroot}/missing"

  status_value=$(echo "$output" | jq -r '.[0].status')

  [ "$status" -eq 0 ]
  [ "$status_value" = "unreachable" ]
}

@test "Test checkStorageTargets.sh reports a broken symlink as unreachable" {
  run bash /test/scripts/checkStorageTargets.sh "${testroot}/broken"

  status_value=$(echo "$output" | jq -r '.[0].status')

  [ "$status" -eq 0 ]
  [ "$status_value" = "unreachable" ]
}

@test "Test checkStorageTargets.sh handles multiple targets" {
  run bash /test/scripts/checkStorageTargets.sh "${testroot}/online" "${testroot}/missing"

  count=$(echo "$output" | jq 'length')
  first=$(echo "$output" | jq -r '.[0].status')
  second=$(echo "$output" | jq -r '.[1].status')

  [ "$status" -eq 0 ]
  [ "$count" -eq 2 ]
  [ "$first" = "online" ]
  [ "$second" = "unreachable" ]
}

@test "Test checkStorageTargets.sh returns an empty JSON array with no arguments" {
  run bash /test/scripts/checkStorageTargets.sh

  normalized_output=$(echo "$output" | jq -c '.')

  [ "$status" -eq 0 ]
  [ "$normalized_output" = "[]" ]
}
