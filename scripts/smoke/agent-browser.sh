#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5173/}"
TMP_DIR="${TMP_DIR:-./tmp/smoke}"
mkdir -p "$TMP_DIR"

if [[ -f .dev.vars ]]; then
  OPENAI_KEY=$(grep -E '^OPENAI_API_KEY=' .dev.vars | tail -n1 | cut -d'=' -f2-)
elif [[ -f .env ]]; then
  OPENAI_KEY=$(grep -E '^OPENAI_API_KEY=' .env | tail -n1 | cut -d'=' -f2-)
else
  OPENAI_KEY=""
fi

if [[ -z "$OPENAI_KEY" ]]; then
  echo "OPENAI_API_KEY is missing in .dev.vars or .env"
  exit 1
fi

agent-browser open "$BASE_URL"
agent-browser snapshot --json > "$TMP_DIR/step1.json"

TITLE_REF=$(python3 scripts/smoke/ab_ref.py "$TMP_DIR/step1.json" "Onboarding Experience" "textbox" || true)
GOAL_REF=$(python3 scripts/smoke/ab_ref.py "$TMP_DIR/step1.json" "Understand why users drop during onboarding." "textbox" || true)
GENERATE_REF=$(python3 scripts/smoke/ab_ref.py "$TMP_DIR/step1.json" "Generate narrative script" "button" || true)

if [[ -z "$TITLE_REF" || -z "$GOAL_REF" || -z "$GENERATE_REF" ]]; then
  echo "Failed to locate required refs in step1 snapshot."
  exit 1
fi

agent-browser fill "@${TITLE_REF}" "Onboarding Friction Survey"
agent-browser click "@${GOAL_REF}"
agent-browser press "Control+a"
agent-browser type "@${GOAL_REF}" "Understand why users drop during onboarding."

agent-browser snapshot --json > "$TMP_DIR/step1_filled.json"
if grep -q "Generate narrative script\" .*\\[disabled\\]" "$TMP_DIR/step1_filled.json"; then
  echo "Generate button still disabled after filling required fields."
  agent-browser screenshot "$TMP_DIR/step1_disabled.png"
  exit 1
fi
agent-browser click "@${GENERATE_REF}"

agent-browser wait 2000
agent-browser snapshot --json > "$TMP_DIR/step2.json"

if ! grep -q "Script JSON" "$TMP_DIR/step2.json"; then
  echo "Did not reach script review step. Check tmp/step2.json for errors."
  agent-browser screenshot "$TMP_DIR/step2.png"
  exit 1
fi

SAVE_REF=$(python3 scripts/smoke/ab_ref.py "$TMP_DIR/step2.json" "Save script" "button" || true)
if [[ -z "$SAVE_REF" ]]; then
  echo "Save script button not found."
  exit 1
fi

agent-browser click "@${SAVE_REF}"
agent-browser wait 1500
agent-browser snapshot --json > "$TMP_DIR/step3.json"

if ! grep -q "Session title" "$TMP_DIR/step3.json"; then
  echo "Did not reach publish step."
  agent-browser screenshot "$TMP_DIR/step3.png"
  exit 1
fi

SESSION_REF=$(python3 scripts/smoke/ab_ref.py "$TMP_DIR/step3.json" "Session title" "textbox" || true)
PUBLISH_REF=$(python3 scripts/smoke/ab_ref.py "$TMP_DIR/step3.json" "Publish" "button" || true)

agent-browser fill "@${SESSION_REF}" "Onboarding Round 1"
agent-browser click "@${PUBLISH_REF}"

agent-browser wait 2000
agent-browser snapshot --json > "$TMP_DIR/step4.json"

if ! grep -q "Survey is live" "$TMP_DIR/step4.json"; then
  echo "Publish step did not complete."
  agent-browser screenshot "$TMP_DIR/step4.png"
  exit 1
fi

agent-browser screenshot "$TMP_DIR/smoke.png"
echo "Smoke test passed. Screenshot: $TMP_DIR/smoke.png"
