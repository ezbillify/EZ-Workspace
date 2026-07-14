if [ "$GIT_AUTHOR_NAME" = "SwasthyaSync" ] || [ "$GIT_AUTHOR_EMAIL" = "swasthyasync@gmail.com" ]; then
  GIT_AUTHOR_NAME="ezbillify"
  GIT_AUTHOR_EMAIL="ezbillify@gmail.com"
  export GIT_AUTHOR_NAME GIT_AUTHOR_EMAIL
fi
if [ "$GIT_COMMITTER_NAME" = "SwasthyaSync" ] || [ "$GIT_COMMITTER_EMAIL" = "swasthyasync@gmail.com" ]; then
  GIT_COMMITTER_NAME="ezbillify"
  GIT_COMMITTER_EMAIL="ezbillify@gmail.com"
  export GIT_COMMITTER_NAME GIT_COMMITTER_EMAIL
fi
