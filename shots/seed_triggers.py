#!/usr/bin/env python3
"""POST three demo trigger rules so the Automations view has rows. Idempotent by name."""
import json, sys, urllib.request

BASE = "http://127.0.0.1:8766"
RULES = [
  # NOTE: source_config shapes below were corrected against the live
  # validate_config() for each source (kc-supervisor/src/kc_supervisor/
  # triggers/{rss,webpage,price}_source.py) — rss needs a "feeds" list, not
  # "url"; price needs "condition" + numeric "value", not "below". The
  # brief's original shapes 422 against the real API.
  {"name": "Bike-lane news", "source_type": "rss", "instruction": "Tell me only if a city council item mentions Market St bike lanes.",
   "source_config": {"feeds": ["https://example.com/council.xml"]}, "delivery_channel": "dashboard"},
  {"name": "Permit page changed", "source_type": "webpage", "instruction": "Tell me when the parking-permit renewal page changes.",
   "source_config": {"url": "https://example.com/permits"}, "delivery_channel": "dashboard"},
  {"name": "VTI below 250", "source_type": "price", "instruction": "Tell me once if VTI closes below 250.",
   "source_config": {"symbol": "VTI", "condition": "below", "value": 250}, "delivery_channel": "dashboard"},
]

def get(path):
    with urllib.request.urlopen(BASE + path, timeout=5) as r: return json.load(r)

def post(path, body):
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=5) as r: return json.load(r)

def patch(path, body):
    req = urllib.request.Request(BASE + path, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"}, method="PATCH")
    with urllib.request.urlopen(req, timeout=5) as r: return json.load(r)

resp = get("/triggers")
rows = resp if isinstance(resp, list) else resp.get("triggers", [])
existing = {t["name"] for t in rows}
for r in RULES:
    if r["name"] in existing: continue
    post("/triggers", r); print("created", r["name"])

# System-owned rules (agenda heartbeat, daily brief) default to the telegram
# channel, a v1.1 feature that must never appear in a screenshot: point them
# at the dashboard.
resp = get("/triggers")
rows = resp if isinstance(resp, list) else resp.get("triggers", [])
for t in rows:
    if t.get("delivery_channel") == "telegram":
        patch(f"/triggers/{t['id']}", {"delivery_channel": "dashboard"})
        print("re-channelled", t["name"])
