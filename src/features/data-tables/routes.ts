import { defineRoute } from '@/core/config/routes';

/** Pages added to the tables showcase (the first three live in the central route table). */
export const tableRoutes = {
  spreadsheet: defineRoute('/app/tables/spreadsheet'),
  tree: defineRoute('/app/tables/tree'),
  masterDetail: defineRoute('/app/tables/master-detail'),
  infinite: defineRoute('/app/tables/infinite'),
  views: defineRoute('/app/tables/views'),
  reorder: defineRoute('/app/tables/reorder'),
  financial: defineRoute('/app/tables/financial'),
} as const;
