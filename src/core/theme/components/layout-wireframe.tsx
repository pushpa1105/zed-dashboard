import type { ShellLayout } from '@/core/theme/config';
import { cn } from '@/shared/lib/cn';

/**
 * A tiny drawing of a shell layout: where the menu sits and where content
 * goes. Used as the preview fallback and as the icon of the layout filter.
 */
export function LayoutWireframe({
  layout,
  className,
}: {
  layout: ShellLayout;
  className?: string;
}) {
  const nav = 'fill-primary/25';
  const navDark = 'fill-foreground/80';
  const bar = 'fill-muted-foreground/25';
  const card = 'fill-card stroke-border';
  const content = (x: number, y: number, w: number, h: number) => (
    <g>
      <rect x={x} y={y} width={w} height={h * 0.28} rx="2" className={card} strokeWidth="0.75" />
      <rect
        x={x}
        y={y + h * 0.34}
        width={w * 0.62}
        height={h * 0.66}
        rx="2"
        className={card}
        strokeWidth="0.75"
      />
      <rect
        x={x + w * 0.66}
        y={y + h * 0.34}
        width={w * 0.34}
        height={h * 0.66}
        rx="2"
        className={card}
        strokeWidth="0.75"
      />
    </g>
  );

  const body = (() => {
    switch (layout) {
      case 'rail':
        return (
          <>
            <rect x="0" y="0" width="11" height="75" className={navDark} />
            {[10, 20, 30, 40].map((y) => (
              <rect
                key={y}
                x="3"
                y={y}
                width="5"
                height="5"
                rx="1.5"
                className="fill-background/50"
              />
            ))}
            <rect x="11" y="0" width="109" height="9" className={bar} />
            {content(17, 15, 97, 54)}
          </>
        );
      case 'dual':
        return (
          <>
            <rect x="0" y="0" width="9" height="75" className={bar} />
            <rect x="9" y="0" width="24" height="75" className={nav} />
            {[8, 14, 20, 26].map((y) => (
              <rect key={y} x="12" y={y} width="17" height="3" rx="1" className="fill-primary/50" />
            ))}
            <rect x="33" y="0" width="87" height="9" className={bar} />
            {content(38, 15, 77, 54)}
          </>
        );
      case 'topnav':
        return (
          <>
            <rect x="0" y="0" width="120" height="11" className={nav} />
            {[30, 44, 58, 72].map((x) => (
              <rect
                key={x}
                x={x}
                y="4"
                width="11"
                height="3"
                rx="1.5"
                className="fill-primary/60"
              />
            ))}
            {content(8, 17, 104, 52)}
          </>
        );
      case 'topnav-tabs':
        return (
          <>
            <rect x="0" y="0" width="120" height="9" className={bar} />
            <rect x="0" y="9" width="120" height="7" className={nav} />
            {[8, 24, 40].map((x) => (
              <rect key={x} x={x} y="14" width="12" height="1.5" className="fill-primary" />
            ))}
            {content(8, 21, 104, 48)}
          </>
        );
      case 'boxed':
        return (
          <>
            <rect x="0" y="0" width="120" height="75" className="fill-muted" />
            <rect x="10" y="9" width="100" height="62" rx="3" className={card} strokeWidth="0.75" />
            <rect x="10" y="9" width="24" height="62" rx="3" className={nav} />
            {content(39, 14, 66, 52)}
          </>
        );
      case 'floating':
        return (
          <>
            <rect
              x="3"
              y="3"
              width="27"
              height="69"
              rx="3"
              className={cn(card, 'stroke-primary/40')}
              strokeWidth="0.75"
            />
            {[10, 16, 22, 28].map((y) => (
              <rect key={y} x="7" y={y} width="19" height="3" rx="1" className="fill-primary/40" />
            ))}
            <rect x="33" y="3" width="84" height="8" rx="2" className={bar} />
            {content(36, 16, 78, 53)}
          </>
        );
      case 'inset':
        return (
          <>
            <rect x="0" y="0" width="120" height="75" className={nav} />
            <rect x="28" y="4" width="88" height="67" rx="3" className="fill-background" />
            {content(33, 12, 78, 54)}
          </>
        );
      case 'sidebar-dark':
        return (
          <>
            <rect x="0" y="0" width="28" height="75" className={navDark} />
            {[10, 16, 22, 28].map((y) => (
              <rect
                key={y}
                x="4"
                y={y}
                width="19"
                height="3"
                rx="1"
                className="fill-background/50"
              />
            ))}
            <rect x="28" y="0" width="92" height="9" className={bar} />
            {content(33, 15, 82, 54)}
          </>
        );
      default:
        return (
          <>
            <rect x="0" y="0" width="28" height="75" className={nav} />
            {[10, 16, 22, 28].map((y) => (
              <rect key={y} x="4" y={y} width="19" height="3" rx="1" className="fill-primary/50" />
            ))}
            <rect x="28" y="0" width="92" height="9" className={bar} />
            {content(33, 15, 82, 54)}
          </>
        );
    }
  })();

  return (
    <svg
      viewBox="0 0 120 75"
      className={cn('block w-full bg-background', className)}
      role="img"
      aria-label={layout}
      preserveAspectRatio="xMidYMid slice"
    >
      {body}
    </svg>
  );
}
