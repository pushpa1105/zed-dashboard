import { ArrowLeft } from 'lucide-react';

import { Link } from '@/core/router/router';
import { Button } from '@/shared/ui/button';

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Button variant="ghost" size="sm" asChild className="-ml-3 text-muted-foreground">
      <Link to={to}>
        <ArrowLeft /> {label}
      </Link>
    </Button>
  );
}
