#!/usr/bin/env python3
import json
import sys

if len(sys.argv) < 3:
    print("Usage: ab_ref.py <snapshot.json> <name_substring> [role]", file=sys.stderr)
    sys.exit(2)

snapshot_path = sys.argv[1]
name_query = sys.argv[2].lower()
role_query = sys.argv[3] if len(sys.argv) > 3 else None

with open(snapshot_path, "r", encoding="utf-8") as handle:
    payload = json.load(handle)

refs = payload.get("data", {}).get("refs", {})

for ref, info in refs.items():
    if role_query and info.get("role") != role_query:
        continue
    name = info.get("name")
    if not name:
        continue
    if name_query in name.lower():
        print(ref)
        sys.exit(0)

print("", end="")
sys.exit(1)
