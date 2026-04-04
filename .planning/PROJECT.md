# DanceStudio

## What This Is

DanceStudio is an information system for automating the core operations of a dance school. The product is intended for three roles: administrator, teacher, and student, and should centralize users, groups, schedules, attendance, subscriptions, and reporting in one system.

## Core Value

The system must provide one reliable source of truth for the dance school's учебный процесс: who studies, with whom, when classes happen, who attended, and how many lessons remain on each subscription.

## Requirements

### Validated

- ✓ PostgreSQL data model for users, students, teachers, groups, schedule, subscriptions, and attendance already exists in `db.sql`
- ✓ Local database bootstrap scripts already exist in `scripts/`
- ✓ Authentication for `admin`, `teacher`, and `student` is implemented in the Express app
- ✓ Administrator can manage students, teachers, groups, schedule, and subscriptions
- ✓ Teacher can mark attendance and the system updates subscription lesson balances
- ✓ Student can view their own groups, schedule, subscriptions, and attendance history
- ✓ Administrator can review attendance, subscription, and schedule reports

### Active

- [ ] Thesis MVP is complete; the next work should be defined as a separate v2 milestone

### Out of Scope

- Native mobile applications — web MVP is sufficient for current scope
- Online payments — not required by the current thesis-defined functionality
- CRM/marketing automation — not part of the core school operations being automated
- Multi-branch network management — no evidence of this need in the current source document

## Context

The project is based on the thesis topic "Разработка информационной системы для автоматизации деятельности танцевальной школы". The thesis text defines the main functional scope: authentication, student records, teacher records, schedule editing, attendance accounting, subscription control, and reporting. The implementation stack described in the thesis is standard web development on the client (`HTML`, `CSS`, `JavaScript`), `Node.js + Express` on the server, `PostgreSQL` for storage, and an ORM layer for database access. The repository now contains the PostgreSQL schema, local database bootstrap scripts, an Express application, authentication with role separation, admin-facing management flows for students, teachers, groups, schedule, and subscriptions, teacher-facing attendance marking with automatic lesson write-off and rollback, student-facing personal кабинеты, and admin-facing operational reports.

## Constraints

- **Tech stack**: The target stack is `HTML + CSS + JavaScript` frontend, `Node.js + Express` backend, `PostgreSQL` database, and ORM-based data access — this is explicitly defined in the thesis.
- **Tech stack**: PostgreSQL is already the canonical persistence layer — the existing schema and bootstrap scripts should remain the source of truth.
- **Domain scope**: Functionality should stay aligned with the thesis scope — avoid unrelated product expansion before MVP is working.
- **Roles**: Access must be separated for `admin`, `teacher`, and `student` — this is explicitly reflected in the schema and requirements.
- **Execution style**: Continue incrementally from the current repository state — database-first foundation before broader application features.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Start from the thesis-defined PostgreSQL schema | The schema already captures the core domain entities and relations | ✓ Good |
| Use three system roles: admin, teacher, student | This is required by the source requirements and current schema | ✓ Good |
| Treat the current repository as pre-init MVP groundwork | There is useful implementation, but no planning context yet | ✓ Good |
| Implement the MVP with vanilla frontend plus `Node.js + Express` server | This matches the implementation section of the thesis and keeps the stack simple | ✓ Good |
| Build core school data management as admin-first flows | This unlocks the main operational objects before attendance and subscriptions | ✓ Good |
| Add `group_students` membership and `attendance.subscription_id` linkage | Without these links attendance and lesson write-off cannot be implemented correctly | ✓ Good |
| Complete Phase 5 with dedicated student and reporting APIs | Role-specific UX and operational visibility were the remaining thesis MVP gaps | ✓ Good |

---
*Last updated: 2026-04-01 after interfaces and reporting implementation*
