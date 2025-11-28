#!/bin/bash
set -e

cd ..

if [ ! -d "sqlectron-db-core" ]; then
  # Only clone flat in the CI. In development the developer probably wants to
  # use the sqlectron-db-core for other changes as well and may need the full history.
  if [ "$CI" == "true" ]; then
    git clone --depth 1 https://github.com/sqlectron/sqlectron-db-core.git
  else
    git clone https://github.com/sqlectron/sqlectron-db-core.git
  fi
fi

cd sqlectron-db-core
docker compose up -d openssh-server mysql

# Given a few seconds for the all deps be ready
sleep 10
