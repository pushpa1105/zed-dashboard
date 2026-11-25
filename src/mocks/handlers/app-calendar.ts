import { http, HttpResponse, type HttpHandler } from 'msw';

import { env } from '@/core/config/env';

import { uid } from '../db';
import { errorResponse, networkDelay, requireAuth } from '../utils';

/**
 * Mock API for the calendar app. Events are seeded relative to the current
 * week so the calendar always looks lived-in; changes stay in memory.
 */

type Repeat = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly';
type DbEvent = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  calendarId: 'work' | 'team' | 'personal' | 'travel' | 'holidays';
  location: string;
  guests: string[];
  repeat: Repeat;
  description: string;
};

const API = `${env.API_URL}/calendar`;

/** Monday 00:00 of the current week, local time. */
function weekStart() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  return d;
}

/** A date `day` days after this Monday at hh:mm (local). */
function at(day: number, hh: number, mm = 0) {
  const d = weekStart();
  d.setDate(d.getDate() + day);
  d.setHours(hh, mm, 0, 0);
  return d.toISOString();
}

function fourthThursdayOfNovember(year: number) {
  const d = new Date(year, 10, 1);
  const first = (11 - d.getDay()) % 7; // days to first Thursday
  return new Date(year, 10, 1 + first + 21);
}

function allDay(date: Date, days = 1) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + days);
  return { start: start.toISOString(), end: end.toISOString() };
}

function seed(): DbEvent[] {
  const year = new Date().getFullYear();
  const base = { location: '', guests: [] as string[], description: '', allDay: false };
  const lisbon = weekStart();
  lisbon.setDate(lisbon.getDate() + 9); // next Wednesday

  return [
    {
      ...base,
      id: 'ev-standup',
      title: 'Product standup',
      start: at(-14, 9, 30),
      end: at(-14, 9, 45),
      calendarId: 'team',
      repeat: 'weekdays',
      location: 'Huddle room 2 / Meet',
      guests: ['marta@orbitly.io', 'jonas@orbitly.io', 'aiko@orbitly.io'],
    },
    {
      ...base,
      id: 'ev-design-review',
      title: 'Design review: checkout flow',
      start: at(-6, 14),
      end: at(-6, 15),
      calendarId: 'work',
      repeat: 'weekly',
      location: 'Studio',
      guests: ['ines@orbitly.io', 'tomas@orbitly.io'],
      description: 'Walk through the new address step and the saved-cards variant.',
    },
    {
      ...base,
      id: 'ev-1on1',
      title: '1:1 with Marta',
      start: at(-4, 11),
      end: at(-4, 11, 30),
      calendarId: 'work',
      repeat: 'weekly',
      guests: ['marta@orbitly.io'],
    },
    {
      ...base,
      id: 'ev-roadmap',
      title: 'Q1 roadmap planning',
      start: at(2, 10),
      end: at(2, 12),
      calendarId: 'work',
      repeat: 'none',
      location: 'Boardroom',
      guests: ['ceo@orbitly.io', 'marta@orbitly.io', 'samuel@orbitly.io'],
      description: 'Agree the three bets for Q1. Bring one slide each.',
    },
    {
      ...base,
      id: 'ev-hiring',
      title: 'Hiring sync',
      start: at(2, 11),
      end: at(2, 11, 45),
      calendarId: 'team',
      repeat: 'none',
      guests: ['people@orbitly.io'],
    },
    {
      ...base,
      id: 'ev-focus',
      title: 'Focus: pricing page copy',
      start: at(0, 13),
      end: at(0, 16),
      calendarId: 'work',
      repeat: 'none',
    },
    {
      ...base,
      id: 'ev-customer',
      title: 'Customer call · Fieldwork',
      start: at(0, 15),
      end: at(0, 15, 45),
      calendarId: 'work',
      repeat: 'none',
      location: 'Zoom',
      guests: ['ops@fieldwork.com'],
    },
    {
      ...base,
      id: 'ev-retro',
      title: 'Sprint retro',
      start: at(-3, 15, 30),
      end: at(-3, 16, 30),
      calendarId: 'team',
      repeat: 'weekly',
    },
    {
      ...base,
      id: 'ev-lunch',
      title: 'Team lunch',
      start: at(4, 12, 30),
      end: at(4, 13, 30),
      calendarId: 'team',
      repeat: 'none',
      location: 'Café Lisboa, Westerstraat',
    },
    {
      ...base,
      id: 'ev-allhands',
      title: 'All-hands',
      start: at(-25, 17),
      end: at(-25, 18),
      calendarId: 'team',
      repeat: 'monthly',
      location: 'Main floor + stream',
    },
    {
      ...base,
      id: 'ev-gym',
      title: 'Gym',
      start: at(-7, 7),
      end: at(-7, 8),
      calendarId: 'personal',
      repeat: 'weekly',
    },
    {
      ...base,
      id: 'ev-gym-2',
      title: 'Gym',
      start: at(-5, 7),
      end: at(-5, 8),
      calendarId: 'personal',
      repeat: 'weekly',
    },
    {
      ...base,
      id: 'ev-dentist',
      title: 'Dentist',
      start: at(8, 8, 30),
      end: at(8, 9, 15),
      calendarId: 'personal',
      repeat: 'none',
      location: 'Tandartspraktijk Jordaan',
    },
    {
      ...base,
      id: 'ev-flight',
      title: 'Flight TP 663 · AMS → LIS',
      start: at(9, 7, 10),
      end: at(9, 9, 35),
      calendarId: 'travel',
      repeat: 'none',
      location: 'Schiphol, Departures 2',
    },
    {
      ...base,
      ...allDay(lisbon, 3),
      id: 'ev-offsite',
      title: 'Lisbon offsite',
      allDay: true,
      calendarId: 'travel',
      repeat: 'none',
      location: 'LX Factory, Lisbon',
      description: 'Strategy days with the leadership team.',
    },
    {
      ...base,
      id: 'ev-board',
      title: 'Board prep',
      start: at(-9, 9),
      end: at(-9, 11),
      calendarId: 'work',
      repeat: 'none',
    },
    {
      ...base,
      id: 'ev-launch',
      title: 'Launch: scheduled reports',
      start: at(11, 16),
      end: at(11, 17),
      calendarId: 'work',
      repeat: 'none',
      description: 'Go/no-go, then ship. Comms are queued.',
    },
    {
      ...base,
      ...allDay(fourthThursdayOfNovember(year)),
      id: 'ev-thanksgiving',
      title: 'Thanksgiving (US office closed)',
      allDay: true,
      calendarId: 'holidays',
      repeat: 'none',
    },
    {
      ...base,
      ...allDay(new Date(year, 11, 25), 2),
      id: 'ev-christmas',
      title: 'Christmas holidays',
      allDay: true,
      calendarId: 'holidays',
      repeat: 'none',
    },
    {
      ...base,
      ...allDay(new Date(year + 1, 0, 1)),
      id: 'ev-newyear',
      title: "New Year's Day",
      allDay: true,
      calendarId: 'holidays',
      repeat: 'none',
    },
  ];
}

// Persisted per browser tab so a reload keeps your edits; tests start fresh.
const STORAGE_KEY = 'zed-dashboard:mock-calendar';
const canPersist = typeof sessionStorage !== 'undefined' && import.meta.env.MODE !== 'test';
let events: DbEvent[] | null = null;
function store(): DbEvent[] {
  if (events) return events;
  try {
    const saved = canPersist ? sessionStorage.getItem(STORAGE_KEY) : null;
    events = saved ? (JSON.parse(saved) as DbEvent[]) : seed();
  } catch {
    events = seed();
  }
  return events;
}
const persist = () => {
  if (canPersist && events) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(events));
};

type EventBody = Omit<DbEvent, 'id'>;

function validate(body: Partial<EventBody>) {
  if (body.title !== undefined && !body.title.trim()) return 'A title is required';
  if (body.start && body.end && new Date(body.end) <= new Date(body.start)) {
    return 'The event must end after it starts';
  }
  return null;
}

export const appCalendarHandlers: HttpHandler[] = [
  http.get(`${API}/events`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    return HttpResponse.json(store());
  }),

  http.post<never, EventBody>(`${API}/events`, async ({ request }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    const body = await request.json();
    const problem = validate(body);
    if (problem) return errorResponse(problem, 422);
    const event: DbEvent = { ...body, id: `ev-${uid()}` };
    events = [...store(), event];
    persist();
    return HttpResponse.json(event);
  }),

  http.patch<{ id: string }, Partial<EventBody>>(
    `${API}/events/:id`,
    async ({ request, params }) => {
      await networkDelay();
      const auth = requireAuth(request);
      if ('error' in auth) return auth.error;
      const existing = store().find((e) => e.id === params.id);
      if (!existing) return errorResponse('Event not found', 404);
      const body = await request.json();
      const next = { ...existing, ...body };
      const problem = validate(next);
      if (problem) return errorResponse(problem, 422);
      events = store().map((e) => (e.id === existing.id ? next : e));
      persist();
      return HttpResponse.json(next);
    },
  ),

  http.delete<{ id: string }>(`${API}/events/:id`, async ({ request, params }) => {
    await networkDelay();
    const auth = requireAuth(request);
    if ('error' in auth) return auth.error;
    events = store().filter((e) => e.id !== params.id);
    persist();
    return new HttpResponse(null, { status: 204 });
  }),
];
