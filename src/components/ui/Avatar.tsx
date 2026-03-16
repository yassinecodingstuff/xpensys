import type { FC } from 'react';

const AVATAR_COLORS = [
  'bg-indigo-500 text-white',
  'bg-emerald-500 text-white',
  'bg-amber-500 text-white',
  'bg-rose-500 text-white',
  'bg-sky-500 text-white',
  'bg-violet-500 text-white',
  'bg-teal-500 text-white',
  'bg-orange-500 text-white',
  'bg-pink-500 text-white',
  'bg-cyan-500 text-white',
] as const;

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  if (parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0]?.[0] ?? '?').toUpperCase();
}

export interface AvatarProps {
  /** Full name (e.g. "Marie Dupont") for initials */
  name: string;
  /** Optional id for stable color (e.g. user id). Falls back to name. */
  id?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
} as const;

const Avatar: FC<AvatarProps> = ({ name, id, size = 'md', className = '' }) => {
  const seed = id ?? name;
  const colorIndex = hashString(seed) % AVATAR_COLORS.length;
  const colorClass = AVATAR_COLORS[colorIndex];
  const initials = getInitials(name);

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold ${sizeClasses[size]} ${colorClass} ${className}`}
      title={name}
      aria-hidden
    >
      {initials}
    </span>
  );
};

export default Avatar;
