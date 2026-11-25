import { z } from 'zod';

export const TICKET_STATUSES = ['open', 'pending', 'resolved'] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];
export const TICKET_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const ticketSchema = z.object({
  id: z.string(),
  subject: z.string(),
  customer: z.object({ name: z.string(), email: z.string(), company: z.string() }),
  priority: z.enum(TICKET_PRIORITIES),
  status: z.enum(TICKET_STATUSES),
  channel: z.enum(['email', 'chat', 'api']),
  assignee: z.string().nullable(),
  createdAt: z.number(),
  slaDueAt: z.number(),
  messages: z.array(
    z.object({
      id: z.string(),
      author: z.string(),
      fromCustomer: z.boolean(),
      body: z.string(),
      at: z.number(),
    }),
  ),
});
export type Ticket = z.infer<typeof ticketSchema>;

/** Filter and select value for tickets without an assignee. */
export const UNASSIGNED = 'unassigned';
/** Tickets this close to their SLA deadline are flagged as due soon. */
export const SLA_WARNING_MS = 3_600_000;

export const isOverdue = (ticket: Ticket, now = Date.now()) =>
  ticket.status !== 'resolved' && ticket.slaDueAt < now;

export const supportSchema = z.object({
  agents: z.array(z.string()),
  tickets: z.array(ticketSchema),
});

export const replySchema = z.object({ body: z.string().trim().min(2).max(4000) });
export type Reply = z.infer<typeof replySchema>;

export type TicketPatch = { id: string; status?: TicketStatus; assignee?: string | null };
