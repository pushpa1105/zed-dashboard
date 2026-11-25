import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, RotateCcw, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { FormField } from '@/core/forms/form-field';
import { useTranslation } from '@/core/i18n/use-translation';
import { DescriptionList } from '@/shared/components/display/description-list';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { cn } from '@/shared/lib/cn';
import { formatDate } from '@/shared/lib/format';
import { Button } from '@/shared/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { Textarea } from '@/shared/ui/textarea';

import { useReplyTicket, useUpdateTicket } from '../api/support-api';
import { replySchema, UNASSIGNED, type Reply, type Ticket } from '../model/support';

import { FilterSelect } from './filter-select';
import { PriorityTag, SlaTimer, TicketStatusBadge } from './ticket-badges';

function Thread({ messages }: { messages: Ticket['messages'] }) {
  return (
    <ol className="space-y-4">
      {messages.map((m) => (
        <li key={m.id} className={cn('flex gap-3', !m.fromCustomer && 'flex-row-reverse')}>
          <InitialsAvatar name={m.author} size="sm" />
          <div
            className={cn(
              'max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm',
              m.fromCustomer ? 'bg-muted' : 'bg-primary/10',
            )}
          >
            <p className="mb-1 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{m.author}</span> ·{' '}
              {formatDate(m.at, 'MMM D HH:mm')}
            </p>
            <p className="whitespace-pre-line">{m.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function TicketDetail({ ticket, agents }: { ticket: Ticket; agents: string[] }) {
  const { t } = useTranslation('saas');
  const reply = useReplyTicket();
  const update = useUpdateTicket();
  const form = useForm<Reply>({ resolver: zodResolver(replySchema), defaultValues: { body: '' } });
  const resolved = ticket.status === 'resolved';

  return (
    <>
      <SheetHeader>
        <SheetTitle>{ticket.subject}</SheetTitle>
        <SheetDescription>
          {ticket.id} · {t(`support.channel.${ticket.channel}`)} ·{' '}
          {formatDate(ticket.createdAt, 'MMM D, HH:mm')}
        </SheetDescription>
      </SheetHeader>
      <div className="space-y-6 px-4 pb-6">
        <DescriptionList
          items={[
            {
              key: 'customer',
              term: t('support.col.customer'),
              detail: `${ticket.customer.name} (${ticket.customer.email})`,
            },
            {
              key: 'state',
              term: t('support.col.status'),
              detail: (
                <span className="flex flex-wrap gap-2">
                  <TicketStatusBadge status={ticket.status} />
                  <PriorityTag priority={ticket.priority} />
                  <SlaTimer ticket={ticket} />
                </span>
              ),
            },
            {
              key: 'assignee',
              term: t('support.col.assignee'),
              detail: (
                <FilterSelect
                  label={t('support.col.assignee')}
                  value={ticket.assignee ?? UNASSIGNED}
                  onChange={(v) =>
                    update.mutate({ id: ticket.id, assignee: v === UNASSIGNED ? null : v })
                  }
                  options={[
                    { value: UNASSIGNED, label: t('support.unassigned') },
                    ...agents.map((a) => ({ value: a, label: a })),
                  ]}
                />
              ),
            },
          ]}
        />

        <Thread messages={ticket.messages} />

        <form
          noValidate
          className="space-y-3"
          onSubmit={form.handleSubmit(({ body }) =>
            reply.mutate({ id: ticket.id, body }, { onSuccess: () => form.reset() }),
          )}
        >
          <FormField
            control={form.control}
            name="body"
            label={t('support.reply')}
            render={({ field, id, invalid }) => (
              <Textarea
                id={id}
                aria-invalid={invalid}
                rows={4}
                placeholder={t('support.replyPlaceholder', { name: ticket.customer.name })}
                {...field}
              />
            )}
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={update.isPending}
              onClick={() =>
                update.mutate({ id: ticket.id, status: resolved ? 'open' : 'resolved' })
              }
            >
              {resolved ? <RotateCcw /> : <CheckCircle2 />}
              {t(resolved ? 'support.reopen' : 'support.resolve')}
            </Button>
            <Button type="submit" disabled={reply.isPending}>
              <Send /> {t('support.send')}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}

export function TicketSheet({
  ticket,
  agents,
  onClose,
}: {
  ticket: Ticket | null;
  agents: string[];
  onClose: () => void;
}) {
  return (
    <Sheet open={!!ticket} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        {ticket && <TicketDetail key={ticket.id} ticket={ticket} agents={agents} />}
      </SheetContent>
    </Sheet>
  );
}
