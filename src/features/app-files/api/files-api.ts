import { keepPreviousData, queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';

import {
  fileItemSchema,
  folderNodeSchema,
  listingSchema,
  storageSchema,
  type Scope,
  type SortKey,
} from '../model/files';

export type ListParams = { parent: string; scope: Scope; q: string; sort: SortKey };

export const filesKeys = {
  all: ['files'] as const,
  list: (p: ListParams) => [...filesKeys.all, 'list', p] as const,
  tree: () => [...filesKeys.all, 'tree'] as const,
  storage: () => [...filesKeys.all, 'storage'] as const,
};

export const filesApi = {
  list: (p: ListParams) => api.get('/files', listingSchema, { params: p }),
  tree: () => api.get('/files/tree', z.array(folderNodeSchema)),
  storage: () => api.get('/files/storage', storageSchema),
  createFolder: (input: { name: string; parentId: string }) =>
    api.post('/files/folders', input, fileItemSchema),
  upload: (input: { parentId: string; files: Array<{ name: string; size: number }> }) =>
    api.post('/files/upload', input, z.array(fileItemSchema)),
  update: ({ id, ...input }: { id: string; name?: string; starred?: boolean }) =>
    api.patch(`/files/${id}`, input, fileItemSchema),
  remove: (ids: string[]) => api.post('/files/delete', { ids }),
};

export const listQuery = (p: ListParams) =>
  queryOptions({
    queryKey: filesKeys.list(p),
    queryFn: () => filesApi.list(p),
    placeholderData: keepPreviousData,
  });
export const treeQuery = () => queryOptions({ queryKey: filesKeys.tree(), queryFn: filesApi.tree });
export const storageQuery = () =>
  queryOptions({ queryKey: filesKeys.storage(), queryFn: filesApi.storage });

export const useListing = (p: ListParams) => useQuery(listQuery(p));
export const useFolderTree = () => useQuery(treeQuery());
export const useStorage = () => useQuery(storageQuery());

export function useCreateFolder() {
  const { t } = useTranslation('app-files');
  return useMutation({
    mutationFn: filesApi.createFolder,
    meta: { invalidates: [filesKeys.all], successMessage: t('toast.folderCreated') },
  });
}

export function useUpdateFile() {
  return useMutation({ mutationFn: filesApi.update, meta: { invalidates: [filesKeys.all] } });
}

export function useDeleteFiles() {
  const { t } = useTranslation('app-files');
  return useMutation({
    mutationFn: filesApi.remove,
    meta: { invalidates: [filesKeys.all], successMessage: t('toast.deleted') },
  });
}
