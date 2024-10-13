#!/usr/bin/env bats

setup() {
  # Setup the environment for each test
  export home="/tmp/borgwarehouse"
  mkdir -p "${home}/repos"
  mkdir -p "${home}/.ssh"
  touch "${home}/.ssh/authorized_keys"
  
  # SSH keys samples for testing
  export SSH_KEY_ED25519="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICtujwncNGgdNxWOCQedMCnrhRZT4B7eUyyFJNryvQj9 publickey"
  export SSH_KEY_RSA="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDf8SFSuWqPtPYKjoXL8aowdKYfeKFKbE6w4CvqXPSRtgwKGWJva/UVF8Q/jGClwsVpTJfZnA76fnih76cE4ZiucPtDM2dyDILHNSZo/8rwUVkNB4P3aaCxV6lVMurmIgF4ibWQFBdyWKCJM7nQjO71TlMw/HfqpeYXXdjL1MBlMzqOZYLDrPoiJEiAfKheVeCONMlo8HMfEPxiu7bwfF7vQqYstcbZ55RN1t7RYaxlCTZaj0GOxIGKLmmHTDGzQQIaOGSr3+8Gk1I/MFle2/dYKbBEi97NrJowRO4a4pVbVso0YKyESL3U40uZly1bzoNx4DvMBbFwYSE1IJbs/AQIfB6KH4yLtQTmfb4qPRLCS1CBWBZKeKJ304p6rxKuv+CjagsFwdG5cS7cCosfdEU43QuWngnYQGUwMKskxX/7rPm+WZItN7XiNoMRmzaC+T0cIRXH7Cl7VFE3cbTzgmqJPVeUpccjTP/BdDahHKFqyVhAFvyI7JM4ct1/tU8o015TM1EXzMBeJOxalj6RsuDIFjjEaMN5pZmlHGBFBmcRgY7TqYAwr02maKb9BtcPOGIPgpI3AMzqNX+LjFssI0AuqBGTYN8v6OBr2NmTHfZlnClucjoAw71QPeQySABqrX0p9xieX15Ly1z9oMH9lapW6X9e0JnQBMnz1N2eaq1qAQ== publickey"
}

teardown() {
  # Cleanup after each test
  rm -rf /tmp/borgwarehouse
}

@test "Test updateRepo.sh with missing arguments" {
  run bash /test/scripts/updateRepo.sh
  [ "$status" -eq 1 ]
  [ "$output" == "This shell takes 4 args: [repositoryName] [new SSH pub key] [quota] [Append only mode [true|false]]" ]
}

@test "Test updateRepo.sh with invalid SSH key format" {
  run bash /test/scripts/updateRepo.sh "abcdef12" "invalid-key" 10 true
  [ "$status" -eq 2 ]
  [ "$output" == "Invalid public SSH KEY format. Provide a key in OpenSSH format (rsa, ed25519, ed25519-sk)" ]
}

@test "Test updateRepo.sh with repositoryName shorter than 8 characters" {
  run bash /test/scripts/updateRepo.sh "1234567" "$SSH_KEY_ED25519" 10 true
  [ "$status" -eq 3 ]
  [ "$output" == "Invalid repository name. Must be an 8-character hex string." ]
}

@test "Test updateRepo.sh with repositoryName not matching hex format" {
  run bash /test/scripts/updateRepo.sh "invalid" "$SSH_KEY_ED25519" 10 true
  [ "$status" -eq 3 ]
  [ "$output" == "Invalid repository name. Must be an 8-character hex string." ]
}

@test "Test updateRepo.sh when no matching repository name in authorized_keys" {
  run bash /test/scripts/updateRepo.sh "abcdef12" "$SSH_KEY_ED25519" 10 true
  [ "$status" -eq 4 ]
  [ "$output" == "No line containing abcdef12 found in authorized_keys" ]
}

@test "Test updateRepo.sh when the new SSH key is already present for a different repository" {
  # Add the new key to a different repository
  echo "command=\"cd ${home}/repos;borg serve --restrict-to-path ${home}/repos/abcdef13 --storage-quota 10G\",restrict $SSH_KEY_ED25519" >> "${home}/.ssh/authorized_keys"

  # Add an entry for the repository being updated
  echo "command=\"cd ${home}/repos;borg serve --restrict-to-path ${home}/repos/abcdef12 --storage-quota 10G\",restrict $SSH_KEY_RSA" >> "${home}/.ssh/authorized_keys"
  
  run bash /test/scripts/updateRepo.sh "abcdef12" "$SSH_KEY_ED25519" 10 true
  [ "$status" -eq 5 ]
  [ "$output" == "This SSH pub key is already present in authorized_keys on a different line." ]
}

@test "Test updateRepo.sh with successful update and append-only enabled" {
  # Add an entry for the repository being updated
  echo "command=\"cd ${home}/repos;borg serve --restrict-to-path ${home}/repos/abcdef12 --storage-quota 10G\",restrict $SSH_KEY_RSA" >> "${home}/.ssh/authorized_keys"
  
  # Update the repository with a new SSH key and append-only mode
  run bash /test/scripts/updateRepo.sh "abcdef12" "$SSH_KEY_ED25519" 20 true
  [ "$status" -eq 0 ]
  
  # Check that the line was updated correctly in authorized_keys
  grep -q "command=\"cd ${home}/repos;borg serve --append-only --restrict-to-path ${home}/repos/abcdef12 --storage-quota 20G\",restrict $SSH_KEY_ED25519" "${home}/.ssh/authorized_keys"
}

@test "Test updateRepo.sh with disabling append-only mode" {
  # Add an entry for the repository being updated with append-only enabled
  echo "command=\"cd ${home}/repos;borg serve --append-only --restrict-to-path ${home}/repos/abcdef12 --storage-quota 10G\",restrict $SSH_KEY_RSA" >> "${home}/.ssh/authorized_keys"
  
  # Update the repository with a new SSH key and disable append-only mode
  run bash /test/scripts/updateRepo.sh "abcdef12" "$SSH_KEY_ED25519" 20 false
  [ "$status" -eq 0 ]
  
  # Check that the append-only mode was removed
  grep -q "command=\"cd ${home}/repos;borg serve --restrict-to-path ${home}/repos/abcdef12 --storage-quota 20G\",restrict $SSH_KEY_ED25519" "${home}/.ssh/authorized_keys"
}
