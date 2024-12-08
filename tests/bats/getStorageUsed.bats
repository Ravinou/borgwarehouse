#!/usr/bin/env bats

setup() {
  export home="/tmp/borgwarehouse"
  mkdir -p "${home}/repos/repo1"
  mkdir -p "${home}/repos/repo2"
  mkdir -p "${home}/repos/repo3"

  # Create files with different sizes
  dd if=/dev/zero of="${home}/repos/repo1/file1" bs=1K count=32
  dd if=/dev/zero of="${home}/repos/repo2/file1" bs=1K count=1156
  dd if=/dev/zero of="${home}/repos/repo3/file1" bs=1K count=112

  echo "home=${home}" > "${home}/.env"
}

teardown() {
  rm -rf /tmp/borgwarehouse
}

@test "Test getStorageUsed.sh returns the size of all repositories in JSON format" {
  run bash /test/scripts/getStorageUsed.sh

  # Expected output in JSON format with my fake files
  expected_output='[
    {
      "size": 36,
      "name": "repo1"
    },
    {
      "size": 1160,
      "name": "repo2"
    },
    {
      "size": 116, 
      "name": "repo3"
    }
  ]'

  normalized_output=$(echo "$output" | jq .)
  normalized_expected_output=$(echo "$expected_output" | jq .)

  [ "$status" -eq 0 ]
  [ "$normalized_output" == "$normalized_expected_output" ]
}


@test "Test getStorageUsed.sh when no repositories exist" {
  # Delete all repositories
  rm -rf "${home}/repos"
  mkdir -p "${home}/repos"

  run bash /test/scripts/getStorageUsed.sh

  normalized_expected_output='[]'
  normalized_output=$(echo "$output" | jq .)

  [ "$status" -eq 0 ]
  [ "$normalized_output" == "$normalized_expected_output" ]
}

@test "Test getStorageUsed.sh with only one repository" {
  # Keep only one repository
  rm -rf "${home}/repos/repo2" "${home}/repos/repo3"

  run bash /test/scripts/getStorageUsed.sh

  expected_output='[{"size": 36, "name": "repo1"}]'

  normalized_output=$(echo "$output" | jq .)
  normalized_expected_output=$(echo "$expected_output" | jq .)

  echo "$normalized_output"
  echo "$normalized_expected_output"

  [ "$status" -eq 0 ]
  [ "$normalized_output" == "$normalized_expected_output" ]
}

@test "Test getStorageUsed.sh ignores lost+found directory" {
  mkdir -p "${home}/repos/lost+found"
  dd if=/dev/zero of="${home}/repos/lost+found/file1" bs=1K count=500
  
  run bash /test/scripts/getStorageUsed.sh

  # Expected output should NOT include lost+found
  expected_output='[
    {
      "size": 36,
      "name": "repo1"
    },
    {
      "size": 1160,
      "name": "repo2"
    },
    {
      "size": 116, 
      "name": "repo3"
    }
  ]'

  normalized_output=$(echo "$output" | jq .)
  normalized_expected_output=$(echo "$expected_output" | jq .)

  [ "$status" -eq 0 ]
  [ "$normalized_output" == "$normalized_expected_output" ]
}