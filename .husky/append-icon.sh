#!/bin/bash

# define log prefix
prefix="pre-commit:"

# store message file, first and only param of hook
commitMessageFile="$1"

# breaking change icon !
boomIcon=':boom:'

# check for breaking change in file content
# find any line starting with 'BREAKING CHANGE'
function checkBreakingChangeInBody() {
  breakingChange='BREAKING CHANGE'
  while read -r line; do
    if [[ "$line" == "$breakingChange"* ]]; then
      echo "$prefix found $breakingChange in message body"
      return 0
    fi
  done < "$1"
  return 1
}

function findTypeIcon() {
  message="$1"

  if [[ "$message" =~ ^.*!:\ .* ]]; then
    echo "$boomIcon"
    return 0
  fi

  declare -A icons=(
    [build]='🤖'
    [chore]='🧹'
    ["chore(deps)"]='🧹'
    [config]='🔧'
    [deploy]='🚀'
    [doc]='📚'
    [feat]='✨'
    [fix]='🐛'
    [hotfix]='🚑'
    [i18n]='💬'
    [publish]='📦'
    [refactor]='⚡'
    [revert]='⏪'
    [test]='✅'
    [ui]='🎨'
    [wip]='🚧'
    [WIP]='🚧'
    [docker]='🐳'
  )

  commit_type="${message%%:*}"

  icon="${icons[$commit_type]}"
  if [[ -n "$icon" ]]; then
    echo "$icon"
    return 0
  else
    return 1
  fi
}

# extract original message from the first line of file
message=$(head -n 1 <"$commitMessageFile")
echo "$prefix commit subject: '$message'"

if checkBreakingChangeInBody "$commitMessageFile"; then
  echo 'setting breaking change icon'
  icon=$boomIcon
else
  icon=$(findTypeIcon "$message")
  if [ $? -eq 1 ]; then
    echo "$prefix ❌ unable to find icon corresponding to commit type. Make sure your commit-lint config (.commitlintrc.js) and append-msg script (append-msg.sh) types match"
    exit 1
  fi
fi

# check if icon has been appended before
if [[ "$message" == *"$icon"* ]]; then
  echo "⏭️ skipping icon append as it's been added before"
  exit 0
fi

# otherwise append icon
updatedMessage="${message/:/: $icon}"

# replace first line of file with updated message
sed -i "1s/.*/$updatedMessage/" "$commitMessageFile"

echo "$prefix ✅ appended icon $icon to commit message subject"
