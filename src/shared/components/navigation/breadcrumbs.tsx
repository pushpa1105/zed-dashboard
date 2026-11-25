import { Fragment, type ElementType, type ReactNode } from 'react';

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/shared/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';

export type Crumb = { key: string; label: ReactNode; href?: string };

export type BreadcrumbsProps = {
  items: Crumb[];
  /** Collapse the middle into a "…" menu when there are more items than this. */
  maxItems?: number;
  /** Router link component (receives `href` and `to`). */
  linkComponent?: ElementType;
  separator?: ReactNode;
  className?: string;
};

/** Breadcrumb trail; long trails keep the first and last items and fold the rest into a menu. */
export function Breadcrumbs({
  items,
  maxItems = 4,
  linkComponent: LinkComponent = 'a',
  separator,
  className,
}: BreadcrumbsProps) {
  const max = Math.max(3, maxItems);
  const collapse = items.length > max;
  const head = collapse ? items.slice(0, 1) : items.slice(0, -1);
  const hidden = collapse ? items.slice(1, -(max - 2)) : [];
  const tail = collapse ? items.slice(-(max - 2), -1) : [];
  const last = items[items.length - 1];

  const crumbLink = (item: Crumb) =>
    item.href ? (
      <BreadcrumbLink asChild>
        <LinkComponent href={item.href} to={item.href}>
          {item.label}
        </LinkComponent>
      </BreadcrumbLink>
    ) : (
      <span>{item.label}</span>
    );

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {head.map((item) => (
          <Fragment key={item.key}>
            <BreadcrumbItem>{crumbLink(item)}</BreadcrumbItem>
            <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>
          </Fragment>
        ))}
        {hidden.length > 0 && (
          <>
            <BreadcrumbItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="flex items-center rounded-sm hover:text-foreground"
                  aria-label="Show hidden breadcrumbs"
                >
                  <BreadcrumbEllipsis />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {hidden.map((item) => (
                    <DropdownMenuItem key={item.key} asChild={!!item.href}>
                      {item.href ? (
                        <LinkComponent href={item.href} to={item.href}>
                          {item.label}
                        </LinkComponent>
                      ) : (
                        item.label
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </BreadcrumbItem>
            <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>
          </>
        )}
        {tail.map((item) => (
          <Fragment key={item.key}>
            <BreadcrumbItem>{crumbLink(item)}</BreadcrumbItem>
            <BreadcrumbSeparator>{separator}</BreadcrumbSeparator>
          </Fragment>
        ))}
        {last && (
          <BreadcrumbItem>
            <BreadcrumbPage>{last.label}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
