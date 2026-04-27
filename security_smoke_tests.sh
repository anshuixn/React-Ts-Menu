#!/usr/bin/env bash
# ============================================================
# AuraSpice Security Smoke Tests
# Run these manually to verify each hardening phase.
# Usage: bash security_smoke_tests.sh
# ============================================================

BASE_URL="${1:-http://localhost:3000}"
echo "=== AuraSpice Security Smoke Tests ==="
echo "Target: $BASE_URL"
echo ""

PASS=0; FAIL=0

check() {
  local desc="$1" expected="$2" actual="$3"
  if [[ "$actual" == *"$expected"* ]]; then
    echo "  PASS: $desc"
    ((PASS++))
  else
    echo "  FAIL: $desc"
    echo "        expected to contain: '$expected'"
    echo "        got: '$actual'"
    ((FAIL++))
  fi
}

# ──────────────────────────────────────────────
# PHASE 2 — XSS: inject a script tag in order
# ──────────────────────────────────────────────
echo "--- Phase 2: XSS / Input Sanitization ---"

XSS_RESP=$(curl -s -X POST "$BASE_URL/api/orders" \
  -H "Content-Type: application/json" \
  -d '{"table":"99","items":[{"id":"x","name":"<script>alert(1)</script>","qty":1,"price":100}],"total":100}')

check "XSS in item name is stripped or rejected" \
  "" "$(echo "$XSS_RESP" | grep -o '<script>')"  # expect NO <script> in response

OVERSIZED_RESP=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/orders" \
  -H "Content-Type: application/json" \
  -d "{\"table\":\"1\",\"items\":[$(printf '{"id":"x","name":"a","qty":1,"price":1},' $(seq 1 100))],\"total\":100}")
check "Oversized items array rejected" "400" "$OVERSIZED_RESP"

INVALID_TABLE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/orders" \
  -H "Content-Type: application/json" \
  -d '{"table":"DROP TABLE orders","items":[{"id":"x","name":"y","qty":1,"price":10}],"total":10}')
check "SQL-injection-like table value rejected" "400" "$INVALID_TABLE"

echo ""

# ──────────────────────────────────────────────
# PHASE 3 — Unauthenticated order read blocked
# ──────────────────────────────────────────────
echo "--- Phase 3: Unauthorized Access ---"

UNAUTH_ORDERS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/orders")
check "GET /api/orders without token → 401" "401" "$UNAUTH_ORDERS"

UNAUTH_KEY=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/key")
check "GET /api/key without token → 401" "401" "$UNAUTH_KEY"

UNAUTH_STAFF=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/staff")
check "GET /api/staff without token → 401" "401" "$UNAUTH_STAFF"

UNAUTH_DELETE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/api/orders")
check "DELETE /api/orders without token → 401" "401" "$UNAUTH_DELETE"

echo ""

# ──────────────────────────────────────────────
# PHASE 4 — Rate limiting on auth endpoint
# ──────────────────────────────────────────────
echo "--- Phase 4: Auth Rate Limiting ---"

echo "  Sending 6 rapid login attempts (5 allowed, 6th should be 429)..."
STATUS_6TH=""
for i in $(seq 1 6); do
  STATUS_6TH=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/staff/login" \
    -H "Content-Type: application/json" \
    -d "{\"id\":\"brute$i\",\"password\":\"wrong$i\"}")
done
check "6th rapid login attempt → 429 rate limit" "429" "$STATUS_6TH"

echo ""

# ──────────────────────────────────────────────
# PHASE 5 — Login + authenticated access
# ──────────────────────────────────────────────
echo "--- Phase 5: Auth Token Flow ---"

# NOTE: Adjust credentials to match your STAFF001_PASS env var
LOGIN_RESP=$(curl -s -X POST "$BASE_URL/api/staff/login" \
  -H "Content-Type: application/json" \
  -d '{"id":"STAFF001","password":"aura2024"}')

TOKEN=$(echo "$LOGIN_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
check "Login returns a token" "token" "$LOGIN_RESP"

if [[ -n "$TOKEN" ]]; then
  AUTH_ORDERS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/orders" \
    -H "X-Staff-Token: $TOKEN")
  check "Authenticated GET /api/orders → 200" "200" "$AUTH_ORDERS"

  # Non-admin should NOT access /api/key
  KEY_AS_STAFF=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/key" \
    -H "X-Staff-Token: $TOKEN")
  check "Non-admin GET /api/key → 403 Forbidden" "403" "$KEY_AS_STAFF"
fi

echo ""

# ──────────────────────────────────────────────
# PHASE 6 — Security headers
# ──────────────────────────────────────────────
echo "--- Phase 6: Security Headers ---"

HEADERS=$(curl -s -I "$BASE_URL/api/health")
check "X-Content-Type-Options: nosniff present" "nosniff" "$HEADERS"
check "X-Frame-Options: SAMEORIGIN present"     "SAMEORIGIN" "$HEADERS"
check "X-DNS-Prefetch-Control present"          "x-dns-prefetch-control" "$HEADERS"

echo ""
echo "=== Results: $PASS passed, $FAIL failed ==="
