import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import type { Card, Label, Member } from '../model/kanban';

import { CardFace } from './card-face';

/** A card that can be dragged (mouse, touch or keyboard) and clicked to open. */
export function SortableCard({
  card,
  members,
  labels,
  onOpen,
}: {
  card: Card;
  members: Member[];
  labels: Label[];
  onOpen: (card: Card) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(card)}
      onKeyDown={(e) => {
        listeners?.onKeyDown?.(e);
        if (e.key === 'Enter' && !isDragging) onOpen(card);
      }}
      className="cursor-grab list-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
    >
      <CardFace card={card} members={members} labels={labels} dragging={isDragging} />
    </li>
  );
}
