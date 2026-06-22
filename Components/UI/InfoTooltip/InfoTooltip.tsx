import { useState, useRef, useCallback, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconInfoCircle } from '@tabler/icons-react';
import classes from './InfoTooltip.module.css';

type InfoTooltipProps = {
  /** Tooltip content shown on hover/focus. */
  content: ReactNode;
  /** Size of the info icon (default 16). */
  iconSize?: number;
  /** Max width of the tooltip bubble in px (default 280). */
  maxWidth?: number;
  /** Extra class names merged onto the trigger */
  triggerClassName?: string;
  /** Accessible label for the trigger (default "More information"). */
  ariaLabel?: string;
};

export default function InfoTooltip({
  content,
  iconSize = 16,
  maxWidth = 280,
  triggerClassName,
  ariaLabel = 'More information',
}: InfoTooltipProps) {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);

  const show = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    // Center under the icon, then clamp so the (worst-case) bubble stays on-screen.
    const margin = 8;
    const half = maxWidth / 2;
    const center = rect.left + rect.width / 2;
    const left = Math.min(Math.max(center, margin + half), window.innerWidth - margin - half);
    setCoords({ top: rect.bottom + margin, left });
  }, [maxWidth]);

  const hide = useCallback(() => setCoords(null), []);

  return (
    <span
      ref={triggerRef}
      className={`${classes.trigger} ${triggerClassName ?? ''}`}
      tabIndex={0}
      role='button'
      aria-label={ariaLabel}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      <IconInfoCircle size={iconSize} />
      {coords !== null &&
        typeof document !== 'undefined' &&
        createPortal(
          <span
            className={classes.tooltip}
            style={{ top: coords.top, left: coords.left, maxWidth }}
            role='tooltip'
          >
            {content}
          </span>,
          document.body
        )}
    </span>
  );
}
