import { IconMoon, IconSun } from '@tabler/icons-react';
import { useTheme } from 'next-themes';
import classes from './ThemeToggle.module.css';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type='button'
      className={classes.toggle}
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={label}
      aria-label={label}
    >
      {/* resolvedTheme is undefined until mounted, which keeps SSR/CSR markup in sync. */}
      {resolvedTheme &&
        (isDark ? (
          <IconSun size={19} stroke={1.75} className={classes.icon} />
        ) : (
          <IconMoon size={19} stroke={1.75} className={classes.icon} />
        ))}
    </button>
  );
}
