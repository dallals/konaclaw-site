#!/usr/bin/env python3
"""Build ~/KonaClawDemo: a minimal agent file and a conversations DB with
invented transcripts. Idempotent: resets the agent file and transcripts only;
never touches notebooks/ or anything else under the demo tree.
Schema for the two tables is copied from kc-supervisor storage.py so the
supervisor's own init() (CREATE TABLE IF NOT EXISTS) adds the rest."""
import json, sqlite3, time
from pathlib import Path

HOME = Path.home() / "KonaClawDemo"
AGENT = "Kona-AI"
CHANNEL = "dashboard"

DDL = """
CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    agent TEXT NOT NULL,
    channel TEXT NOT NULL,
    started_at REAL NOT NULL,
    pinned INTEGER NOT NULL DEFAULT 0,
    title TEXT
);
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT,
    tool_call_json TEXT,
    usage_json TEXT,
    ts REAL NOT NULL,
    scheduled_job_id INTEGER,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id)
);
"""

# id → (title, [(role, content), ...]). All names, places and events are invented.
TRANSCRIPTS = {
  "week": ("This week", [
    ("user", "What does my week look like?"),
    ("assistant", "Here's your week:\n\n**Mon** — 9:30 Design review (Room 4B) · 12:00 Lunch with Priya Nair\n**Tue** — 8:00 Dentist, Dr. Okafor · 15:00 Quarterly planning\n**Wed** — Free until 16:00 · 16:00 Parent–teacher conference\n**Thu** — 10:00 1:1 with Marcus · 18:30 Pottery class\n**Fri** — 11:00 Flight to Denver (UA 1187)\n\nTuesday is the tight one. Want me to move the dentist to next week so the morning is clear before planning?"),
    ("user", "Yes, move it to next Tuesday same time."),
    ("assistant", "Done. Dentist with Dr. Okafor is now **Tue Sep 30 at 8:00**. I left a note on the old slot so you know why it moved."),
  ]),
  "mail": ("Accountant thread", [
    ("user", "Anything from my accountant this week?"),
    ("assistant", "One thread from **Dana Whitfield** (Whitfield & Co), three messages:\n\n1. Tue — asks for the 2025 charitable-giving receipts.\n2. Wed — confirms the extension was filed, no action needed.\n3. Thu — reminder about the receipts; deadline is **Oct 3**.\n\nWant me to draft a reply saying the receipts will be in by Monday?"),
    ("user", "Yes, and attach the folder from the shared drive."),
    ("assistant", "Drafted, with the *2025 Giving Receipts* folder attached as a zip (14 files, 3.2 MB):\n\n> Hi Dana — thanks for the nudge. Receipts are attached; let me know if anything is missing. Best, Sam\n\nSend it?"),
  ]),
  "memory": ("Travel prefs", [
    ("user", "Book me on the earliest nonstop to Denver on the 3rd, you know what I like."),
    ("assistant", "Looking for **United**, aisle seat, no red-eyes — the preferences you gave me in August. Earliest nonstop from SFO on Oct 3 is UA 1187 at 7:05, aisle 14C available. I can't purchase tickets, but I've put the itinerary on your calendar as a hold and drafted the booking link. Want it?"),
  ]),
  "brief": ("Morning brief", [
    ("assistant", "**Good morning — Thursday, September 18**\n\n☀️ 68° and clear, high of 74.\n\n**Calendar** · 10:00 1:1 with Marcus · 18:30 Pottery class\n\n**Inbox** · 3 need a reply: Dana Whitfield (receipts, due Oct 3), the landlord (parking permit renewal), Sofia (dinner Saturday?)\n\n**Portfolio** · Up 0.4% yesterday. VTI +0.6%, bonds flat.\n\n**News**\n• City council approves the bike-lane extension on Market St\n• Fed minutes point to a hold through year end\n• New macOS update fixes the external-display sleep bug\n\nAnything you want me to do with these?"),
  ]),
  "skill": ("Weekly report", [
    ("user", "/weekly-report"),
    ("assistant", "Running **weekly-report**…\n\n✅ Pulled last week's closed tasks (23)\n✅ Summarized by project (Onboarding, Billing, Mobile)\n✅ Wrote `Weekly Report — Sep 8–12.docx` to the shared folder\n\nHighlights: Onboarding shipped the new checklist; Billing closed the double-charge bug; Mobile is one review away from the 2.4 release. Open the report?"),
  ]),
  "web": ("Compare stand mixers", [
    ("user", "Compare the two stand mixers I bookmarked and tell me which to get."),
    ("assistant", "I read both product pages and three reviews.\n\n| | Model A | Model B |\n|---|---|---|\n| Bowl | 5 qt | 7 qt |\n| Motor | 325 W | 500 W |\n| Weight | 26 lb | 32 lb |\n| Price | lower | higher |\n\nFor weekly bread and the occasional double batch, **Model A** is enough and lighter to move. Get B only if you bake for a crowd. Sources: [Serious Eats review], [America's Test Kitchen], both product pages."),
  ]),
  "chart": ("Spending chart", [
    ("user", "/chart my grocery spending by month this year"),
    ("assistant", "Here's grocery spending by month, January through August. July is the outlier — the two birthday dinners. Average is $612/month."),
  ]),
}

def main():
    # Never delete the demo tree: the demo notebook is created by hand once and
    # must survive every reseed. Reset only the agent file and the transcripts.
    (HOME / "agents").mkdir(parents=True, exist_ok=True); (HOME / "data").mkdir(exist_ok=True)
    (HOME / "agents" / f"{AGENT}.yaml").write_text(
        f"name: {AGENT}\nmodel: demo/no-live-turns\nsystem_prompt: |\n  You are Kona, a personal assistant. (Demo profile; no live turns are run.)\n")
    con = sqlite3.connect(HOME / "data" / "konaclaw.db"); con.executescript(DDL)
    con.execute("DELETE FROM messages"); con.execute("DELETE FROM conversations")
    for f in (HOME / "data").glob("conv_*.id"): f.unlink()
    t0 = time.time() - 6 * 86400
    for i, (key, (title, msgs)) in enumerate(TRANSCRIPTS.items()):
        cid = con.execute("INSERT INTO conversations(agent, channel, started_at, pinned, title) VALUES (?,?,?,?,?)",
                          (AGENT, CHANNEL, t0 + i * 3600, 0, title)).lastrowid
        for j, (role, content) in enumerate(msgs):
            con.execute("INSERT INTO messages(conversation_id, role, content, ts) VALUES (?,?,?,?)",
                        (cid, role, content, t0 + i * 3600 + j * 40))
        (HOME / "data" / f"conv_{key}.id").write_text(str(cid))
    con.commit(); con.close()
    print(f"seeded {HOME} with {len(TRANSCRIPTS)} conversations")

if __name__ == "__main__": main()
