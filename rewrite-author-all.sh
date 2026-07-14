#!/usr/bin/env sh
cd /c/Users/devu1/Downloads/EZ-WORKSPACE || exit 1
git filter-branch --force --env-filter '
if [ "$GIT_AUTHOR_EMAIL" = "swasthyasync@gmail.com" ]; then
  export GIT_AUTHOR_NAME="ezbillify"
  export GIT_AUTHOR_EMAIL="ezbillify@gmail.com"
fi
if [ "$GIT_COMMITTER_EMAIL" = "swasthyasync@gmail.com" ]; then
  export GIT_COMMITTER_NAME="ezbillify"
  export GIT_COMMITTER_EMAIL="ezbillify@gmail.com"
fi
' --tag-name-filter cat -- --all
