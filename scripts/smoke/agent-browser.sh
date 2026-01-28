#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:5173/}"
TMP_DIR="${TMP_DIR:-./tmp/smoke}"
mkdir -p "$TMP_DIR"

MOCK_AI="${MOCK_AI:-}"
if [[ "$MOCK_AI" == "1" || "$MOCK_AI" == "true" ]]; then
  echo "MOCK_AI enabled; skipping API key check."
else
  if [[ -f .dev.vars ]]; then
    OPENAI_KEY=$(grep -E '^OPENAI_API_KEY=' .dev.vars | tail -n1 | cut -d'=' -f2-)
  elif [[ -f .env ]]; then
    OPENAI_KEY=$(grep -E '^OPENAI_API_KEY=' .env | tail -n1 | cut -d'=' -f2-)
  else
    OPENAI_KEY=""
  fi

  if [[ -z "$OPENAI_KEY" ]]; then
    echo "OPENAI_API_KEY is missing in .dev.vars or .env (or set MOCK_AI=1)."
    exit 1
  fi
fi

agent-browser open "${BASE_URL}surveys"
agent-browser snapshot --json > "$TMP_DIR/step1.json"

CREATE_REF=$(python3 scripts/smoke/ab_ref.py "$TMP_DIR/step1.json" "Create survey" "button" || true)
if [[ -z "$CREATE_REF" ]]; then
  echo "Create survey button not found."
  exit 1
fi
agent-browser click "@${CREATE_REF}"

agent-browser wait 1000
agent-browser snapshot --json > "$TMP_DIR/step2.json"

TITLE_REF=$(python3 scripts/smoke/ab_ref.py "$TMP_DIR/step2.json" "Survey title" "textbox" || true)
GOAL_REF=$(python3 scripts/smoke/ab_ref.py "$TMP_DIR/step2.json" "Goal" "textbox" || true)
GENERATE_REF=$(python3 scripts/smoke/ab_ref.py "$TMP_DIR/step2.json" "Generate script" "button" || true)

if [[ -z "$TITLE_REF" || -z "$GOAL_REF" || -z "$GENERATE_REF" ]]; then
  echo "Failed to locate brief inputs."
  exit 1
fi

agent-browser fill "@${TITLE_REF}" "Onboarding Friction Survey"
agent-browser fill "@${GOAL_REF}" "Understand why users drop during onboarding."

agent-browser click "@${GENERATE_REF}"

agent-browser wait 1500
agent-browser snapshot --json > "$TMP_DIR/step3.json"

if ! grep -q "Script editor" "$TMP_DIR/step3.json"; then
  echo "Did not reach script editor."
  agent-browser screenshot "$TMP_DIR/step3.png"
  exit 1
fi

SAVE_REF=$(python3 scripts/smoke/ab_ref.py "$TMP_DIR/step3.json" "Save changes" "button" || true)
if [[ -z "$SAVE_REF" ]]; then
  echo "Save changes button not found."
  exit 1
fi

agent-browser click "@${SAVE_REF}"
agent-browser wait 1500
agent-browser snapshot --json > "$TMP_DIR/step4.json"

TEST_REF=$(python3 scripts/smoke/ab_ref.py "$TMP_DIR/step4.json" "Test chat" "button" || true)
if [[ -n "$TEST_REF" ]]; then
  agent-browser click "@${TEST_REF}"
  agent-browser wait 1200
  agent-browser snapshot --json > "$TMP_DIR/step5.json"
  BEGIN_REF=$(python3 scripts/smoke/ab_ref.py "$TMP_DIR/step5.json" "Begin interview" "button" || true)
  if [[ -n "$BEGIN_REF" ]]; then
    agent-browser click "@${BEGIN_REF}"
  fi
fi

agent-browser snapshot --json > "$TMP_DIR/step6.json"
PUBLISH_REF=$(python3 scripts/smoke/ab_ref.py "$TMP_DIR/step6.json" "Publish & invite" "button" || true)
if [[ -z "$PUBLISH_REF" ]]; then
  echo "Publish & invite step not found."
  exit 1
fi
agent-browser click "@${PUBLISH_REF}"

agent-browser wait 1200
agent-browser snapshot --json > "$TMP_DIR/step7.json"

PUBLISH_RUN_REF=$(python3 scripts/smoke/ab_ref.py "$TMP_DIR/step7.json" "Publish run" "button" || true)
if [[ -z "$PUBLISH_RUN_REF" ]]; then
  echo "Publish run button not found."
  exit 1
fi
agent-browser click "@${PUBLISH_RUN_REF}"
agent-browser wait 1500
agent-browser snapshot --json > "$TMP_DIR/step8.json"

if ! grep -q "Invite participants" "$TMP_DIR/step8.json"; then
  echo "Invite section not found after publish."
  agent-browser screenshot "$TMP_DIR/step8.png"
  exit 1
fi

ANON_REF=$(python3 scripts/smoke/ab_ref.py "$TMP_DIR/step8.json" "Anonymous links" "textbox" || true)
INVITE_REF=$(python3 scripts/smoke/ab_ref.py "$TMP_DIR/step8.json" "Generate invites" "button" || true)
if [[ -n "$ANON_REF" && -n "$INVITE_REF" ]]; then
  agent-browser fill "@${ANON_REF}" "1"
  agent-browser click "@${INVITE_REF}"
  agent-browser wait 1200
  agent-browser snapshot --json > "$TMP_DIR/step9.json"
fi

agent-browser screenshot "$TMP_DIR/smoke.png"
echo "Smoke test passed. Screenshot: $TMP_DIR/smoke.png"
