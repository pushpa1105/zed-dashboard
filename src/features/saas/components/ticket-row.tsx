import { useTranslation } from '@/core/i18n/use-translation';
import { InitialsAvatar } from '@/shared/components/display/initials-avatar';
import { formatRelative } from '@/shared/lib/format';
import { TableCell, TableRow } from '@/shared/ui/table';

import type { Ticket } from '../model/support';

import { PriorityTag, SlaTimer, TicketStatusBadge } from './ticket-badges';

export function TicketRow({ ticket, onOpen }: { ticket: Ticket; onOpen: () => void }) {
  const { t } = useTranslation('saas');
  return (
    <TableRow
      tabIndex={0}
      className="cursor-pointer"
      aria-label={t('support.open', { subject: ticket.subject })}
      onClick={onOpen}
      onKeyDown={(k) => k.key === 'Enter' && onOpen()}
    >
      <TableCell className="max-w-80 pl-6">
        <p className="truncate font-medium">{ticket.subject}</p>
        <p className="text-xs text-muted-foreground">
          {ticket.id} · {ticket.customer.company}
        </p>
      </TableCell>
      <TableCell>
        <PriorityTag priority={ticket.priority} />
      </TableCell>
      <TableCell className="hidden md:table-cell">
        <TicketStatusBadge status={ticket.status} />
      </TableCell>
      <TableCell>
        <SlaTimer ticket={ticket} />
      </TableCell>
      <TableCell className="hidden lg:table-cell">
        {ticket.assignee ? (
          <span className="flex items-center gap-2 whitespace-nowrap">
            <InitialsAvatar name={ticket.assignee} size="xs" />
            {ticket.assignee}
          </span>
        ) : (
          <span className="text-muted-foreground">{t('support.unassigned')}</span>
        )}
      </TableCell>
      <TableCell className="hidden pr-6 whitespace-nowrap text-muted-foreground xl:table-cell">
        {formatRelative(ticket.messages.at(-1)!.at)}
      </TableCell>
    </TableRow>
  );
}
