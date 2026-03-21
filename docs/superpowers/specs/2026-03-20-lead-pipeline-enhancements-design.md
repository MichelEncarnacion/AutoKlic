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
  user_id      uuid references profiles(id) on delete set null,  -- nullable: shows "Usuario eliminado" when null
  event_type   text not null check (event_type in ('status_change', 'assignment_change', 'note_added')),
  old_value    text,  -- previous value; always null for note_added (by design)
  new_value    text,  -- new value
  created_at   timestamptz not null default now()
);

-- Index for fast per-lead queries
create index on lead_events (lead_id, created_at desc);
```

`user_id` is nullable because `ON DELETE SET NULL` requires it. When null, the UI displays "Usuario eliminado".

RLS policy: authenticated users can INSERT and SELECT. No UPDATE or DELETE.
Note on RLS scope: all authenticated users (admin, seller, viewer) can read all events and insert events for any lead. Row-level filtering by role is out of scope for this iteration.

### New column: `leads.last_activity_at`

```sql
alter table leads add column last_activity_at timestamptz;
```

Updated alongside every `lead_events` INSERT from the frontend. Falls back to `created_at` when null (pre-migration leads with no events yet).

### New table: `settings`

Stores global admin configuration as key-value pairs.

```sql
create table settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

-- Seed default (run as part of migration; idempotent via ON CONFLICT)
insert into settings (key, value)
values ('follow_up_days', '3')
on conflict (key) do nothing;
```

RLS policy: all authenticated users can SELECT. Only admin role can UPDATE.

On save from the frontend, use `upsert` with `onConflict: 'key'` to be idempotent:
```js
supabase.from('settings').upsert({ key: 'follow_up_days', value: String(days), updated_at: new Date().toISOString() }, { onConflict: 'key' })
```

---

## Frontend Architecture

### Files modified

| File | Change |
|------|--------|
| `src/pages/admin/Leads.jsx` | Insert `lead_events` + update `last_activity_at` on every status/assignment/note change; stale lead detection (derived state); clock icon column; settings gear icon + modal |
| `src/pages/admin/AdminLayout.jsx` | Stale lead count badge on sidebar "Leads" link |

### Files created

| File | Responsibility |
|------|---------------|
| `src/components/admin/LeadHistoryModal.jsx` | Timeline modal for a single lead's event history |

---

## Feature: Historial de leads

### Event recording

In `Leads.jsx`, the three existing mutation points are extended:

1. **Status change**: after updating `leads.status`, insert into `lead_events` with `event_type: 'status_change'`, `old_value: previousStatus` (the Spanish label string), `new_value: newStatus`.
2. **Assignment change**: after updating `leads.assigned_to`, insert into `lead_events` with `event_type: 'assignment_change'`, `old_value: previousAssigneeName`, `new_value: newAssigneeName`.
3. **Note saved**: after updating `leads.notas`, insert into `lead_events` with `event_type: 'note_added'`, `old_value: null` (by design — the note textarea uses `defaultValue`, an uncontrolled input, so the previous value is not reliably available), `new_value: noteText`.

All three mutations also set `last_activity_at: new Date().toISOString()` on the `leads` row in the same UPDATE call.

### Table column for history trigger

A new column is added to the leads table in `Leads.jsx` containing a `ClockIcon` button per row. The existing `colSpan` calculations (used on the empty-state row and expandable detail row) must be incremented by 1 to account for this new column.

### LeadHistoryModal component

- Triggered by the `ClockIcon` button in each lead row. Receives `leadId` and `leadNombre` as props.
- Fetches `lead_events` for the selected lead using:
  ```js
  supabase
    .from('lead_events')
    .select('*, profiles!lead_events_user_id_fkey(nombre)')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })
  ```
  The explicit FK hint `profiles!lead_events_user_id_fkey` is required because the FK column is `user_id` (not `profile_id`), so Supabase cannot auto-resolve the relationship name.
- When `user_id` is null (deleted user), `profiles` will be null — display "Usuario eliminado" as the actor name.
- Displays events in reverse chronological order (newest first).
- Each event shows:
  - Icon by type: `ArrowRightIcon` for status, `UserIcon` for assignment, `DocumentTextIcon` for note
  - Actor name (from `profiles.nombre` or "Usuario eliminado")
  - For status/assignment: "old_value → new_value". For notes: just the note text.
  - Relative time using `formatDistanceToNow(parseISO(event.created_at), { locale: es, addSuffix: true })`
- Loading skeleton while fetching. Empty state message if no events yet. Error state with retry button on fetch failure.

---

## Feature: Recordatorios de seguimiento

### Stale lead detection (derived state)

In `Leads.jsx`, `staleLeadIds` is a derived `Set` computed with `useMemo` so it recalculates whenever `leads` or `threshold` state changes:

```js
const staleLeadIds = useMemo(() => {
  const cutoff = subDays(new Date(), threshold)
  return new Set(
    leads
      .filter(l => {
        const lastActivity = parseISO(l.last_activity_at ?? l.created_at)
        return lastActivity < cutoff
      })
      .map(l => l.id)
  )
}, [leads, threshold])
```

`threshold` is a state variable initialized from the `settings` fetch (fallback: `3`).

### Visual indicator in the table

Leads whose `id` is in `staleLeadIds` get:
- Row background: `bg-amber-50`
- A small amber badge "Sin actividad" next to the lead's name

### Sidebar badge in AdminLayout.jsx

`AdminLayout` independently fetches the stale lead count on mount and on each navigation. It does **not** share state with `Leads.jsx` — it fetches its own copy of `settings` (fallback: 3 if the row is missing) and computes the cutoff date in JavaScript:

```js
// Inside AdminLayout, on mount:
const { data: setting } = await supabase.from('settings').select('value').eq('key', 'follow_up_days').single()
const days = Number(setting?.value ?? 3)
const cutoff = subDays(new Date(), days).toISOString()
const { count } = await supabase
  .from('leads')
  .select('id', { count: 'exact', head: true })
  .lt('last_activity_at', cutoff)
```

The badge displays `count` next to the "Leads" nav link. Hidden when `count === 0` or `null`.

### Threshold configuration

- A `Cog6ToothIcon` button appears in the Leads page header, visible only when `profile.role === 'admin'`.
- Clicking opens a small modal with a numeric input (min 1, max 30, default from current `threshold` state).
- On save: upsert into `settings` (see DB section for exact call). Updates the local `threshold` state immediately — `staleLeadIds` recalculates automatically via `useMemo`.

---

## Data Flow

```
User changes status/assignment/note in Leads.jsx
  → supabase.from('leads').update({ status, last_activity_at })
  → supabase.from('lead_events').insert({ lead_id, user_id, event_type, old_value, new_value })

User clicks ClockIcon on a lead row
  → LeadHistoryModal opens
  → supabase.from('lead_events').select('*, profiles!lead_events_user_id_fkey(nombre)')
    .eq('lead_id', id).order('created_at', { ascending: false })
  → Timeline rendered

AdminLayout mounts / user navigates
  → fetch settings row for 'follow_up_days' (fallback: 3)
  → compute cutoff = subDays(new Date(), days).toISOString()
  → supabase.from('leads').select('id', { count: 'exact', head: true }).lt('last_activity_at', cutoff)
  → Badge count updated

Admin opens settings modal and saves
  → supabase.from('settings').upsert({ key: 'follow_up_days', value: String(days) }, { onConflict: 'key' })
  → setThreshold(days) in Leads.jsx → staleLeadIds useMemo recalculates
```

---

## Error Handling

- If `lead_events` INSERT fails, show a toast "El cambio se guardó pero no pudo registrarse en el historial." The lead UPDATE is not rolled back.
- If settings fetch fails anywhere, fall back to 3 days silently.
- If `LeadHistoryModal` fetch fails, show an error state with a retry button.

---

## Out of Scope

- Email or SMS notifications (separate sub-project)
- Per-user threshold configuration (global only)
- Deleting or editing past events (append-only)
- Audit log for inventory or user changes (separate sub-project)
- Row-level RLS filtering by seller role for `lead_events`
