/** Renders `text` with the first case-insensitive match of `query` marked. */
export function Highlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  const index = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-[2px] bg-primary/15 text-foreground">
        {text.slice(index, index + q.length)}
      </mark>
      {text.slice(index + q.length)}
    </>
  );
}
