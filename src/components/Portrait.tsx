import type { President } from '../types';

interface Props {
  president: President;
  /** Pixel size; defaults to a CSS-driven size if not provided. */
  size?: number;
}

function initials(name: string): string {
  const parts = name.split(' ').filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Portrait({ president, size }: Props) {
  const style = size ? { width: size, height: size } : undefined;

  if (!president.image) {
    return (
      <div className="portrait portrait-fallback" style={style} aria-hidden>
        <span>{initials(president.name)}</span>
      </div>
    );
  }

  const src = `${import.meta.env.BASE_URL}i/${president.image}`;
  return (
    <img
      className="portrait"
      style={style}
      src={src}
      alt={`Portrait of ${president.name}`}
      loading="lazy"
      decoding="async"
    />
  );
}
