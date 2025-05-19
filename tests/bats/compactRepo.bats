#!/usr/bin/env bats

setup() {
  export home="/tmp/borgwarehouse"
  export BORG_REPO=""
  mkdir -p "${home}/repos"

  # Ensure borg is installed
  if ! command -v borg >/dev/null; then
    echo "borg not found in PATH; tests require borgbackup installed." >&2
    exit 1
  fi
}

teardown() {
  rm -rf "${home}"
}

@test "Test compactRepo.sh with missing argument" {
  run bash /test/scripts/compactRepo.sh
  [ "$status" -eq 1 ]
  [ "$output" = "You must provide a repositoryName in argument." ]
}

@test "Test compactRepo.sh with empty argument" {
  run bash /test/scripts/compactRepo.sh ""
  [ "$status" -eq 1 ]
  [ "$output" = "You must provide a repositoryName in argument." ]
}

@test "Test compactRepo.sh with invalid repo name" {
  run bash /test/scripts/compactRepo.sh "invalid"
  [ "$status" -eq 2 ]
  [ "$output" = "Invalid repository name. Must be an 8-character hex string." ]
}

@test "Test compactRepo.sh with missing repo path" {
  run bash /test/scripts/compactRepo.sh "12345678"
  [ "$status" -eq 4 ]
  [ "$output" = "Repository path does not exist" ]
}

@test "Test compactRepo.sh with missing borg binary" {
  mv "$(command -v borg)" /tmp/borg-real
  run bash /test/scripts/compactRepo.sh "12345678"
  [ "$status" -eq 3 ]
  [ "$output" = "You must install borgbackup package." ]
  mv /tmp/borg-real "$(dirname "$(command -v bash)")/borg"
}

@test "Test compactRepo.sh with sucessful compactation" {
  repo_name="12345678"
  repo_path="${home}/repos/${repo_name}"
  backup_path="${home}/backup/testdata"
  mkdir -p "$repo_path"
  mkdir -p "$backup_path"
  
  dd if=/dev/random of="$backup_path/bigfile" bs=20M count=1

  borg init --encryption=none "$repo_path"
  borg create "$repo_path"::test "$backup_path"


  # Get size before compaction (in bytes)
  size_before=$(du -sb "$repo_path" | awk '{print $1}')
  
  # Run the compaction script
  run bash /test/scripts/compactRepo.sh "$repo_name"
  [ "$status" -eq 0 ]
  [ "$output" = "Compacting of 12345678 complete" ]

  # Get size after compaction
  size_after=$(du -sb "$repo_path" | awk '{print $1}')

  # Check that the size after is less than the size before
  [[ "$size_after" -lt "$size_before" ]]
}
