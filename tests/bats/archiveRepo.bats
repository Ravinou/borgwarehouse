#!/usr/bin/env bats

setup() {
  # Setup the environment for each test
  export home="/tmp/borgwarehouse"
  mkdir -p "${home}/.ssh"

  # SSH key sample for testing
  export SSH_KEY_ED25519="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICtujwncNGgdNxWOCQedMCnrhRZT4B7eUyyFJNryvQj9 publickey"

  # Seed authorized_keys with two repository forced-command lines.
  cat > "${home}/.ssh/authorized_keys" <<EOF
command="cd ${home}/repos;borg serve --restrict-to-repository ${home}/repos/abcdef12 --storage-quota 10G",restrict $SSH_KEY_ED25519
command="cd ${home}/repos;borg serve --append-only --restrict-to-repository ${home}/repos/abcdef99 --storage-quota 5G",restrict $SSH_KEY_ED25519
EOF
}

teardown() {
  # Cleanup after each test
  rm -rf /tmp/borgwarehouse
}

@test "Test archiveRepo.sh with missing arguments" {
  run bash /test/scripts/archiveRepo.sh
  [ "$status" -eq 1 ]
  [ "$output" == "This shell takes 2 args : [repositoryName] [archive true|false]." ]
}

@test "Test archiveRepo.sh with only one argument" {
  run bash /test/scripts/archiveRepo.sh "abcdef12"
  [ "$status" -eq 1 ]
  [ "$output" == "This shell takes 2 args : [repositoryName] [archive true|false]." ]
}

@test "Test archiveRepo.sh with an invalid archive flag" {
  run bash /test/scripts/archiveRepo.sh "abcdef12" "blabla"
  [ "$status" -eq 1 ]
  [ "$output" == "This shell takes 2 args : [repositoryName] [archive true|false]." ]
}

@test "Test archiveRepo.sh with repositoryName not matching hex format" {
  run bash /test/scripts/archiveRepo.sh "ffff/123" "true"
  [ "$status" -eq 2 ]
  [ "$output" == "Invalid repository name. Must be an 8-character hex string." ]
}

@test "Test archiveRepo.sh when authorized_keys is missing" {
  rm "${home}/.ssh/authorized_keys"
  run bash /test/scripts/archiveRepo.sh "abcdef12" "true"
  [ "$status" -eq 3 ]
  [ "$output" == "${home}/.ssh/authorized_keys must be present" ]
}

@test "Test archiveRepo.sh when no line matches the repository" {
  run bash /test/scripts/archiveRepo.sh "aaaaaaaa" "true"
  [ "$status" -eq 4 ]
  [ "$output" == "No line containing aaaaaaaa found in authorized_keys" ]
}

@test "Test archiveRepo.sh archives a repository by disabling its line" {
  run bash /test/scripts/archiveRepo.sh "abcdef12" "true"
  [ "$status" -eq 0 ]
  [ "$output" == "The repository abcdef12 has been archived." ]

  # The abcdef12 line must be prefixed with the marker.
  grep -q "^#BW-ARCHIVED command=\".*abcdef12.*\",restrict" "${home}/.ssh/authorized_keys"
  # The other repository must be untouched (no marker).
  ! grep -q "^#BW-ARCHIVED command=\".*abcdef99.*\",restrict" "${home}/.ssh/authorized_keys"
}

@test "Test archiveRepo.sh is idempotent (no double marker)" {
  bash /test/scripts/archiveRepo.sh "abcdef12" "true"
  run bash /test/scripts/archiveRepo.sh "abcdef12" "true"
  [ "$status" -eq 0 ]
  # There must be exactly one marker occurrence on the line.
  count=$(grep -c "^#BW-ARCHIVED #BW-ARCHIVED" "${home}/.ssh/authorized_keys" || true)
  [ "$count" -eq 0 ]
  grep -q "^#BW-ARCHIVED command=\".*abcdef12.*\",restrict" "${home}/.ssh/authorized_keys"
}

@test "Test archiveRepo.sh unarchives a repository by restoring its line" {
  bash /test/scripts/archiveRepo.sh "abcdef12" "true"
  run bash /test/scripts/archiveRepo.sh "abcdef12" "false"
  [ "$status" -eq 0 ]
  [ "$output" == "The repository abcdef12 has been unarchived." ]

  # The marker must be gone and the original line restored verbatim.
  ! grep -q "^#BW-ARCHIVED" "${home}/.ssh/authorized_keys"
  grep -q "^command=\".*abcdef12.*\",restrict $SSH_KEY_ED25519" "${home}/.ssh/authorized_keys"
}

@test "Test archiveRepo.sh preserves append-only settings across archive/unarchive" {
  bash /test/scripts/archiveRepo.sh "abcdef99" "true"
  grep -q "^#BW-ARCHIVED command=\".*--append-only.*abcdef99.*\",restrict" "${home}/.ssh/authorized_keys"
  bash /test/scripts/archiveRepo.sh "abcdef99" "false"
  # The --append-only flag must still be present after unarchiving.
  grep -q "^command=\".*--append-only.*abcdef99.*\",restrict" "${home}/.ssh/authorized_keys"
}
