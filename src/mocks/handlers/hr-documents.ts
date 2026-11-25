import { http, HttpResponse, type HttpHandler } from 'msw';

import { errorResponse } from '../utils';

import { DAY, guard, isoDate, rng, startOfToday, url, type Staff } from './hr-shared';

type Category =
  | 'conduct'
  | 'security'
  | 'privacy'
  | 'workplace'
  | 'safety'
  | 'expenses'
  | 'contract'
  | 'nda'
  | 'equity';

/** Title, kind, category, versions, share of staff it applies to. */
const DOCUMENTS: Array<[string, 'policy' | 'employee', Category, number, number]> = [
  ['Code of Conduct', 'policy', 'conduct', 4, 1],
  ['Information Security Policy', 'policy', 'security', 6, 1],
  ['Data Protection & Privacy Policy', 'policy', 'privacy', 3, 1],
  ['Remote & Hybrid Work Policy', 'policy', 'workplace', 2, 1],
  ['Health & Safety Handbook', 'policy', 'safety', 5, 1],
  ['Travel & Expense Policy', 'policy', 'expenses', 3, 1],
  ['Employment Contract Addendum 2027', 'employee', 'contract', 1, 1],
  ['Confidentiality Agreement', 'employee', 'nda', 2, 0.4],
  ['Equity Grant Agreement', 'employee', 'equity', 1, 0.25],
];

const CHANGE_NOTES = [
  'Initial release',
  'Clarified scope and who it applies to',
  'Updated contacts and escalation paths',
  'Aligned wording with the new employee handbook',
  'Added section on AI tools and customer data',
  'Annual legal review, no material changes',
];

type Acknowledgement = {
  personId: string;
  name: string;
  department: string;
  signedAt: string | null;
  remindedAt: string | null;
};

export function hrDocumentHandlers(staff: readonly Staff[]): HttpHandler[] {
  const r = rng(5150);
  const today = startOfToday();
  const owners = staff.filter((p) => p.department === 'People');

  const documents = DOCUMENTS.map(([title, kind, category, versionCount, reach], i) => {
    const updated = today - Math.round(10 + r() * 80) * DAY;
    const gap = Math.round(120 + r() * 120) * DAY;
    const versions = Array.from({ length: versionCount }, (_, v) => ({
      version: `${v + 1}.${v ? Math.floor(r() * 3) : 0}`,
      date: isoDate(updated - (versionCount - 1 - v) * gap),
      author: owners[Math.floor(r() * owners.length)]!.name,
      note: CHANGE_NOTES[v ? 1 + Math.floor(r() * (CHANGE_NOTES.length - 1)) : 0]!,
    })).reverse();
    const signRate = 0.55 + r() * 0.4;
    const acknowledgements: Acknowledgement[] = staff
      .filter(() => reach === 1 || r() < reach)
      .map((p) => ({
        personId: p.id,
        name: p.name,
        department: p.department,
        signedAt: r() < signRate ? isoDate(updated + Math.floor(r() * 9) * DAY) : null,
        remindedAt: null,
      }));
    return {
      id: `doc-${i + 1}`,
      title,
      kind,
      category,
      owner: versions[0]!.author,
      version: versions[0]!.version,
      updatedAt: versions[0]!.date,
      dueDate: isoDate(updated + 30 * DAY),
      versions,
      acknowledgements,
    };
  });

  return [
    http.get(url('/documents'), async ({ request }) => {
      const denied = await guard(request);
      if (denied) return denied;
      return HttpResponse.json(documents);
    }),

    http.post<{ id: string }>(url('/documents/:id/remind'), async ({ request, params }) => {
      const denied = await guard(request);
      if (denied) return denied;
      const doc = documents.find((d) => d.id === params.id);
      if (!doc) return errorResponse('Document not found', 404);
      const pending = doc.acknowledgements.filter((a) => !a.signedAt);
      for (const ack of pending) ack.remindedAt = isoDate(startOfToday());
      return HttpResponse.json({ reminded: pending.length });
    }),
  ];
}
