# Requirements: DanceStudio

**Defined:** 2026-04-01
**Core Value:** The system must provide one reliable source of truth for the dance school's учебный процесс: who studies, with whom, when classes happen, who attended, and how many lessons remain on each subscription.

## v1 Requirements

### Authentication

- [x] **AUTH-01**: User can sign in with email and password
- [x] **AUTH-02**: System grants access according to user role (`admin`, `teacher`, `student`)
- [x] **AUTH-03**: User session persists across page refresh within an active login session

### Directory Data

- [x] **DIR-01**: Administrator can create and edit student records
- [x] **DIR-02**: Administrator can create and edit teacher records
- [x] **DIR-03**: Administrator can create and edit groups with teacher assignment
- [x] **DIR-04**: System stores profile data required for school operations

### Schedule

- [x] **SCH-01**: Administrator can create and edit class schedule entries
- [x] **SCH-02**: Schedule entry stores date, start time, end time, room, and group
- [x] **SCH-03**: Users can view schedule according to their role and relevance

### Attendance

- [x] **ATT-01**: Teacher can mark student attendance for a scheduled lesson
- [x] **ATT-02**: System prevents duplicate attendance marks for the same student and lesson
- [x] **ATT-03**: Attendance marking updates the student's subscription remaining lessons when applicable

### Subscriptions

- [x] **SUB-01**: Administrator can create and edit student subscriptions
- [x] **SUB-02**: Subscription stores total lessons, remaining lessons, dates, and status
- [x] **SUB-03**: System validates subscription dates and lesson counters
- [x] **SUB-04**: Administrator can see whether a subscription is active, completed, or suspended

### Reporting

- [x] **REP-01**: Administrator can view attendance reports
- [x] **REP-02**: Administrator can view subscription status and remaining lessons
- [x] **REP-03**: Administrator can view schedule-related operational data

## v2 Requirements

### Extended Product

- **EXT-01**: Online payment support for subscriptions
- **EXT-02**: Push or email reminders about lessons
- **EXT-03**: Multi-branch school support
- **EXT-04**: Mobile application

## Out of Scope

| Feature | Reason |
|---------|--------|
| Online payments | Not part of the current thesis MVP |
| Marketing CRM | Outside the operational automation scope |
| Native mobile apps | Web-first delivery is enough for the first version |
| Multi-branch management | No current evidence of this requirement |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 2 | Complete |
| AUTH-02 | Phase 2 | Complete |
| AUTH-03 | Phase 2 | Complete |
| DIR-01 | Phase 3 | Complete |
| DIR-02 | Phase 3 | Complete |
| DIR-03 | Phase 3 | Complete |
| DIR-04 | Phase 3 | Complete |
| SCH-01 | Phase 3 | Complete |
| SCH-02 | Phase 3 | Complete |
| SCH-03 | Phase 5 | Complete |
| ATT-01 | Phase 4 | Complete |
| ATT-02 | Phase 4 | Complete |
| ATT-03 | Phase 4 | Complete |
| SUB-01 | Phase 4 | Complete |
| SUB-02 | Phase 4 | Complete |
| SUB-03 | Phase 1 | Complete |
| SUB-04 | Phase 4 | Complete |
| REP-01 | Phase 5 | Complete |
| REP-02 | Phase 5 | Complete |
| REP-03 | Phase 5 | Complete |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-01*
*Last updated: 2026-04-01 after interfaces and reporting implementation*
