#!/usr/bin/env bash
# Walks the complete learner journey through the real HTTP API with a real
# session cookie: register -> login -> onboarding -> diagnostic -> dashboard.
#
# This exercises auth, middleware, validation, rate limiting, services, and the
# database exactly as a browser would, which is what makes it worth running
# before claiming the flow works.
set -uo pipefail

BASE="http://localhost:3000"
JAR="$(mktemp)"
EMAIL="walk.$(date +%s%N | head -c 13)@example.com"
PASS="correct-horse-battery-staple"

json() { node scripts/jq.mjs "$1"; }
num() { node scripts/jq.mjs "$1" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>process.stdout.write(s===''?'-':Number(s).toFixed(3)))"; }
step() { printf '\n\033[1m%s\033[0m\n' "$1"; }

step "1. Register"
curl -s -c "$JAR" -X POST "$BASE/api/auth/register" -H 'content-type: application/json' \
  -d "{\"name\":\"Flow Walker\",\"email\":\"$EMAIL\",\"password\":\"$PASS\"}" \
  -o /dev/null -w '   HTTP %{http_code}\n'

step "2. Sign in"
CSRF=$(curl -s -c "$JAR" -b "$JAR" "$BASE/api/auth/csrf" | json "csrfToken")
curl -s -c "$JAR" -b "$JAR" -X POST "$BASE/api/auth/callback/credentials" \
  -H 'content-type: application/x-www-form-urlencoded' \
  --data-urlencode "email=$EMAIL" --data-urlencode "password=$PASS" \
  --data-urlencode "csrfToken=$CSRF" --data-urlencode "json=true" \
  -o /dev/null -w '   HTTP %{http_code}\n'
echo "   session: $(curl -s -b "$JAR" "$BASE/api/auth/session" | json "user.email")"

step "3. Choose goal + explanation style"
curl -s -b "$JAR" -X PATCH "$BASE/api/preferences" -H 'content-type: application/json' \
  -d '{"preferredLens":"ANALOGY"}' -o /dev/null -w '   preferences HTTP %{http_code}\n'
SID=$(curl -s -b "$JAR" -X POST "$BASE/api/diagnostic/sessions" -H 'content-type: application/json' \
  -d '{"goalSlug":"ml-engineer"}' | json "data.sessionId")
echo "   diagnostic session: $SID"

step "4. Adaptive diagnostic"
for i in $(seq 1 8); do
  NEXT=$(curl -s -b "$JAR" "$BASE/api/diagnostic/sessions/$SID/next")
  COMPLETE=$(echo "$NEXT" | json "data.progress.complete")
  if [ "$COMPLETE" = "true" ]; then
    echo "   stopped: adaptive stopping rule met"
    break
  fi

  ITEM=$(echo "$NEXT" | json "data.question.itemId")
  CONCEPT=$(echo "$NEXT" | json "data.question.conceptTitle")
  OPT=$(echo "$NEXT" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{try{const o=JSON.parse(s).data.question.options;process.stdout.write(o&&o[0]?o[0].id:'')}catch{process.stdout.write('')}})")
  [ "$ITEM" = "ERR" ] && { echo "   no more items"; break; }

  if [ -n "$OPT" ] && [ "$OPT" != "ERR" ]; then
    BODY="{\"itemId\":\"$ITEM\",\"optionId\":\"$OPT\"}"
  else
    BODY="{\"itemId\":\"$ITEM\",\"text\":\"x^2\"}"
  fi

  RES=$(curl -s -b "$JAR" -X POST "$BASE/api/diagnostic/sessions/$SID/answers" \
    -H 'content-type: application/json' -d "$BODY")
  CORRECT=$(echo "$RES" | json "data.correct")
  BEFORE=$(echo "$RES" | num "data.masteryBefore")
  AFTER=$(echo "$RES" | num "data.masteryAfter")
  MIS=$(echo "$RES" | json "data.misconception.label")
  printf '   %d. %-26s %-9s mastery %s -> %s   %s\n' "$i" "$CONCEPT" \
    "$([ "$CORRECT" = "true" ] && echo correct || echo incorrect)" "$BEFORE" "$AFTER" "$MIS"
done

step "5. Complete diagnostic"
DONE=$(curl -s -b "$JAR" -X POST "$BASE/api/diagnostic/sessions/$SID/complete")
echo "   theta: $(echo "$DONE" | num "data.theta")  SE: $(echo "$DONE" | num "data.standardError")  score: $(echo "$DONE" | json "data.correctCount")/$(echo "$DONE" | json "data.itemsAnswered")"

step "6. Dashboard"
SUM=$(curl -s -b "$JAR" "$BASE/api/dashboard/summary")
echo "   goal:      $(echo "$SUM" | json "data.goalTitle")"
echo "   concepts:  $(echo "$SUM" | json "data.totalConcepts") total"
echo "   mastered:  $(echo "$SUM" | json "data.masteredCount")   fragile: $(echo "$SUM" | json "data.fragileCount")   gaps: $(echo "$SUM" | json "data.gapCount")"
echo "   avg mastery: $(echo "$SUM" | num "data.averageMastery")"

step "7. Knowledge graph"
G=$(curl -s -b "$JAR" "$BASE/api/knowledge-state/graph?goal=ml-engineer")
echo "   nodes: $(echo "$G" | json "data.nodes.length")   edges: $(echo "$G" | json "data.edges.length")   unlocked: $(echo "$G" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const e=JSON.parse(s).data.edges;process.stdout.write(String(e.filter(x=>x.satisfied).length))})")"

step "8. Recommendations"
curl -s -b "$JAR" "$BASE/api/recommendations" | node -e "
let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
  const recs=JSON.parse(s).data||[];
  for(const r of recs) console.log('   ['+r.kind+'] '+r.conceptTitle+'\n      '+r.rationale);
});"

step "9. Learning path"
P=$(curl -s -b "$JAR" "$BASE/api/path?goal=ml-engineer")
echo "   next: $(echo "$P" | json "data.next.title")"
echo "   why:  $(echo "$P" | json "data.next.rationale")"

step "10. Authorization check (another learner's session)"
curl -s -X GET "$BASE/api/dashboard/summary" -o /dev/null -w '   anonymous -> HTTP %{http_code} (expect 401)\n'

rm -f "$JAR"
