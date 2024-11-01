#!/usr/bin/env bats

setup() {
  export home="/tmp/borgwarehouse"
  mkdir -p "${home}/repos/repo1"
  mkdir -p "${home}/repos/repo2"
  
  # Create integrity files
  touch "${home}/repos/repo1/integrity_file_1"
  touch "${home}/repos/repo2/integrity_file_2"
  
  # Set the last modified time of the integrity files
  touch -d '2024-09-04 12:00:00' "${home}/repos/repo1/integrity_file_1"
  touch -d '2024-10-04 13:00:00' "${home}/repos/repo2/integrity_file_2"

  echo "home=${home}" > "${home}/.env"
}

teardown() {
  rm -rf /tmp/borgwarehouse
}

@test "Test getLastSave.sh - Get last save timestamps for existing repositories" {
  run bash /test/scripts/getLastSave.sh

  # expected output in JSON format
  expected_output='[
    {
      "repositoryName": "repo1",
      "lastSave": 1725451200
    },
    {
      "repositoryName": "repo2",
      "lastSave": 1728046800
    }
  ]'

  # Normalize the JSON output for comparison
  run_output=$(echo "$output" | jq .)
  normalized_expected_output=$(echo "$expected_output" | jq .)

  [ "$run_output" = "$normalized_expected_output" ]
}

@test "Test getLastSave.sh - Get last save timestamps when no repositories exist" {
  # Delete all repositories
  rm -rf "${home}/repos"
  mkdir -p "${home}/repos"
  
  run bash /test/scripts/getLastSave.sh

  expected_output='[]'

  run_output=$(echo "$output" | jq .)
  normalized_expected_output=$(echo "$expected_output" | jq .)

  [ "$status" -eq 0 ]
  [ "$run_output" = "$normalized_expected_output" ]
}

@test "Test getLastSave.sh - Get last save timestamps with missing integrity file" {
  rm "${home}/repos/repo1/integrity_file_1"

  run bash /test/scripts/getLastSave.sh

  expected_output='[
    {
      "repositoryName": "repo2",
      "lastSave": 1728046800
    }
  ]'

  run_output=$(echo "$output" | jq .)
  normalized_expected_output=$(echo "$expected_output" | jq .)

  [ "$status" -eq 0 ]
  [ "$run_output" = "$normalized_expected_output" ]
}

@test "Test getLastSave.sh - Check .env loading" {
  rm "${home}/.env"  # Remove .env to check default behavior
  
  run bash /test/scripts/getLastSave.sh
  [ "$status" -eq 0 ]
}
