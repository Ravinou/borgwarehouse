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
  # get message from 1st param
  message="$1"

  # declare an icons for each authorized enum-type from `.commitlintrc.js`
  declare -A icons
  icons[build]='🤖'
  icons[chore]='🧹'
  icons["chore(deps)"]='🧹'
  icons[config]='🔧'
  icons[deploy]='🚀'
  icons[doc]='📚'
  icons[feat]='✨'
  icons[fix]='🐛'
  icons[hotfix]='🚑'
  icons[i18n]='💬'
  icons[publish]='📦'
  icons[refactor]='⚡'
  icons[revert]='⏪'
  icons[test]='✅'
  icons[ui]='🎨'
  icons[wip]='🚧'
  icons[WIP]='🚧'

  for type in "${!icons[@]}"; do
    # check if message subject contains breaking change pattern
    if [[ "$message" =~ ^(.*)(!:){1}(.*)$ ]]; then
      echo "$boomIcon"
      return 0
    # else find corresponding type icon
    elif [[ "$message" == "$type"* ]]; then
      echo "${icons[$type]}"
      return 0
    fi
  done
  return 1
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
