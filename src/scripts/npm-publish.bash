# write message to standard out (stdout)
# usage: msg MESSAGE
function msg() {
    echo "$Pkg: $*"
}

# write message to standard error (stderr)
# usage: err MESSAGE
function err() {
    msg "$*" 1>&2
}

# npm publish
# usage: npm-publish [NPM_PUBLISH_ARGS]...
function npm-publish () {

    if [ -d "build/src" ]; then
      if ! cp -r build/src/* .; then
          err "packaging module failed"
          return 1
      fi
    fi

    # npm honors this
    rm -f .gitignore

    if ! npm publish "$@"; then
        err "failed to publish node package"
        cat "$(ls -t "$HOME"/.npm/_logs/*-debug.log | head -n 1)"
        return 1
    fi

    if ! git checkout -- .gitignore; then
        err "removed .gitignore and was unable to check out original"
        return 1
    fi

    if [ -d "build/src" ]; then
        local pub_file pub_base
        for pub_file in build/src/*; do
            pub_base=${pub_file#build/src/}
            rm -rf "$pub_base"
        done
    fi
}

npm-publish "$@"