# Roadmap: DanceStudio

## Overview

The project will move from a schema-first repository to a usable MVP for a dance school. The immediate path is to formalize the existing database foundation, then build authentication and role separation, then add the core operational workflows for directory data, schedule, attendance, subscriptions, and reporting.

## Phases

- [x] **Phase 1: Foundation** - Lock down the project baseline, database workflow, and backend/application skeleton
- [x] **Phase 2: Access Control** - Implement authentication and role-aware access
- [x] **Phase 3: Core School Data** - Build management for students, teachers, groups, and schedule
- [x] **Phase 4: Attendance And Subscriptions** - Implement attendance tracking and subscription business rules
- [x] **Phase 5: Interfaces And Reporting** - Deliver role-specific workflows and core reports

## Phase Details

### Phase 1: Foundation
**Goal**: Turn the current schema-first repository into a stable development base with explicit structure, verified database workflow, and a thesis-aligned application skeleton.
**Depends on**: Nothing (first phase)
**Requirements**: SUB-03
**Success Criteria** (what must be TRUE):
  1. The project has a reproducible local database setup and documented baseline.
  2. A thesis-aligned `Node.js + Express + HTML/CSS/JS` application structure exists in the repository and can connect to PostgreSQL.
  3. The next feature phases can build on a stable foundation instead of ad hoc files.
**Plans**: 3 plans

Plans:
- [x] 01-01: Audit and normalize the database foundation
- [x] 01-02: Choose and scaffold the application stack
- [x] 01-03: Wire baseline app-to-database connectivity

### Phase 2: Access Control
**Goal**: Add sign-in flow and role-based authorization for administrator, teacher, and student.
**Depends on**: Phase 1
**Requirements**: AUTH-01, AUTH-02, AUTH-03
**Success Criteria** (what must be TRUE):
  1. A user can sign in with stored credentials.
  2. The application enforces access rules by role.
  3. Session handling works consistently for normal usage.
**Plans**: 2 plans

Plans:
- [x] 02-01: Implement authentication backend and session handling
- [x] 02-02: Enforce role-based access and protected application routes

### Phase 3: Core School Data
**Goal**: Support daily administration of students, teachers, groups, and schedule.
**Depends on**: Phase 2
**Requirements**: DIR-01, DIR-02, DIR-03, DIR-04, SCH-01, SCH-02
**Success Criteria** (what must be TRUE):
  1. Administrator can manage students, teachers, and groups.
  2. Administrator can create and edit schedule entries.
  3. Stored data remains consistent with the database model.
**Plans**: 3 plans

Plans:
- [x] 03-01: Build student and teacher management flows
- [x] 03-02: Build groups and teacher assignment flows
- [x] 03-03: Build schedule management flows

### Phase 4: Attendance And Subscriptions
**Goal**: Automate lesson attendance and subscription accounting.
**Depends on**: Phase 3
**Requirements**: ATT-01, ATT-02, ATT-03, SUB-01, SUB-02, SUB-04
**Success Criteria** (what must be TRUE):
  1. Teacher can mark attendance for scheduled lessons.
  2. Subscription balances update correctly after attendance actions.
  3. Administrator can manage subscription lifecycle states.
**Plans**: 3 plans

Plans:
- [x] 04-01: Build subscription management flows
- [x] 04-02: Build attendance marking workflow
- [x] 04-03: Add lesson write-off and subscription state transitions

### Phase 5: Interfaces And Reporting
**Goal**: Complete the MVP with role-specific interfaces and operational reports.
**Depends on**: Phase 4
**Requirements**: SCH-03, REP-01, REP-02, REP-03
**Success Criteria** (what must be TRUE):
  1. Each role sees the relevant operational interface.
  2. Administrator can review attendance and subscription reports.
  3. The MVP supports the key daily workflows described in the thesis.
**Plans**: 2 plans

Plans:
- [x] 05-01: Build role-specific dashboard and navigation flows
- [x] 05-02: Build operational reporting views

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete | 2026-04-01 |
| 2. Access Control | 2/2 | Complete | 2026-04-01 |
| 3. Core School Data | 3/3 | Complete | 2026-04-01 |
| 4. Attendance And Subscriptions | 3/3 | Complete | 2026-04-01 |
| 5. Interfaces And Reporting | 2/2 | Complete | 2026-04-01 |
