import {
  KeyRound,
  Layers2,
  LayoutTemplate,
  ListFilter,
  SlidersHorizontal,
  TextCursorInput,
} from 'lucide-react';

import { routes } from '@/core/config/routes';
import { defineFeature } from '@/core/feature/define-feature';

import en from './i18n/en.json';
import { uiFormsRoutes } from './routes';

export default defineFeature({
  id: 'ui-forms',
  routes: [
    { path: routes.uiForms.path, access: 'protected', page: () => import('./pages/forms-page') },
    {
      path: routes.uiSelects.path,
      access: 'protected',
      page: () => import('./pages/selects-page'),
    },
    {
      path: routes.uiOverlays.path,
      access: 'protected',
      page: () => import('./pages/overlays-page'),
    },
    {
      path: uiFormsRoutes.formLayouts.path,
      access: 'protected',
      page: () => import('./pages/form-layouts-page'),
    },
    {
      path: uiFormsRoutes.authForms.path,
      access: 'protected',
      page: () => import('./pages/auth-forms-page'),
    },
    {
      path: uiFormsRoutes.inputs.path,
      access: 'protected',
      page: () => import('./pages/inputs-page'),
    },
  ],
  nav: [
    {
      to: routes.uiForms.href(),
      icon: TextCursorInput,
      label: (t) => t('ui-forms:nav'),
      order: 40,
      group: 'components',
    },
  ],
  commands: [
    {
      id: 'ui-forms.layouts',
      to: uiFormsRoutes.formLayouts.href(),
      icon: LayoutTemplate,
      label: (t) => t('ui-forms:commands.layouts'),
      keywords: ['form', 'layout', 'checkout', 'survey', 'settings'],
    },
    {
      id: 'ui-forms.auth',
      to: uiFormsRoutes.authForms.href(),
      icon: KeyRound,
      label: (t) => t('ui-forms:commands.auth'),
      keywords: ['login', 'sign in', 'sign up', 'otp', 'password', '2fa'],
    },
    {
      id: 'ui-forms.inputs',
      to: uiFormsRoutes.inputs.href(),
      icon: SlidersHorizontal,
      label: (t) => t('ui-forms:commands.inputs'),
      keywords: ['input', 'mask', 'slider', 'editor', 'signature', 'upload', 'tree'],
    },
    {
      id: 'ui-forms.selects',
      to: routes.uiSelects.href(),
      icon: ListFilter,
      label: (t) => t('ui-forms:commands.selects'),
      keywords: ['select', 'autocomplete', 'combobox', 'multiselect'],
    },
    {
      id: 'ui-forms.overlays',
      to: routes.uiOverlays.href(),
      icon: Layers2,
      label: (t) => t('ui-forms:commands.overlays'),
      keywords: ['dialog', 'modal', 'drawer', 'sheet', 'popover', 'menu'],
    },
  ],
  i18n: { en },
});
