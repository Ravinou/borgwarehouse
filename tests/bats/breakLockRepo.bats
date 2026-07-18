#!/usr/bin/env bats

setup() {
  # Setup the environment for each test
  export home="/tmp/borgwarehouse"
  mkdir -p "${home}/repos"

  # borg break-lock runs without a passphrase; disable interactive prompts so an
  # unencrypted test repository can be initialized without hanging.
  export BORG_UNKNOWN_UNENCRYPTED_REPO_ACCESS_IS_OK=yes
}

teardown() {
  # Cleanup after each test
  rm -rf /tmp/borgwarehouse
  rm -rf /tmp/borgwarehouse-ext
}

@test "Test breakLockRepo.sh with missing arguments" {
  run bash /test/scripts/breakLockRepo.sh
  [ "$status" -eq 1 ]
  [ "$output" == "You must provide a repositoryName in argument." ]
}

@test "Test breakLockRepo.sh with repositoryName shorter than 8 characters" {
  run bash /test/scripts/breakLockRepo.sh "1234567"
  [ "$status" -eq 2 ]
  [ "$output" == "Invalid repository name. Must be an 8-character hex string." ]
}

@test "Test breakLockRepo.sh with repositoryName longer than 8 characters" {
  run bash /test/scripts/breakLockRepo.sh "123456789"
  [ "$status" -eq 2 ]
  [ "$output" == "Invalid repository name. Must be an 8-character hex string." ]
}

@test "Test breakLockRepo.sh with unexpected character in repositoryName" {
  run bash /test/scripts/breakLockRepo.sh "ffff/123"
  [ "$status" -eq 2 ]
  [ "$output" == "Invalid repository name. Must be an 8-character hex string." ]
}

@test "Test breakLockRepo.sh for non-existing repository" {
  run bash /test/scripts/breakLockRepo.sh "abcdef12"
  [ "$status" -eq 3 ]
  [ "$output" == "The repository abcdef12 does not exist or has never been initialized." ]
}

@test "Test breakLockRepo.sh on a real initialized repository" {
  # Initialize a real (unencrypted) borg repository. break-lock succeeds even
  # when there is no lock to release.
  borg init --encryption=none "${home}/repos/abcdef12"

  run bash /test/scripts/breakLockRepo.sh "abcdef12"

  [ "$status" -eq 0 ]
  [ "$output" == "The lock on repository abcdef12 has been released." ]
}

@test "Test breakLockRepo.sh releases an existing stale lock" {
  # Initialize a repository and manually create a lock directory to simulate a
  # stale lock left behind by an interrupted operation.
  borg init --encryption=none "${home}/repos/abcdef12"
  mkdir -p "${home}/repos/abcdef12/lock.exclusive"

  run bash /test/scripts/breakLockRepo.sh "abcdef12"

  [ "$status" -eq 0 ]
  [ "$output" == "The lock on repository abcdef12 has been released." ]
  # The lock must be gone after break-lock.
  [ ! -d "${home}/repos/abcdef12/lock.exclusive" ]
}

@test "Test breakLockRepo.sh on an external storage repository (symlink)" {
  # Simulate an external storage: real data lives outside repos, linked into it.
  mkdir -p "/tmp/borgwarehouse-ext"
  borg init --encryption=none "/tmp/borgwarehouse-ext/abcdef12"
  ln -s "/tmp/borgwarehouse-ext/abcdef12" "${home}/repos/abcdef12"

  run bash /test/scripts/breakLockRepo.sh "abcdef12"

  [ "$status" -eq 0 ]
  [ "$output" == "The lock on repository abcdef12 has been released." ]
}
