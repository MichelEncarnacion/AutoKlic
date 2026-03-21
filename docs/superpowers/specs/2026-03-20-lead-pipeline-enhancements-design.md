# Lead Pipeline Enhancements Design

**Date:** 2026-03-20
**Project:** AutoKlic admin panel
**Sub-project:** Lead pipeline enhancements — historial de leads + recordatorios de seguimiento

---

## Goal

Add full activity history to each lead and surface stale leads (those without recent activity) with visual indicators in the admin panel. Admins can configure the inactivity threshold globally.

---

## Scope

Two features delivered together because they share the same data foundation (`lead_events`, `last_activity_at`):

1. **Historial de leads** — every status change, assignment change, and internal note is recorded and viewable in a modal timeline.
2. **Recordatorios de seguimiento** — leads that exceed the configured inactivity threshold are highlighted in the table and counted in the sidebar badge.

---

## Database Changes

### New table: `lead_events`

Records every meaningful change to a lead. Append-only — never updated or deleted.

```sql
create table lead_events (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid not null references leads(id) on delete cascade,
  user_id      uuid not null references profiles(id) on delete set null,  -- who made the change
  event_type   text not null check (event_type in ('status_change', 'assignment_change', 'note_added')),
  old_value    text,  -- previous value (nullable for note_added)
  new_value    text,  -- new value
  created_at   timestamptz not null default now()
);

-- Index for fast per-lead queries
create index on lead_events (lead_id, created_at desc);
```

RLS policy: authenticated users can INSERT and SELECT. No UPDATE or DELETE.

### New column: `leads.last_activity_at`

```sql
alter table leads add column last_activity_at timestamptz;
```

Updated atomically alongside every `lead_events` INSERT (in the same Supabase client call from the frontend). Falls back to `created_at` when null (pre-migration leads with no events yet).

### New table: `settings`

Stores global admin configuration as key-value pairs.

```sql
create table settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

insert into settings (key, value) values ('follow_up_days', '3');
```

RLS policy: all authenticated users can SELECT. Only admin role can UPDATE.

---

## Frontend Architecture

### Files modified

| File | Change |
|------|--------|
| `src/pages/admin/Leads.jsx` | Insert `lead_events` + update `last_activity_at` on every status/assignment/note change; stale lead detection; settings gear icon + modal |
| `src/pages/admin/AdminLayout.jsx` | Stale lead count badge on sidebar "Leads" link |

### Files created

| File | Responsibility |
|------|---------------|
| `src/components/admin/LeadHistoryModal.jsx` | Timeline modal for a single lead's event history |

---

## Feature: Historial de leads

### Event recording

In `Leads.jsx`, the three existing mutation points are extended:

1. **Status change** (`handleStatusChange`): after updating `leads.status`, insert into `lead_events` with `event_type: 'status_change'`, `old_value: previousStatus`, `new_value: newStatus`.
2. **Assignment change** (`handleAssignmentChange`): after updating `leads.assigned_to`, insert into `lead_events` with `event_type: 'assignment_change'`, `old_value: previousAssigneeName`, `new_value: newAssigneeName`.
3. **Note saved** (`handleNoteSave`): after updating `leads.notas`, insert into `lead_events` with `event_type: 'note_added'`, `old_value: null`, `new_value: noteText`.

All three mutations also set `last_activity_at: new Date().toISOString()` on the `leads` row.

### LeadHistoryModal component

- Triggered by a clock icon button (HeroIcons `ClockIcon`) in each lead row.
- Fetches `lead_events` for the selected lead, joined with `profiles.nombre` for the user name.
- Displays events in reverse chronological order (newest first).
- Each event shows:
  - Icon by type: arrow for status, user for assignment, document for note
  - User name who made the change
  - Old value → new value (or just new value for notes)
  - Relative time (e.g., "hace 2 días") using `date-fns/formatDistanceToNow`
- Loading skeleton while fetching. Empty state if no events yet.

---

## Feature: Recordatorios de seguimiento

### Stale lead detection

On load in `Leads.jsx`:

```js
const threshold = Number(settings.follow_up_days ?? 3)
const staleLeads = leads.filter(l => {
  const lastActivity = l.last_activity_at ?? l.created_at
  return differenceInDays(new Date(), parseISO(lastActivity)) >= threshold
})
```

### Visual indicator in the table

Leads in `staleLeads` get:
- Row background: `bg-amber-50` (light yellow)
- Badge in the Nombre cell: `<span>Sin actividad</span>` styled as a small amber chip

### Sidebar badge in AdminLayout.jsx

- On mount, `AdminLayout` fetches the count of stale leads using the same threshold logic.
- Displays a red `<span>` badge next to the "Leads" nav link with the count.
- Badge is hidden when count is 0.
- Refreshes on each page navigation.

### Threshold configuration

- A gear icon (`Cog6ToothIcon`) appears in the Leads page header, visible only to admin role.
- Clicking it opens a small modal with a numeric input (`follow_up_days`, min 1, max 30).
- On save: `upsert` into `settings` table. Updates local state immediately so the UI reflects the change without reload.

---

## Data Flow

```
User changes status/assignment/note in Leads.jsx
  → UPDATE leads SET status=?, last_activity_at=now()
  → INSERT INTO lead_events (lead_id, user_id, event_type, old_value, new_value)

User clicks clock icon on a lead row
  → LeadHistoryModal opens
  → SELECT lead_events WHERE lead_id=? ORDER BY created_at DESC (joined with profiles.nombre)
  → Timeline rendered

AdminLayout mounts / user navigates
  → SELECT leads WHERE last_activity_at < now() - interval '${follow_up_days} days'
  → Badge count updated

Admin opens settings modal
  → UPSERT settings SET value=? WHERE key='follow_up_days'
  → Local threshold state updated
```

---

## Error Handling

- If `lead_events` INSERT fails (network error), show a toast warning "El cambio se guardó pero no pudo registrarse en el historial." The lead mutation itself is not rolled back — data integrity on the lead is preserved.
- If settings load fails, default to 3 days (hardcoded fallback).
- If `LeadHistoryModal` fetch fails, show an error state with retry button.

---

## Out of Scope

- Email or SMS notifications (separate sub-project)
- Per-user threshold configuration (global only)
- Deleting or editing past events (append-only)
- Audit log for inventory or user changes (separate sub-project)
