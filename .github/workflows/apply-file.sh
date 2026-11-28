#!/usr/bin/env bash
# create: empty file, never writes the body.
# write: replace or rename an existing file, never creates a missing one.
set -euo pipefail

path="${FILE_PATH:-}"
conflict="${CONFLICT:-rename}"
mode="${MODE:-}"
body="${FILE_BODY:-}"

if [[ "$mode" != "create" && "$mode" != "write" ]]; then
  echo "mode must be create or write" >&2
  exit 1
fi
if [[ "$conflict" != "rename" && "$conflict" != "overwrite" ]]; then
  echo "conflict must be rename or overwrite" >&2
  exit 1
fi
if [[ -z "$path" || ${#path} -gt 80 || "$path" == /* || "$path" == *..* || "$path" == *\\* || "$path" == */ ]]; then
  echo "invalid path" >&2
  exit 1
fi
if [[ ! "$path" =~ ^[A-Za-z0-9._/-]+$ ]]; then
  echo "invalid path" >&2
  exit 1
fi

fresh_name() {
  local p="$1" dir="" file base ext root n next
  file="$p"
  if [[ "$p" == */* ]]; then
    dir="${p%/*}/"
    file="${p##*/}"
  fi
  ext=""
  base="$file"
  if [[ "$file" == *.* && "$file" != .* ]]; then
    ext=".${file##*.}"
    base="${file%.*}"
  fi
  root="$base"
  if [[ "$base" =~ ^(.+)-[0-9]+$ ]]; then
    root="${BASH_REMATCH[1]}"
  fi
  n=2
  while true; do
    next="${dir}${root}-${n}${ext}"
    if [[ ! -e "$next" ]]; then
      printf '%s' "$next"
      return
    fi
    n=$((n + 1))
  done
}

actual="$path"
if [[ "$mode" == "create" ]]; then
  if [[ -e "$path" && "$conflict" == "rename" ]]; then
    actual="$(fresh_name "$path")"
  fi
  if [[ -L "$actual" ]]; then
    echo "refusing to follow a symlink" >&2
    exit 1
  fi
  mkdir -p -- "$(dirname -- "$actual")"
  : > "$actual"
else
  if [[ ! -e "$path" || -L "$path" ]]; then
    echo "write does not create a missing file" >&2
    exit 1
  fi
  if [[ "$conflict" == "rename" ]]; then
    actual="$(fresh_name "$path")"
  fi
  if [[ -L "$actual" ]]; then
    echo "refusing to follow a symlink" >&2
    exit 1
  fi
  mkdir -p -- "$(dirname -- "$actual")"
  printf '%s' "$body" > "$actual"
fi

if [[ "${GITHUB_ACTIONS:-}" != "true" ]]; then
  echo "wrote $actual"
  exit 0
fi

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add -- "$actual"
if git diff --cached --quiet; then
  echo "no file change for $actual"
  exit 0
fi
git commit -m "workflow ${mode}: ${actual}"
git push
