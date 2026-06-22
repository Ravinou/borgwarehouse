import { useEffect, useMemo, useRef, useState } from 'react';
import { IconChevronDown, IconSearch } from '@tabler/icons-react';
import classes from './IconPicker.module.css';
import RepoIcon from '../RepoIcon';
import { DEFAULT_REPO_ICON, REPO_ICON_CATEGORIES } from '../repoIcons';

type IconPickerProps = {
  value?: string;
  onChange: (iconName: string) => void;
};

const humanize = (name: string) => {
  if (name === DEFAULT_REPO_ICON) return 'borgwarehouse';
  return name
    .replace(/^Icon/, '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase();
};

export default function IconPicker(props: IconPickerProps) {
  const selected = props.value || DEFAULT_REPO_ICON;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const filteredCategories = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return REPO_ICON_CATEGORIES;
    return REPO_ICON_CATEGORIES.map((cat) => ({
      ...cat,
      icons: cat.icons.filter((name) => humanize(name).includes(q)),
    })).filter((cat) => cat.icons.length > 0);
  }, [query]);

  const handleSelect = (name: string) => {
    props.onChange(name);
    setOpen(false);
    setQuery('');
  };

  return (
    <div className={classes.wrapper} ref={wrapperRef}>
      <button
        type='button'
        className={`${classes.trigger} ${open ? classes.triggerOpen : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className={classes.triggerPreview}>
          <RepoIcon name={selected} size={20} stroke={1.75} />
        </span>
        <span className={classes.triggerText}>{humanize(selected)}</span>
        <IconChevronDown size={18} className={classes.triggerChevron} />
      </button>

      {open && (
        <div className={classes.panel}>
          <div className={classes.searchRow}>
            <IconSearch size={16} className={classes.searchIcon} />
            <input
              type='text'
              className={classes.search}
              placeholder='Search an icon...'
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>
          <div className={classes.scroll}>
            {filteredCategories.length === 0 && (
              <div className={classes.empty}>No icon matches “{query}”.</div>
            )}
            {filteredCategories.map((cat) => (
              <div key={cat.label}>
                <div className={classes.categoryLabel}>{cat.label}</div>
                <div className={classes.grid}>
                  {cat.icons.map((name) => (
                    <button
                      key={name}
                      type='button'
                      title={humanize(name)}
                      className={`${classes.iconButton} ${
                        name === selected ? classes.iconButtonActive : ''
                      }`}
                      onClick={() => handleSelect(name)}
                    >
                      <RepoIcon name={name} size={21} stroke={1.6} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
