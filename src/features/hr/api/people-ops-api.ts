import { queryOptions, useMutation, useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { api } from '@/core/api/client';
import { useTranslation } from '@/core/i18n/use-translation';

import { hrDocumentSchema } from '../model/documents';
import { engagementSchema } from '../model/engagement';
import { trainingSchema } from '../model/training';

import { hrPageKeys } from './hr-api';

/** Training, engagement surveys and policy documents. */
const peopleOpsApi = {
  training: () => api.get('/hr/training', trainingSchema),
  assignTraining: (body: { courseId: string; personIds: string[]; due: string }) =>
    api.post('/hr/training/assignments', body),
  engagement: () => api.get('/hr/engagement', engagementSchema),
  remindSurvey: (id: string) => api.post(`/hr/engagement/surveys/${id}/remind`, {}),
  documents: () => api.get('/hr/documents', z.array(hrDocumentSchema)),
  remindDocument: (id: string) => api.post(`/hr/documents/${id}/remind`, {}),
};

const peopleOpsKeys = {
  training: () => [...hrPageKeys.all, 'training'] as const,
  engagement: () => [...hrPageKeys.all, 'engagement'] as const,
  documents: () => [...hrPageKeys.all, 'documents'] as const,
};

export const trainingQuery = () =>
  queryOptions({ queryKey: peopleOpsKeys.training(), queryFn: peopleOpsApi.training });
export const engagementQuery = () =>
  queryOptions({ queryKey: peopleOpsKeys.engagement(), queryFn: peopleOpsApi.engagement });
export const documentsQuery = () =>
  queryOptions({ queryKey: peopleOpsKeys.documents(), queryFn: peopleOpsApi.documents });

export const useTraining = () => useQuery(trainingQuery());
export const useEngagement = () => useQuery(engagementQuery());
export const useDocuments = () => useQuery(documentsQuery());

export function useAssignTraining() {
  const { t } = useTranslation('hr');
  return useMutation({
    mutationFn: peopleOpsApi.assignTraining,
    meta: { invalidates: [peopleOpsKeys.training()], successMessage: t('training.assigned') },
  });
}

export function useRemindSurvey() {
  const { t } = useTranslation('hr');
  return useMutation({
    mutationFn: peopleOpsApi.remindSurvey,
    meta: { invalidates: [peopleOpsKeys.engagement()], successMessage: t('engagement.reminded') },
  });
}

export function useRemindDocument() {
  const { t } = useTranslation('hr');
  return useMutation({
    mutationFn: peopleOpsApi.remindDocument,
    meta: { invalidates: [peopleOpsKeys.documents()], successMessage: t('documents.reminded') },
  });
}
