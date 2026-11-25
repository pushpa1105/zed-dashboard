import { defineRoute } from '@/core/config/routes';

/** Pages added to the ui-forms showcase (the first three live in the central route table). */
export const uiFormsRoutes = {
  formLayouts: defineRoute('/app/ui/form-layouts'),
  authForms: defineRoute('/app/ui/auth-forms'),
  inputs: defineRoute('/app/ui/inputs'),
} as const;
