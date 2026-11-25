/** "Hannah Morgan" → "HM". */
export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');

const AVATAR_TONES = ['--chart-1', '--chart-2', '--chart-3', '--chart-4', '--chart-5'];

/** Stable tint per name, so the same person always gets the same avatar color. */
export const avatarTint = (name: string) => {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  const token = AVATAR_TONES[Math.abs(hash) % AVATAR_TONES.length]!;
  return {
    background: `color-mix(in srgb, var(${token}) 16%, var(--card))`,
    color: `color-mix(in srgb, var(${token}) 85%, var(--foreground))`,
  };
};
