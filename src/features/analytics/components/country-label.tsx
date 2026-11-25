/** Country code chip followed by its name. */
export function CountryLabel({ code, name }: { code: string; name: string }) {
  return (
    <span className="flex items-center gap-3">
      <span className="flex h-6 w-8 shrink-0 items-center justify-center rounded border bg-muted text-[0.625rem] font-semibold tracking-wide text-muted-foreground">
        {code}
      </span>
      <span className="font-medium">{name}</span>
    </span>
  );
}
