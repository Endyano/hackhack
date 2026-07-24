# CareShift — Project Context for Claude Code

You are helping me build **CareShift** solo, in a **24-hour hackathon**. Read this file at the start of every session before writing code. Treat it as the source of truth for scope, schema, and API contracts — do not silently deviate from it. If something here is ambiguous or you think a simpler approach will demo better, flag it and propose the change before implementing.

## Elevator pitch

CareShift is an AI wellbeing planner. It finds when the user is free (calendar), understands their current condition (mood/energy/readiness check-in), and recommends a mental, physical, or nutritional activity that actually fits their day — with duration and intensity adapted to available time and recent history. Optionally, it matches the user with a friend who has overlapping free time (CareMatch).

## Tech stack (fixed — do not swap)

- **Frontend:** Next.js + React + TypeScript
- **Backend:** Python (use **FastAPI** unless I say otherwise — good fit for structured JSON responses and async calls to Foundry)
- **Database:** Supabase (Postgres)
- **AI:** Microsoft Foundry AI agent (via Azure AI Foundry SDK/REST) — used ONLY for judgement calls, never for things normal code can do deterministically

## Division of responsibility (I'm doing all of this solo — build in this order, not team-parallel)

**Backend rules decide what is possible. The AI agent decides what is most suitable.**

- Backend code (deterministic): calendar parsing, free-slot detection, buffer math, Supabase CRUD, overlap calculation for CareMatch, invitation status management, filtering out activities that literally cannot fit in the available time.
- Foundry AI (judgement): choosing the specific activity, mental vs physical vs nutritional, duration/intensity within what's possible, avoiding repeats, writing the explanation, producing alternatives on rejection, interpreting free-text/voice input, flagging social-compatibility.

## Repo structure

```
careshift/
  frontend/           # Next.js app
  backend/            # FastAPI app
    app/
      routers/
      services/
      foundry/        # agent client, prompt templates, response validation
      models/          # pydantic schemas
    seed/             # seed data scripts for Supabase
  supabase/
    schema.sql
  .env.example
  CLAUDE.md
```

## Supabase schema (create as `supabase/schema.sql`)

Tables (see full field list below — use `uuid` PKs with `default gen_random_uuid()`, `timestamptz` for timestamps):

- **USERS**: id, name, email, experience_level, primary_goal, current_location, carematch_enabled, created_at
- **USER_PREFERENCES**: id, user_id (fk), preferred_activities, disliked_activities, available_equipment, preferred_intensity, preferred_activity_time
- **CALENDAR_EVENTS**: id, user_id (fk), title, start_time, end_time, event_type
- **DAILY_CHECK_INS**: id, user_id (fk), mood, energy_level, physical_readiness, location, additional_notes, created_at
- **ACTIVITY_RECOMMENDATIONS**: id, user_id (fk), activity_name, category, start_time, duration_minutes, intensity, reason, status, created_at
  - status enum: pending | accepted | replaced | shortened | skipped | completed | partially_completed
- **ACTIVITY_HISTORY**: id, user_id (fk), recommendation_id (fk), completion_status, feedback, completed_at
- **FRIENDSHIPS**: id, user_id (fk), friend_id (fk), status, carematch_enabled
- **ACTIVITY_INVITATIONS**: id, sender_id (fk), receiver_id (fk), recommendation_id (fk), activity_name, proposed_start, proposed_end, location, status, created_at
  - status enum: pending | accepted | declined | cancelled

## API contract (I own all endpoints — build backend first, frontend can use mock JSON matching this contract until backend is live)

```
GET  /users/{user_id}
PUT  /users/{user_id}
GET  /users/{user_id}/preferences

POST /check-ins
GET  /check-ins/{user_id}/latest

GET  /calendar/{user_id}
GET  /calendar/{user_id}/free-slots

GET  /activities/{user_id}/history
POST /activities/{user_id}/result

GET  /recommendation-context/{user_id}     # aggregates profile+checkin+free_slots+history+prefs

POST /recommendations/generate
POST /recommendations/{id}/shorten
POST /recommendations/{id}/replace
POST /recommendations/{id}/skip
POST /recommendations/{id}/accept

GET  /carematch/{user_id}/matches
POST /carematch/invitations
GET  /carematch/invitations/{user_id}
PATCH /carematch/invitations/{id}/accept
PATCH /carematch/invitations/{id}/decline
```

### Recommendation JSON — this exact shape everywhere (frontend, backend, Foundry response)

```json
{
  "recommendation_id": "rec_001",
  "activity": "Easy run",
  "category": "physical",
  "start_time": "16:30",
  "duration_minutes": 30,
  "intensity": "easy",
  "reason": "You have enough free time and your current energy is medium.",
  "social_compatible": true,
  "carematch": {
    "available": true,
    "friend_id": "user_002",
    "friend_name": "Daniel",
    "overlap_start": "16:30",
    "overlap_end": "17:30"
  }
}
```

`category` is one of: `mental` | `physical` | `nutritional`. If Foundry returns anything outside this contract, validate and coerce/reject before saving to Supabase — never pass raw unvalidated model output to the frontend.

## Foundry agent — what its input context looks like

```json
{
  "energy": "medium",
  "mood": "stressed",
  "location": "campus",
  "goal": "improve endurance",
  "experience": "beginner",
  "recent_activity": "leg workout yesterday",
  "free_period": { "start": "16:00", "end": "18:00", "usable_minutes": 110 }
}
```

Duration→activity-type bands to bake into the system prompt (backend filters impossible options first, Foundry picks within what remains):
- 5–10 min: stretching, hydration break, breathing exercise, posture reset, short walk
- 20–30 min: brisk walk, short run, bodyweight workout, mobility routine, mental recharge
- 30–60 min: gym session, running session, longer walk, full mobility workout, meal prep
- 1–2 hrs: full gym workout, endurance run, sports activity, group exercise, meal prep + recovery

## Critical UX rule — always have a fallback

If the Foundry call fails or times out, the frontend must show a hardcoded fallback recommendation ("10-minute walk and hydration break") rather than an error state. The demo must never visibly break if the AI call is slow/flaky.

## Seed / demo data (bake into seed scripts — this is the scripted demo path)

Two users: **Eric** and **Daniel**.
- Eric: class 2–4PM, free 4–6PM. Check-in: mood=stressed, energy=medium, readiness=normal, goal=improve endurance, recent_activity=leg workout yesterday.
- Expected: 30-min easy run at 4:30PM, reasoning ties energy+recent leg day to "easy" intensity.
- Daniel: free 4:30–5:30PM, also prefers running → CareMatch should surface Daniel, Eric invites, Daniel accepts.

Keep calendar data hardcoded/seeded — do NOT integrate real Outlook/Google Calendar (explicitly out of scope for MVP).

## Build order (solo — collapse the original team phases into sequential sessions)

1. **Scaffold**: repo structure, Next.js app skeleton, FastAPI skeleton, Supabase project + schema.sql + seed data, `.env.example`.
2. **Backend core**: profile/check-in/calendar APIs, free-slot detection with prep-buffer logic, `/recommendation-context/{user_id}`.
3. **Foundry integration**: agent setup, system prompt, `/recommendations/generate`, response validation against the JSON contract above.
4. **Connect the main flow end-to-end**: user select → check-in → calendar detection → Foundry recommendation → display. This is the most important milestone — get this working before anything else.
5. **Recommendation actions**: accept/shorten/replace/skip, save to history.
6. **CareMatch**: overlap detection, invitations, accept/decline, switch-user demo flow.
7. **Polish**: loading states, fallback recommendation wiring, seed accounts sanity check, fix integration bugs. No new features after this point.

## Explicitly OUT of scope for MVP (do not build unless I ask)

Real auth (use a demo user-picker), real Outlook/Google Calendar sync, push notifications, real-time invitation updates, live 15-min polling. Voice input is enhancement-only — text input first.

## Conventions

- TypeScript strict mode on frontend; Pydantic models for every FastAPI request/response.
- Every Foundry response gets parsed/validated before touching the DB or the frontend — never trust raw model JSON.
- Prefer small, working vertical slices over building all of one layer first — after step 3 above, always keep the app in a demoable state.