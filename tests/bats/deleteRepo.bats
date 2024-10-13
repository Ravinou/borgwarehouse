#!/usr/bin/env bats

setup() {
  # Setup the environment for each test
  export home="/tmp/borgwarehouse"
  mkdir -p "${home}/repos"
  mkdir -p "${home}/.ssh"
  touch "${home}/.ssh/authorized_keys"
  
  # SSH keys samples for testing
  export SSH_KEY_ED25519="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICtujwncNGgdNxWOCQedMCnrhRZT4B7eUyyFJNryvQj9 publickey"
}

teardown() {
  # Cleanup after each test
  rm -rf /tmp/borgwarehouse
}

@test "Test deleteRepo.sh with missing arguments" {
  run bash /test/scripts/deleteRepo.sh
  [ "$status" -eq 1 ]
  [ "$output" == "You must provide a repositoryName in argument." ]
}

@test "Test deleteRepo.sh with repositoryName shorter than 8 characters" {
  run bash /test/scripts/deleteRepo.sh "1234567"
  [ "$status" -eq 2 ]
  [ "$output" == "Invalid repository name. Must be an 8-character hex string." ]
}

@test "Test deleteRepo.sh with repositoryName longer than 8 characters" {
  run bash /test/scripts/deleteRepo.sh "123456789"
  [ "$status" -eq 2 ]
  [ "$output" == "Invalid repository name. Must be an 8-character hex string." ]
}

@test "Test deleteRepo.sh with unexpected character in repositoryName" {
  run bash /test/scripts/deleteRepo.sh "ffff/123"
  [ "$status" -eq 2 ]
  [ "$output" == "Invalid repository name. Must be an 8-character hex string." ]
}

@test "Test deleteRepo.sh for non-existing repository and associated key" {
  # Add an SSH key to authorized_keys without creating the repository
  echo "command=\"cd ${home}/repos;borg serve --restrict-to-path ${home}/repos/abcdef12 --storage-quota 10G\",restrict $SSH_KEY_ED25519" >> "${home}/.ssh/authorized_keys"
  
  run bash /test/scripts/deleteRepo.sh "abcdef12"
  
  [ "$status" -eq 0 ]
  [ "$output" == "The folder ${home}/repos/abcdef12 did not exist (repository never initialized or used). The line associated in the authorized_keys file has been deleted." ]
  
  # Check that the line was removed from authorized_keys
  ! grep -q "abcdef12" "${home}/.ssh/authorized_keys"
}

@test "Test deleteRepo.sh for existing repository but no associated key in authorized_keys" {
  # Create a repository folder without adding the corresponding entry in authorized_keys
  mkdir -p "${home}/repos/abcdef13"
  
  run bash /test/scripts/deleteRepo.sh "abcdef13"
  
  [ "$status" -eq 0 ]
  [ "$output" == "The folder ${home}/repos/abcdef13 and all its data have been deleted. The line associated in the authorized_keys file has been deleted." ]
  
  # Check that the repository folder is deleted
  [ ! -d "${home}/repos/abcdef13" ]
  
  # Check that no line was present in authorized_keys to begin with (and nothing was affected)
  ! grep -q "abcdef13" "${home}/.ssh/authorized_keys"
}

@test "Test deleteRepo.sh for existing repository and associated key" {
  # Create a repository folder and add a corresponding entry in authorized_keys
  mkdir -p "${home}/repos/abcdef12"
  echo "command=\"cd ${home}/repos;borg serve --restrict-to-path ${home}/repos/abcdef12 --storage-quota 10G\",restrict $SSH_KEY_ED25519" >> "${home}/.ssh/authorized_keys"
  
  run bash /test/scripts/deleteRepo.sh "abcdef12"
  
  [ "$status" -eq 0 ]
  [ "$output" == "The folder ${home}/repos/abcdef12 and all its data have been deleted. The line associated in the authorized_keys file has been deleted." ]
  
  # Check that the repository folder is deleted
  [ ! -d "${home}/repos/abcdef12" ]
  
  # Check that the line was removed from authorized_keys
  ! grep -q "abcdef12" "${home}/.ssh/authorized_keys"
}



