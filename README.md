# Emergency Triage System: Frontend

React 19 + TypeScript + Vite, with a Three.js hospital map, Framer Motion, Zustand and Tailwind CSS v4.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build
```

## Pages

| Route     | What it does |
|-----------|--------------|
| `/`       | Triage console: chat assessment, 3D hospital map, searchable and filterable hospital list |
| `/portal` | Hospital portal: update load, beds, ICU, ventilators, ER bays, blood, specialist departments, doctors on duty and rooms |

**Real-time demo:** open `/` in one tab and `/portal` in another. Edit a hospital in the portal
(or press "Simulate rush") and the triage tab re-ranks instantly and posts a re-routing message in the chat.
Sync uses Zustand `persist` plus the browser `storage` event. Replace `src/store/hospitals.ts` with
WebSocket/SSE calls to your Node.js backend when it is ready.

## Structure

```
src/
  types.ts                 shared domain types
  data/seed.ts             5 simulated hospitals (not real facilities)
  lib/triage.ts            text parser + rule-based severity and required-facility engine
  lib/capability.ts        "can this hospital handle X right now?" (live resources + on-duty doctors)
  lib/ranking.ts           normalised scoring (0.4 distance, 0.3 load, 0.3 facility match)
  lib/geo.ts               haversine distance and ETA fallback
  store/hospitals.ts       Zustand stores: hospitals (persisted, cross-tab) and session (location)
  hooks/useChat.ts         chat state machine
  components/              ChatPanel, HospitalList, Scene3D, Header, ui primitives
  pages/                   TriagePage, PortalPage
```

## Connecting the real services

- **ETA and routes:** `etaMinutes()` in `lib/geo.ts` is a straight-line fallback. Call your backend
  (which calls Google Maps Directions API) and use the returned minutes in `rankHospitals`.
- **Triage:** `assess()` in `lib/triage.ts` is a rule-based prototype. Swap it for your backend or ML model
  and keep the `TriageResult` shape.
- **Hospitals:** replace the store's seed data with an API fetch plus a live channel.

Decision-support prototype only. It does not diagnose, and it uses simulated hospital data.
