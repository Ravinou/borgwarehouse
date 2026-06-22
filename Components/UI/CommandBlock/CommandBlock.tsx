import CopyButton from '../CopyButton/CopyButton';
import classes from './CommandBlock.module.css';

type CommandBlockProps = {
  /** The command (or config) shown in the box and copied to the clipboard. */
  command: string;
  /**
   * Render as a multi-line block (preserves whitespace and scrolls vertically),
   * with the copy button pinned to the top-right. Use for config snippets.
   */
  multiline?: boolean;
};

/**
 * A copy-ready command box, matching the app's "command box" identity
 * (light surface, monospace, pill copy button). Single source of truth so the
 * displayed text and the copied text can never drift apart.
 */
export default function CommandBlock({ command, multiline = false }: CommandBlockProps) {
  return (
    <div className={`${classes.box} ${multiline ? classes.block : ''}`}>
      <code className={classes.code}>{command}</code>
      <CopyButton variant='pill' dataToCopy={command} />
    </div>
  );
}
