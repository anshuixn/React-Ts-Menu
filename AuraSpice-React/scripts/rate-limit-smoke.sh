#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5174}"
LOGIN_ID="${LOGIN_ID:-demo_staff}"
LOGIN_PASSWORD="${LOGIN_PASSWORD:-incorrect-password}"
REGISTER_ID="${REGISTER_ID:-smoke_staff}"
REGISTER_NAME="${REGISTER_NAME:-Smoke Test}"
REGISTER_PASSWORD="${REGISTER_PASSWORD:-incorrect-password}"
ESTABLISHMENT_KEY="${ESTABLISHMENT_KEY:-invalid-establishment-key}"

echo "Testing login rate limit on ${BASE_URL}/api/staff/login"
for attempt in $(seq 1 6); do
  status_code="$(
    curl -s -o /tmp/auraspice-login-rate-limit.out -w '%{http_code}' \
      -X POST "${BASE_URL}/api/staff/login" \
      -H 'Content-Type: application/json' \
      --data "{\"id\":\"${LOGIN_ID}\",\"password\":\"${LOGIN_PASSWORD}\"}"
  )"
  echo "  login attempt ${attempt}: HTTP ${status_code}"
done

echo
echo "Testing register rate limit on ${BASE_URL}/api/staff/register"
for attempt in $(seq 1 4); do
  status_code="$(
    curl -s -o /tmp/auraspice-register-rate-limit.out -w '%{http_code}' \
      -X POST "${BASE_URL}/api/staff/register" \
      -H 'Content-Type: application/json' \
      --data "{\"account\":{\"id\":\"${REGISTER_ID}${attempt}\",\"name\":\"${REGISTER_NAME}\",\"password\":\"${REGISTER_PASSWORD}\"},\"key\":\"${ESTABLISHMENT_KEY}\"}"
  )"
  echo "  register attempt ${attempt}: HTTP ${status_code}"
done

echo
echo "Expected result:"
echo "  login attempt 6 should return HTTP 429"
echo "  register attempt 4 should return HTTP 429"
