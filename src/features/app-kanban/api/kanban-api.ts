import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';

import {
  boardSchema,
  workspaceSchema,
  type Board,
  type CardPatch,
  type MoveInput,
} from '../model/kanban';

export const kanbanApi = {
  workspace: () => api.get('/kanban/workspace', workspaceSchema),
  board: (id: string) => api.get(`/kanban/boards/${id}`, boardSchema),
  addColumn: ({
    boardId,
    title,
    wipLimit,
  }: {
    boardId: string;
    title: string;
    wipLimit: number | null;
  }) => api.post(`/kanban/boards/${boardId}/columns`, { title, wipLimit }, boardSchema),
  updateColumn: ({
    columnId,
    ...patch
  }: {
    columnId: string;
    title?: string;
    wipLimit?: number | null;
  }) => api.patch(`/kanban/columns/${columnId}`, patch, boardSchema),
  addCard: ({ boardId, columnId, title }: { boardId: string; columnId: string; title: string }) =>
    api.post(`/kanban/boards/${boardId}/cards`, { columnId, title }, boardSchema),
  updateCard: ({ cardId, patch }: { cardId: string; patch: CardPatch }) =>
    api.patch(`/kanban/cards/${cardId}`, patch, boardSchema),
  move: ({ cardId, ...body }: MoveInput) =>
    api.post(`/kanban/cards/${cardId}/move`, body, boardSchema),
  comment: ({ cardId, text }: { cardId: string; text: string }) =>
    api.post(`/kanban/cards/${cardId}/comments`, { text }, boardSchema),
};

export const kanbanKeys = {
  all: ['app-kanban'] as const,
  workspace: () => [...kanbanKeys.all, 'workspace'] as const,
  board: (id: string) => [...kanbanKeys.all, 'board', id] as const,
};

export const workspaceQuery = () =>
  queryOptions({ queryKey: kanbanKeys.workspace(), queryFn: kanbanApi.workspace });
export const boardQuery = (id: string) =>
  queryOptions({ queryKey: kanbanKeys.board(id), queryFn: () => kanbanApi.board(id) });

export const useKanbanWorkspace = () => useQuery(workspaceQuery());
export const useBoard = (id: string | undefined) =>
  useQuery({ ...boardQuery(id ?? ''), enabled: !!id });

/** Applies a move to a board snapshot (used for the optimistic update). */
export function applyMove(board: Board, input: MoveInput): Board {
  const card = board.cards.find((c) => c.id === input.cardId);
  if (!card) return board;
  const moved = {
    ...card,
    columnId: input.columnId,
    assigneeIds: input.assigneeIds ?? card.assigneeIds,
  };
  const rest = board.cards.filter((c) => c.id !== card.id);
  const at = input.beforeId ? rest.findIndex((c) => c.id === input.beforeId) : -1;
  if (at >= 0) rest.splice(at, 0, moved);
  else rest.push(moved);
  return { ...board, cards: rest };
}

/**
 * Every write returns the whole board, so the cache is replaced with the
 * server's version (no refetch). Moves are applied optimistically.
 */
function useBoardWrite<TVars>(
  boardId: string,
  fn: (vars: TVars) => Promise<Board>,
  options: { success?: string; optimistic?: (board: Board, vars: TVars) => Board } = {},
) {
  const queryClient = useQueryClient();
  const key = kanbanKeys.board(boardId);
  return useMutation({
    mutationFn: fn,
    meta: { successMessage: options.success, invalidates: [kanbanKeys.workspace()] },
    onMutate: async (vars: TVars) => {
      if (!options.optimistic) return { previous: undefined };
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Board>(key);
      if (previous) queryClient.setQueryData(key, options.optimistic(previous, vars));
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(key, context.previous);
    },
    onSuccess: (board) => queryClient.setQueryData(key, board),
  });
}

export function useKanbanMutations(boardId: string) {
  const { t } = useTranslation('app-kanban');
  return {
    move: useBoardWrite(boardId, kanbanApi.move, { optimistic: applyMove }),
    addCard: useBoardWrite(boardId, kanbanApi.addCard, { success: t('toast.cardAdded') }),
    addColumn: useBoardWrite(boardId, kanbanApi.addColumn, { success: t('toast.columnAdded') }),
    updateColumn: useBoardWrite(boardId, kanbanApi.updateColumn),
    updateCard: useBoardWrite(boardId, kanbanApi.updateCard, {
      optimistic: (board, { cardId, patch }) => ({
        ...board,
        cards: board.cards.map((c) => (c.id === cardId ? { ...c, ...patch } : c)),
      }),
    }),
    comment: useBoardWrite(boardId, kanbanApi.comment),
  };
}
