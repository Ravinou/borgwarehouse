#!/usr/bin/env bats

setup() {
  # Set up the environment for each test
  export home="/tmp/borgwarehouse"
  mkdir -p /tmp/borgwarehouse
  mkdir -p /tmp/borgwarehouse/repos
  mkdir -p /tmp/borgwarehouse/.ssh
  touch /tmp/borgwarehouse/.ssh/authorized_keys

  # SSH keys samples for testing
  export SSH_KEY_ED25519="ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICtujwncNGgdNxWOCQedMCnrhRZT4B7eUyyFJNryvQj9 publickey"
  export SSH_KEY_ED25519_SK="sk-ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAICtujwncNGgdNxWOCQedMCnrhRZT4B7eUyyFJNryvQj9 publickey"
  export SSH_KEY_RSA="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQDf8SFSuWqPtPYKjoXL8aowdKYfeKFKbE6w4CvqXPSRtgwKGWJva/UVF8Q/jGClwsVpTJfZnA76fnih76cE4ZiucPtDM2dyDILHNSZo/8rwUVkNB4P3aaCxV6lVMurmIgF4ibWQFBdyWKCJM7nQjO71TlMw/HfqpeYXXdjL1MBlMzqOZYLDrPoiJEiAfKheVeCONMlo8HMfEPxiu7bwfF7vQqYstcbZ55RN1t7RYaxlCTZaj0GOxIGKLmmHTDGzQQIaOGSr3+8Gk1I/MFle2/dYKbBEi97NrJowRO4a4pVbVso0YKyESL3U40uZly1bzoNx4DvMBbFwYSE1IJbs/AQIfB6KH4yLtQTmfb4qPRLCS1CBWBZKeKJ304p6rxKuv+CjagsFwdG5cS7cCosfdEU43QuWngnYQGUwMKskxX/7rPm+WZItN7XiNoMRmzaC+T0cIRXH7Cl7VFE3cbTzgmqJPVeUpccjTP/BdDahHKFqyVhAFvyI7JM4ct1/tU8o015TM1EXzMBeJOxalj6RsuDIFjjEaMN5pZmlHGBFBmcRgY7TqYAwr02maKb9BtcPOGIPgpI3AMzqNX+LjFssI0AuqBGTYN8v6OBr2NmTHfZlnClucjoAw71QPeQySABqrX0p9xieX15Ly1z9oMH9lapW6X9e0JnQBMnz1N2eaq1qAQ== publickey"
}

teardown() {
  # Clean up the environment after each test
  rm -rf /tmp/borgwarehouse
}

@test "Test createRepo.sh with missing arguments" {
  run bash /test/scripts/createRepo.sh
  [ "$status" -eq 1 ]
  [ "$output" == "This shell takes 3 arguments : SSH Public Key, Quota in Go [e.g. : 10], Append only mode [true|false]" ]
}

@test "Test createRepo.sh with missing Quota and append-only mode arguments" {
  run bash /test/scripts/createRepo.sh "$SSH_KEY_ED25519"
  [ "$status" -eq 1 ]
  [ "$output" == "This shell takes 3 arguments : SSH Public Key, Quota in Go [e.g. : 10], Append only mode [true|false]" ]
}

@test "Test createRepo.sh with missing Append-only mode argument" {
  run bash /test/scripts/createRepo.sh "$SSH_KEY_ED25519" 10
  echo $output
  cat ${home}/.ssh/authorized_keys
  [ "$status" -eq 1 ]
  [ "$output" == "This shell takes 3 arguments : SSH Public Key, Quota in Go [e.g. : 10], Append only mode [true|false]" ]
}

@test "Test createRepo.sh with invalid SSH key format" {
  run bash /test/scripts/createRepo.sh "invalid-key" 10 true
  [ "$status" -eq 2 ]
  [ "$output" == "Invalid public SSH KEY format. Provide a key in OpenSSH format (rsa, ed25519, ed25519-sk)" ]
}

@test "Test createRepo.sh with invalid Quota format" {
  run bash /test/scripts/createRepo.sh "$SSH_KEY_ED25519" "AA" true
  [ "$status" -eq 1 ]
  [ "$output" == "This shell takes 3 arguments : SSH Public Key, Quota in Go [e.g. : 10], Append only mode [true|false]" ]
}

@test "Test createRepo.sh with invalid Append-only mode format" {
  run bash /test/scripts/createRepo.sh "$SSH_KEY_ED25519" 10 blabla
  [ "$status" -eq 1 ]
  [ "$output" == "This shell takes 3 arguments : SSH Public Key, Quota in Go [e.g. : 10], Append only mode [true|false]" ]
}


@test "Test createRepo.sh if authorized_keys is missing" {
  rm /tmp/borgwarehouse/.ssh/authorized_keys
  run bash /test/scripts/createRepo.sh "$SSH_KEY_ED25519" 10 true
  [ "$status" -eq 5 ]
  [ "$output" == "${home}/.ssh/authorized_keys must be present" ]
}

@test "Test createRepo.sh if SSH key is already present in authorized_keys" {
  # Add a key
  echo "$SSH_KEY_ED25519" > /tmp/borgwarehouse/.ssh/authorized_keys
  # Try to re-add the same key
  run bash /test/scripts/createRepo.sh "$SSH_KEY_ED25519" 10 true
  [ "$status" -eq 3 ]
  [ "$output" == "SSH pub key already present in authorized_keys" ]
}

@test "Test createRepo.sh repository name generation" {
  run bash /test/scripts/createRepo.sh "$SSH_KEY_ED25519" 10 false
  [[ "$output" =~ ^[0-9a-f]{8}$ ]]  # Must return a 8 characters hexa string
}

@test "Test createRepo.sh key ED25519 insertion in authorized_keys" {
  run bash /test/scripts/createRepo.sh "$SSH_KEY_ED25519" 10 false
  expected_line="command=\"cd ${home}/repos;borg serve --restrict-to-path ${home}/repos/${output} --storage-quota 10G\",restrict $SSH_KEY_ED25519"
  grep -qF "$expected_line" /tmp/borgwarehouse/.ssh/authorized_keys
}

@test "Test createRepo.sh key ED25519-SK insertion in authorized_keys" {
  run bash /test/scripts/createRepo.sh "$SSH_KEY_ED25519_SK" 10 false
  expected_line="command=\"cd ${home}/repos;borg serve --restrict-to-path ${home}/repos/${output} --storage-quota 10G\",restrict $SSH_KEY_ED25519_SK"
  grep -qF "$expected_line" /tmp/borgwarehouse/.ssh/authorized_keys
}

@test "Test createRepo.sh key RSA insertion in authorized_keys" {
  run bash /test/scripts/createRepo.sh "$SSH_KEY_RSA" 10 false
  expected_line="command=\"cd ${home}/repos;borg serve --restrict-to-path ${home}/repos/${output} --storage-quota 10G\",restrict $SSH_KEY_RSA"
  grep -qF "$expected_line" /tmp/borgwarehouse/.ssh/authorized_keys
}

@test "Test createRepo.sh key ED25519 insertion in authorized_keys with append only mode" {
  run bash /test/scripts/createRepo.sh "$SSH_KEY_ED25519" 10 true
  expected_line="command=\"cd ${home}/repos;borg serve --append-only --restrict-to-path ${home}/repos/${output} --storage-quota 10G\",restrict $SSH_KEY_ED25519"
  grep -qF "$expected_line" /tmp/borgwarehouse/.ssh/authorized_keys
}
