# Lead Pipeline Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full activity timeline to each lead and surface stale leads with visual indicators and a configurable inactivity threshold.

**Architecture:** Three new DB objects (`lead_events` table, `last_activity_at` column on `leads`, `settings` table) back two frontend features: a `LeadHistoryModal` component that shows a per-lead event timeline, and stale-lead detection computed via `useMemo` in `Leads.jsx`. `AdminLayout.jsx` independently fetches the stale count for a sidebar badge.

**Tech Stack:** React 19, Supabase JS client v2, date-fns (already installed), HeroIcons 24/outline (already installed).

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| Supabase SQL editor | Manual migration | Create `lead_events`, add `last_activity_at`, create `settings` |
| `src/components/admin/LeadHistoryModal.jsx` | **Create** | Timeline modal — fetches and renders lead events |
| `src/pages/admin/Leads.jsx` | **Modify** | Event recording, stale detection, clock icon column, settings modal |
| `src/pages/admin/AdminLayout.jsx` | **Modify** | Stale lead count badge on sidebar |

---

## Task 1: Database migrations

**Files:**
- Supabase SQL editor (manual steps — no migration tooling in this project)

- [ ] **Step 1: Run migration SQL in the Supabase dashboard**

Open your Supabase project → SQL Editor → New query. Paste and run the following:

```sql
-- 1. New table: lead events (append-only audit log)
create table if not exists lead_events (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid not null references leads(id) on delete cascade,
  user_id      uuid references profiles(id) on delete set null,
  event_type   text not null check (event_type in ('status_change', 'assignment_change', 'note_added')),
  old_value    text,
  new_value    text,
  created_at   timestamptz not null default now()
);

create index if not exists lead_events_lead_id_created_at_idx
  on lead_events (lead_id, created_at desc);

-- RLS
alter table lead_events enable row level security;
create policy "authenticated can select lead_events"
  on lead_events for select using (auth.role() = 'authenticated');
create policy "authenticated can insert lead_events"
  on lead_events for insert with check (auth.role() = 'authenticated');

-- 2. New column on leads
alter table leads
  add column if not exists last_activity_at timestamptz;

-- 3. New settings table
create table if not exists settings (
  key        text primary key,
  value      text not null,
  updated_at timestamptz not null default now()
);

alter table settings enable row level security;
create policy "authenticated can select settings"
  on settings for select using (auth.role() = 'authenticated');
create policy "admin can update settings"
  on settings for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid() and profiles.role = 'admin'
    )
  );

-- Seed default threshold (idempotent)
insert into settings (key, value)
values ('follow_up_days', '3')
on conflict (key) do nothing;
```

- [ ] **Step 2: Verify tables exist**

In the Supabase Table Editor, confirm:
- `lead_events` table is visible with columns: id, lead_id, user_id, event_type, old_value, new_value, created_at
- `leads` table has a `last_activity_at` column
- `settings` table has one row: key=`follow_up_days`, value=`3`

---

## Task 2: Create `LeadHistoryModal` component

**Files:**
- Create: `src/components/admin/LeadHistoryModal.jsx`

- [ ] **Step 1: Create the file with the full component**

```jsx
// src/components/admin/LeadHistoryModal.jsx
import { useState, useEffect } from 'react'
import {
  XMarkIcon,
  ArrowRightIcon,
  UserIcon,
  DocumentTextIcon,
  ClockIcon,
} from '@heroicons/react/24/outline'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../../lib/supabase'

const EVENT_ICONS = {
  status_change:     ArrowRightIcon,
  assignment_change: UserIcon,
  note_added:        DocumentTextIcon,
}

const EVENT_LABELS = {
  status_change:     'Estado',
  assignment_change: 'Asignación',
  note_added:        'Nota',
}

export default function LeadHistoryModal({ leadId, leadNombre, onClose }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  async function fetchEvents() {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from('lead_events')
      .select('*, profiles!lead_events_user_id_fkey(nombre)')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })
    if (err) setError(err.message)
    else setEvents(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchEvents() }, [leadId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-gray-400" />
            <div>
              <p className="font-semibold text-gray-900 text-sm">Historial</p>
              <p className="text-xs text-gray-400">{leadNombre}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">

          {loading && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {error && !loading && (
            <div className="text-center py-8">
              <p className="text-sm text-red-500 mb-3">{error}</p>
              <button onClick={fetchEvents} className="text-sm text-blue-600 hover:underline">
                Reintentar
              </button>
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              Sin actividad registrada para este lead.
            </p>
          )}

          {!loading && !error && events.length > 0 && (
            <ol className="relative border-l border-gray-200 ml-2 space-y-5">
              {events.map(ev => {
                const Icon  = EVENT_ICONS[ev.event_type] ?? DocumentTextIcon
                const actor = ev.profiles?.nombre ?? 'Usuario eliminado'
                const time  = formatDistanceToNow(parseISO(ev.created_at), { locale: es, addSuffix: true })
                return (
                  <li key={ev.id} className="ml-5">
                    <span className="absolute -left-2.5 flex items-center justify-center w-5 h-5 bg-white border border-gray-200 rounded-full">
                      <Icon className="w-3 h-3 text-gray-500" />
                    </span>
                    <div className="bg-gray-50 rounded-lg px-3 py-2">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-semibold text-gray-700">{actor}</span>
                        <span className="text-xs text-gray-400">{time}</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        <span className="font-medium text-gray-600">
                          {EVENT_LABELS[ev.event_type]}:{' '}
                        </span>
                        {ev.event_type === 'note_added'
                          ? ev.new_value
                          : ev.old_value
                            ? `${ev.old_value} → ${ev.new_value}`
                            : ev.new_value}
                      </p>
                    </div>
                  </li>
                )
              })}
            </ol>
          )}

        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Build to catch syntax errors**

```bash
npm run build 2>&1 | tail -20
```

Expected: no errors from `LeadHistoryModal.jsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/LeadHistoryModal.jsx
git commit -m "feat(leads): add LeadHistoryModal timeline component"
```

---

## Task 3: Update `Leads.jsx` — imports, state, settings, event recording

**Files:**
- Modify: `src/pages/admin/Leads.jsx`

This task covers: new imports, new state variables, extended `useEffect` (settings fetch), and updated mutation functions (`updateStatus`, `updateAssignment`, `updateNotas`).

- [ ] **Step 1: Read the current file** to understand exact import lines and function signatures.

- [ ] **Step 2: Replace the import block at the top of the file**

Replace:
```js
import React, { useEffect, useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import { TrashIcon, MagnifyingGlassIcon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline'
```

With:
```js
import React, { useEffect, useState, useMemo } from 'react'
import toast from 'react-hot-toast'
import { format, parseISO, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../context/AuthContext'
import {
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  UserCircleIcon,
  ClockIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import LeadHistoryModal from '../../components/admin/LeadHistoryModal'
```

- [ ] **Step 3: Add new state variables** after the existing `const [assigneeFilter, setAssigneeFilter] = useState('')` line:

```js
const [threshold, setThreshold]       = useState(3)
const [settingsOpen, setSettingsOpen] = useState(false)
const [settingsDays, setSettingsDays] = useState(3)
const [historyLead, setHistoryLead]   = useState(null) // { id, nombre }
```

- [ ] **Step 4: Replace the `useEffect`** to also fetch settings:

Replace:
```js
useEffect(() => {
  Promise.all([
    supabase.from('leads').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, nombre, email, role').in('role', ['admin', 'seller']).order('nombre'),
  ]).then(([{ data: l }, { data: s }]) => {
    setLeads(l ?? [])
    setStaff(s ?? [])
    setLoading(false)
  })
}, [])
```

With:
```js
useEffect(() => {
  Promise.all([
    supabase.from('leads').select('*').order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, nombre, email, role').in('role', ['admin', 'seller']).order('nombre'),
    supabase.from('settings').select('value').eq('key', 'follow_up_days').single(),
  ]).then(([{ data: l }, { data: s }, { data: setting }]) => {
    setLeads(l ?? [])
    setStaff(s ?? [])
    const days = Number(setting?.value ?? 3)
    setThreshold(days)
    setSettingsDays(days)
    setLoading(false)
  })
}, [])
```

- [ ] **Step 5: Replace `updateStatus`**

Replace:
```js
async function updateStatus(id, status) {
  const { error } = await supabase.from('leads').update({ status }).eq('id', id)
  if (error) toast.error('Error al actualizar')
  else {
    toast.success('Estado actualizado')
    setLeads(l => l.map(x => x.id === id ? { ...x, status } : x))
  }
}
```

With:
```js
async function updateStatus(id, newStatus) {
  const lead = leads.find(x => x.id === id)
  const oldLabel = STATUS_OPTIONS.find(s => s.value === lead?.status)?.label ?? lead?.status
  const newLabel = STATUS_OPTIONS.find(s => s.value === newStatus)?.label ?? newStatus
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('leads')
    .update({ status: newStatus, last_activity_at: now })
    .eq('id', id)
  if (error) { toast.error('Error al actualizar'); return }
  toast.success('Estado actualizado')
  setLeads(l => l.map(x => x.id === id ? { ...x, status: newStatus, last_activity_at: now } : x))
  const { error: evErr } = await supabase.from('lead_events').insert({
    lead_id: id,
    user_id: profile.id,
    event_type: 'status_change',
    old_value: oldLabel,
    new_value: newLabel,
  })
  if (evErr) toast('El cambio se guardó pero no pudo registrarse en el historial.', { icon: '⚠️' })
}
```

- [ ] **Step 6: Replace `updateAssignment`**

Replace:
```js
async function updateAssignment(id, assigned_to) {
  const value = assigned_to === '' ? null : assigned_to
  const { error } = await supabase.from('leads').update({ assigned_to: value }).eq('id', id)
  if (error) toast.error('Error al asignar')
  else {
    toast.success(value ? 'Lead asignado' : 'Asignación removida')
    setLeads(l => l.map(x => x.id === id ? { ...x, assigned_to: value } : x))
  }
}
```

With:
```js
async function updateAssignment(id, assigned_to) {
  const value = assigned_to === '' ? null : assigned_to
  const lead = leads.find(x => x.id === id)
  const oldName = lead?.assigned_to
    ? (staffById[lead.assigned_to]?.nombre ?? 'Desconocido')
    : 'Sin asignar'
  const newName = value ? (staffById[value]?.nombre ?? 'Desconocido') : 'Sin asignar'
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('leads')
    .update({ assigned_to: value, last_activity_at: now })
    .eq('id', id)
  if (error) { toast.error('Error al asignar'); return }
  toast.success(value ? 'Lead asignado' : 'Asignación removida')
  setLeads(l => l.map(x => x.id === id ? { ...x, assigned_to: value, last_activity_at: now } : x))
  const { error: evErr } = await supabase.from('lead_events').insert({
    lead_id: id,
    user_id: profile.id,
    event_type: 'assignment_change',
    old_value: oldName,
    new_value: newName,
  })
  if (evErr) toast('El cambio se guardó pero no pudo registrarse en el historial.', { icon: '⚠️' })
}
```

**Important:** `updateAssignment` references `staffById`, which is defined after it via `useMemo`. This is fine — both are inside the component function and `staffById` is a closure variable captured at call time (not at definition time). No reordering needed.

- [ ] **Step 7: Replace `updateNotas`**

Replace:
```js
async function updateNotas(id, notas) {
  const { error } = await supabase.from('leads').update({ notas }).eq('id', id)
  if (error) toast.error('Error al guardar nota')
  else toast.success('Nota guardada')
}
```

With:
```js
async function updateNotas(id, notas) {
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('leads')
    .update({ notas, last_activity_at: now })
    .eq('id', id)
  if (error) { toast.error('Error al guardar nota'); return }
  toast.success('Nota guardada')
  setLeads(l => l.map(x => x.id === id ? { ...x, notas, last_activity_at: now } : x))
  const { error: evErr } = await supabase.from('lead_events').insert({
    lead_id: id,
    user_id: profile.id,
    event_type: 'note_added',
    old_value: null,
    new_value: notas,
  })
  if (evErr) toast('El cambio se guardó pero no pudo registrarse en el historial.', { icon: '⚠️' })
}
```

- [ ] **Step 8: Build to catch errors**

```bash
npm run build 2>&1 | tail -20
```

Expected: no errors from `Leads.jsx`.

- [ ] **Step 9: Commit**

```bash
git add src/pages/admin/Leads.jsx
git commit -m "feat(leads): record events and last_activity_at on status/assignment/note changes"
```

---

## Task 4: Update `Leads.jsx` — stale detection + UI

**Files:**
- Modify: `src/pages/admin/Leads.jsx`

This task adds: `staleLeadIds` useMemo, `saveThreshold` function, updated `colSpan`, header gear button, stale row styling, clock icon column, settings modal, and history modal rendering.

- [ ] **Step 1: Read the current `Leads.jsx`** to locate the `staffById` useMemo and the `colSpan` constant.

- [ ] **Step 2: Add `staleLeadIds` useMemo and `saveThreshold` function** immediately after the `staffById` useMemo:

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

async function saveThreshold(days) {
  const { error } = await supabase
    .from('settings')
    .upsert(
      { key: 'follow_up_days', value: String(days), updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
  if (error) { toast.error('Error al guardar configuración'); return }
  setThreshold(days)
  setSettingsOpen(false)
  toast.success('Umbral actualizado')
}
```

- [ ] **Step 3: Update `colSpan`**

Replace:
```js
const colSpan = canDelete ? 8 : 7
```

With:
```js
const colSpan = canDelete ? 9 : 8
```

- [ ] **Step 4: Replace the page header** to add the settings gear button for admins:

Replace:
```jsx
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {filtered.length} de {leads.length} lead{leads.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
```

With:
```jsx
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Leads</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {filtered.length} de {leads.length} lead{leads.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canDelete && (
          <button
            onClick={() => { setSettingsDays(threshold); setSettingsOpen(true) }}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
            title="Configurar recordatorios"
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </button>
        )}
      </div>
```

- [ ] **Step 5: Add a `<th>` for the clock icon column** in the table header.

In the `<thead>` section, find:
```jsx
                {canDelete && <th className="px-4 py-3" />}
```

Replace with:
```jsx
                <th className="px-4 py-3" />
                {canDelete && <th className="px-4 py-3" />}
```

- [ ] **Step 6: Update the row `<tr>` to apply stale background**

Replace:
```jsx
                  <tr
                    onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
                    className="hover:bg-gray-50 cursor-pointer transition"
                  >
```

With:
```jsx
                  <tr
                    onClick={() => setExpanded(expanded === lead.id ? null : lead.id)}
                    className={`cursor-pointer transition ${staleLeadIds.has(lead.id) ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-gray-50'}`}
                  >
```

- [ ] **Step 7: Add "Sin actividad" badge in the Nombre cell**

Replace:
```jsx
                    <td className="px-4 py-3 font-medium text-gray-900">{lead.nombre}</td>
```

With:
```jsx
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">{lead.nombre}</span>
                      {staleLeadIds.has(lead.id) && (
                        <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                          Sin actividad
                        </span>
                      )}
                    </td>
```

- [ ] **Step 8: Add the clock icon column** in each data row, before the delete column.

Find:
```jsx
                    {canDelete && (
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => deleteLead(lead.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    )}
```

Replace with:
```jsx
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => setHistoryLead({ id: lead.id, nombre: lead.nombre })}
                        className="p-1.5 text-gray-300 hover:text-blue-500 transition"
                        title="Ver historial"
                      >
                        <ClockIcon className="w-4 h-4" />
                      </button>
                    </td>
                    {canDelete && (
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <button onClick={() => deleteLead(lead.id)} className="p-1.5 text-gray-300 hover:text-red-500 transition">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </td>
                    )}
```

- [ ] **Step 9: Add modals at the bottom of the JSX** — just before the closing `</div>` of the outermost `<div className="p-6">`:

```jsx
      {/* Settings modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Recordatorios de seguimiento</h2>
            <label className="block text-sm text-gray-600 mb-2">
              Días sin actividad para marcar un lead como pendiente
            </label>
            <input
              type="number"
              min={1}
              max={30}
              value={settingsDays}
              onChange={e => setSettingsDays(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => saveThreshold(settingsDays)}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History modal */}
      {historyLead && (
        <LeadHistoryModal
          leadId={historyLead.id}
          leadNombre={historyLead.nombre}
          onClose={() => setHistoryLead(null)}
        />
      )}
```

- [ ] **Step 10: Build to catch errors**

```bash
npm run build 2>&1 | tail -20
```

Expected: no errors from `Leads.jsx`.

- [ ] **Step 11: Commit**

```bash
git add src/pages/admin/Leads.jsx
git commit -m "feat(leads): stale detection, clock icon, settings modal, history modal trigger"
```

---

## Task 5: Update `AdminLayout.jsx` — sidebar badge

**Files:**
- Modify: `src/pages/admin/AdminLayout.jsx`

- [ ] **Step 1: Read the current `AdminLayout.jsx`** to understand the import block and the `SidebarContent` component.

- [ ] **Step 2: Add new imports** — extend the existing React import and add supabase + date-fns:

Replace:
```js
import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
```

With:
```js
import { useState, useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { subDays } from 'date-fns'
```

- [ ] **Step 3: Add `staleCount` state and fetch effect** — add inside the `AdminLayout` function body, after the existing `const [open, setOpen] = useState(false)` line:

```js
  const [staleCount, setStaleCount] = useState(0)
  const location = useLocation()

  useEffect(() => {
    async function fetchStaleCount() {
      const { data: setting } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'follow_up_days')
        .single()
      const days = Number(setting?.value ?? 3)
      const cutoff = subDays(new Date(), days).toISOString()
      // Use .or() so pre-migration leads with null last_activity_at fall back to created_at
      const { count } = await supabase
        .from('leads')
        .select('id', { count: 'exact', head: true })
        .or(`last_activity_at.lt.${cutoff},and(last_activity_at.is.null,created_at.lt.${cutoff})`)
      setStaleCount(count ?? 0)
    }
    fetchStaleCount()
  }, [location.pathname])
```

- [ ] **Step 4: Fix `SidebarContent` — prevent remount and expose `staleCount`**

`SidebarContent` is currently defined as an arrow function component _inside_ `AdminLayout`. Because it is redefined on every render, React unmounts and remounts the sidebar on every state change (including `staleCount` updates), causing visible flicker. Fix this by calling `SidebarContent` as a plain function instead of rendering it as a JSX component.

First, find the two `<SidebarContent />` usages in the return statement and replace both with `{SidebarContent()}`:

Replace (desktop sidebar):
```jsx
      <aside className="hidden lg:flex lg:flex-col w-60 bg-white border-r border-gray-200 shrink-0">
        <SidebarContent />
      </aside>
```
With:
```jsx
      <aside className="hidden lg:flex lg:flex-col w-60 bg-white border-r border-gray-200 shrink-0">
        {SidebarContent()}
      </aside>
```

Replace (mobile drawer):
```jsx
        <SidebarContent />
      </aside>
```
With:
```jsx
        {SidebarContent()}
      </aside>
```

Then add the badge to the nav items loop inside `SidebarContent`. Replace:
```jsx
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={linkClass} onClick={() => setOpen(false)}>
            <Icon className="w-5 h-5 shrink-0" />
            {label}
          </NavLink>
        ))}
```

With:
```jsx
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={linkClass} onClick={() => setOpen(false)}>
            <Icon className="w-5 h-5 shrink-0" />
            <span className="flex-1">{label}</span>
            {to === '/admin/leads' && staleCount > 0 && (
              <span className="ml-auto text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full font-semibold leading-none">
                {staleCount}
              </span>
            )}
          </NavLink>
        ))}
```

- [ ] **Step 5: Build to catch errors**

```bash
npm run build 2>&1 | tail -20
```

Expected: no errors.

- [ ] **Step 6: Commit all changes**

```bash
git add src/pages/admin/AdminLayout.jsx
git commit -m "feat(layout): add stale lead count badge to sidebar Leads link"
```

- [ ] **Step 7: Push**

```bash
git push
```

- [ ] **Step 8: Manual verification**

Run `npm run dev`, open `/admin/leads`:

- [ ] Change a lead's status → clock icon becomes clickable → modal shows the event with actor name and relative time
- [ ] Change assignment → event appears in the modal
- [ ] Blur a notes textarea with new text → note event appears in the modal
- [ ] Gear icon visible for admin in the header → modal opens with numeric input → saving updates the threshold and immediately recalculates stale rows
- [ ] Leads older than the threshold show amber background and "Sin actividad" badge
- [ ] Sidebar "Leads" link shows a red badge with the stale count
