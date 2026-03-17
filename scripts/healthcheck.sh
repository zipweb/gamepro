#!/usr/bin/env bash
set -euo pipefail

curl -fsS http://localhost:4000/health >/dev/null
curl -fsS http://localhost:3000 >/dev/null

echo "Frontend and backend healthchecks passed."
