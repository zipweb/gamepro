#!/usr/bin/env bash
set -euo pipefail

npm install
cp -n .env.example .env || true
cp -n apps/frontend/.env.example apps/frontend/.env || true
cp -n apps/backend/.env.example apps/backend/.env || true
cp -n database/.env.example database/.env || true

echo "Bootstrap complete."
