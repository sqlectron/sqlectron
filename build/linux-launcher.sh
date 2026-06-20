#!/usr/bin/env bash

# Adapted from https://github.com/beekeeper-studio/beekeeper-studio/blob/077ff9059eda1f4d44c5f6771a53519010fa47f3/apps/studio/build/launcher-script.sh
# This script is used to launch the application on Linux, where on many distros, the application
# will crash if not launched with `--no-sandbox` flag. While we would ideally not apply this to
# all users/distros, there's enough issues that it's not worth the hassle of trying to detect
# when to apply it.

SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do
  SCRIPT_DIR="$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$SCRIPT_DIR/$SOURCE"
done
SCRIPT_DIR="$( cd -P "$( dirname "$SOURCE" )" >/dev/null 2>&1 && pwd )"

XDG_CONFIG_HOME=${XDG_CONFIG_HOME:-~/.config}

if [[ -f $XDG_CONFIG_HOME/sqlectron-flags.conf ]]; then
  USER_FLAGS=$(cat "$XDG_CONFIG_HOME"/sqlectron-flags.conf)
fi

# shellcheck disable=SC2086
exec "$SCRIPT_DIR/sqlectron-bin" "--no-sandbox" $USER_FLAGS "$@"
