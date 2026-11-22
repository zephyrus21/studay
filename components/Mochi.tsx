type MochiProps = { size?: number };

// Dr. Mochi: our own original cat mascot (round white cat, tiny white coat, pink stethoscope).
export function Mochi({ size = 44 }: MochiProps) {
  return (
    <svg
      width={size}
      height={(size * 40) / 44}
      viewBox="0 0 44 40"
      role="img"
      aria-label="Dr. Mochi"
    >
      <path d="M9 14 L11 3 L17 9 Z M35 14 L33 3 L27 9 Z" fill="#fff" stroke="#5A3E44" strokeWidth="1.4" strokeLinejoin="round" />
      <ellipse cx="22" cy="18" rx="13" ry="11" fill="#fff" stroke="#5A3E44" strokeWidth="1.4" />
      <circle cx="17" cy="18" r="1.5" fill="#5A3E44" />
      <circle cx="27" cy="18" r="1.5" fill="#5A3E44" />
      <path d="M20 22 q1 1.5 2 0 q1 1.5 2 0" fill="none" stroke="#5A3E44" strokeWidth="1.1" strokeLinecap="round" />
      <circle cx="14" cy="21" r="1.8" fill="#F7B6C2" />
      <circle cx="30" cy="21" r="1.8" fill="#F7B6C2" />
      <path d="M12 29 L10 40 L34 40 L32 29 Q22 33 12 29Z" fill="#fff" stroke="#5A3E44" strokeWidth="1.3" />
      <path d="M22 31 v9" stroke="#5A3E44" strokeWidth="1" />
      <path d="M16 30 q-2 6 3 7 q4 0 3 -5" fill="none" stroke="#EF8FA3" strokeWidth="1.8" />
      <circle cx="22" cy="32" r="2" fill="#EF8FA3" />
    </svg>
  );
}
