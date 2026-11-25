import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';

import {
  conversationSchema,
  messageSchema,
  threadSchema,
  type Attachment,
  type Thread,
} from '../model/chat';

export const chatKeys = {
  all: ['chat'] as const,
  conversations: () => [...chatKeys.all, 'conversations'] as const,
  thread: (id: string) => [...chatKeys.all, 'thread', id] as const,
};

export const chatApi = {
  conversations: () => api.get('/chat/conversations', z.array(conversationSchema)),
  thread: (id: string) => api.get(`/chat/conversations/${id}`, threadSchema),
  send: ({
    conversationId,
    ...input
  }: {
    conversationId: string;
    body: string;
    replyToId: string | null;
    attachments: Attachment[];
  }) => api.post(`/chat/conversations/${conversationId}/messages`, input, messageSchema),
  update: ({ id, ...input }: { id: string; pinned?: boolean; muted?: boolean }) =>
    api.patch(`/chat/conversations/${id}`, input, conversationSchema),
  react: ({ messageId, label }: { messageId: string; label: string }) =>
    api.post(`/chat/messages/${messageId}/reactions`, { label }),
};

export const conversationsQuery = () =>
  queryOptions({
    queryKey: chatKeys.conversations(),
    queryFn: chatApi.conversations,
    // Keeps unread counts and "typing…" fresh in the list.
    refetchInterval: 4000,
  });

export const threadQuery = (id: string) =>
  queryOptions({
    queryKey: chatKeys.thread(id),
    queryFn: () => chatApi.thread(id),
    // Polls so simulated replies and typing indicators arrive on their own.
    refetchInterval: 1500,
  });

export const useConversations = () => useQuery(conversationsQuery());
export const useThread = (id: string | null) =>
  useQuery({ ...threadQuery(id ?? ''), enabled: !!id });

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.send,
    onSuccess: (message) => {
      // Append immediately instead of waiting for the next poll.
      queryClient.setQueryData<Thread>(chatKeys.thread(message.conversationId), (thread) =>
        thread ? { ...thread, messages: [...thread.messages, message] } : thread,
      );
      void queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
    },
  });
}

export function useUpdateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.update,
    onSuccess: (conversation) => {
      void queryClient.invalidateQueries({ queryKey: chatKeys.conversations() });
      void queryClient.invalidateQueries({ queryKey: chatKeys.thread(conversation.id) });
    },
  });
}

export function useReact(conversationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: chatApi.react,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: chatKeys.thread(conversationId) }),
  });
}
