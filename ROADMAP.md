# SparkyQ — Product & Engineering Roadmap

A prioritized roadmap of next-stage improvements for **SparkyQ**, grouped by job-site impact, real-time responsiveness, discovery, and community/moderation tools.

---

## 1. Job-Site Speed & Field Tools (High Impact for Sparkies)

### 1.1 Photo Attachments on Answers + In-App Lightbox
- **Current state:** Only questions support photo uploads (`src/app/(app)/ask/AskForm.tsx`), and clicking a photo in `src/app/(app)/questions/[id]/page.tsx` opens the raw Supabase Storage URL in a new browser tab.
- **Improvement:**
  - Allow verified answerers to attach up to 4 photos/diagrams (e.g., marked-up switchboard photos, hand-drawn wiring sketches, or AS/NZS table screenshots) with the same client-side canvas compression used in `AskForm.tsx`.
  - Add an in-app full-screen lightbox modal with pinch-to-zoom and swipe navigation across question and answer photos.

### 1.2 Voice-to-Text Dictation on `/ask` and Answers
- **Current state:** Electricians on site must type fault descriptions manually.
- **Improvement:**
  - Add a microphone button in `AskForm.tsx` and the answer composer (`src/app/(app)/questions/[id]/interactive.tsx`) using the browser Web Speech API (or OpenAI Whisper fallback).
  - Let sparkies dictate rough notes hands-free while holding a meter, then tap **Tidy with AI** to structure the post and auto-suggest tags.

### 1.3 Highlighted AS/NZS Clause Chips
- **Current state:** `src/app/(app)/questions/[id]/actions.ts` detects references like `AS/NZS 3000`, `AS/NZS 5033`, or `Clause 2.6.3` via regex to set `includes_reference = true`.
- **Improvement:**
  - Parse and highlight cited standards and clause numbers inside question and answer bodies as interactive badge chips so standards-backed answers stand out at a glance.

---

## 2. Real-Time & Lock-Screen Notifications (Critical for "Stuck on Site")

### 2.1 Web Push Notifications (PWA Push API)
- **Current state:** Notifications are stored in `public.notifications` and shown on `/notifications`, requiring the user to open or refresh the app.
- **Improvement:**
  - Add Web Push (`ServiceWorkerRegistration.pushManager` in `public/sw.js` + VAPID keys and a `push_subscriptions` table) so when a sparky posts a **"Stuck on site"** urgent question and locks their phone, they receive an immediate lock-screen notification the moment a verified peer posts an answer or comment.

### 2.2 Live Thread Updates (Supabase Realtime)
- **Current state:** Question threads (`src/app/(app)/questions/[id]/page.tsx`) require a page reload to see newly posted answers or comments from other users.
- **Improvement:**
  - Subscribe to Supabase Realtime changes on `answers`, `comments`, and `notifications` so active fault-finding threads update live and the header notification bell increments in real time.

---

## 3. Feed Discovery, Search & Bookmarks

### 3.1 Clickable Tag Filtering & "Load More" Pagination on `/feed`
- **Current state:** `src/app/(app)/feed/page.tsx` fetches `.limit(40)` with no pagination, and tag badges (`rcd-tripping`, `as-nzs-3000`, `solar-inverter`, etc.) are display-only.
- **Improvement:**
  - Add `?tag=<slug>` filtering to `/feed` and make every tag badge clickable across feed cards and question pages.
  - Add cursor-based "Load more" pagination so older resolved threads remain browsable.

### 3.2 Saved / Bookmarked Threads ("My Toolbox")
- **Current state:** No way to save useful threads for future reference.
- **Improvement:**
  - Add a `saved_questions` table (`user_id`, `question_id`, `created_at`) with RLS.
  - Add a bookmark toggle on question cards/threads and a `/saved` ("Toolbox") view so sparkies can build a personal reference library of tricky faults and AS/NZS interpretations.

### 3.3 Full-Text Search Across Questions & Accepted Answers
- **Current state:** Feed search uses `.or(title.ilike.%q%,body.ilike.%q%)` on `questions` only.
- **Improvement:**
  - Add a Postgres `tsvector` generated column + GIN index on `questions` and `answers`, exposed via a `search_questions(p_query text)` RPC so searching for an inverter model number, fault code, or AS/NZS clause inside an answer surfaces the parent thread.

---

## 4. Author Controls, Experts Directory & Faster Moderation

### 4.1 Edit Own Questions, Answers & Comments
- **Current state:** Posts cannot be edited after submission.
- **Improvement:**
  - Allow authors to edit their own questions, answers, and comments (e.g., to add insulation resistance or earth fault-loop impedance readings requested by peers in comments).

### 4.2 Top Sparkies / Experts Directory (`/experts`)
- **Current state:** Postgres tracks `reputation`, `safety_score`, and per-category `user_category_scores` (`solar_battery`, `switchboard`, `ev_chargers`, `fault_finding`, etc.), which are only visible when visiting a user's `/u/[handle]` profile directly.
- **Improvement:**
  - Add an `/experts` directory page filterable by Australian state (`NSW`, `VIC`, `QLD`, `WA`, `SA`, `TAS`, `ACT`, `NT`) and job category/specialisation.

### 4.3 One-Click State Licence Register Lookup in `/admin`
- **Current state:** Moderators manually copy and look up licence numbers in `src/app/(app)/admin/page.tsx`.
- **Improvement:**
  - Add direct one-click lookup links on each pending licence card in `/admin` mapped by `v.state` to the official state regulator register:
    - **VIC:** Energy Safe Victoria (ESV) Public Register
    - **NSW:** Service NSW / Fair Trading Licence Check
    - **QLD:** Electrical Safety Office (ESO) Licence Search
    - **WA:** Building and Energy (DEMIRS) Licence Search
    - **SA:** Consumer and Business Services (CBS) Public Register
    - **TAS:** Consumer, Building and Occupational Services (CBOS) Licence Search
    - **ACT:** Access Canberra Construction Occupations Register
    - **NT:** NT Electrical Workers and Contractors Register
