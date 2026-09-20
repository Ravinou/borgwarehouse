import { IconChevronDown, IconSortAscending, IconSortDescending } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';
import classes from './SortDropdown.module.css';

import type { SortOption } from '~/helpers/functions/sortRepositories';

const SORT_FIELDS: {
  field: string;
  label: string;
  asc: SortOption;
  desc: SortOption;
  ascLabel: string;
  descLabel: string;
}[] = [
  {
    field: 'alias',
    label: 'Alias',
    asc: 'alias-asc',
    desc: 'alias-desc',
    ascLabel: 'A → Z',
    descLabel: 'Z → A',
  },
  {
    field: 'status',
    label: 'Status',
    asc: 'status-false',
    desc: 'status-true',
    ascLabel: 'KO → OK',
    descLabel: 'OK → KO',
  },
  {
    field: 'append-only',
    label: 'Append-only',
    asc: 'append-only-false',
    desc: 'append-only-true',
    ascLabel: 'Disabled → Enabled',
    descLabel: 'Enabled → Disabled',
  },
  {
    field: 'last-save',
    label: 'Last save',
    asc: 'last-save-asc',
    desc: 'last-save-desc',
    ascLabel: 'Old → Recent',
    descLabel: 'Recent → Old',
  },
  {
    field: 'storage-used',
    label: 'Storage usage',
    asc: 'storage-used-asc',
    desc: 'storage-used-desc',
    ascLabel: 'Low → High',
    descLabel: 'High → Low',
  },
];

type SortDropdownProps = {
  sortOption: SortOption;
  onSortChange: (option: SortOption) => void;
};

export default function SortDropdown({ sortOption, onSortChange }: SortDropdownProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const currentField =
    SORT_FIELDS.find((f) => f.asc === sortOption || f.desc === sortOption) ?? SORT_FIELDS[0];
  const currentDirection: 'asc' | 'desc' = currentField.asc === sortOption ? 'asc' : 'desc';

  const handleFieldChange = (fieldKey: string) => {
    const field = SORT_FIELDS.find((f) => f.field === fieldKey);
    if (field) onSortChange(field.asc);
    setMenuOpen(false);
  };

  const handleDirectionToggle = () => {
    onSortChange(currentDirection === 'asc' ? currentField.desc : currentField.asc);
  };

  return (
    <div className={classes.sortControls}>
      <div className={classes.sortDropdown} ref={menuRef}>
        <button
          type='button'
          className={`${classes.sortTrigger} ${menuOpen ? classes.sortTriggerOpen : ''}`}
          onClick={() => setMenuOpen((o) => !o)}
          aria-haspopup='listbox'
          aria-expanded={menuOpen}
          title='Sort by'
        >
          <span>{currentField.label}</span>
          <IconChevronDown size={16} className={classes.sortChevron} />
        </button>
        {menuOpen && (
          <div className={classes.sortMenu} role='listbox'>
            {SORT_FIELDS.map((f) => (
              <button
                key={f.field}
                type='button'
                role='option'
                aria-selected={f.field === currentField.field}
                className={`${classes.sortMenuItem} ${
                  f.field === currentField.field ? classes.sortMenuItemActive : ''
                }`}
                onClick={() => handleFieldChange(f.field)}
              >
                {f.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        type='button'
        className={classes.sortDirectionBtn}
        onClick={handleDirectionToggle}
        title={currentDirection === 'asc' ? currentField.ascLabel : currentField.descLabel}
      >
        {currentDirection === 'asc' ? (
          <IconSortDescending size={18} />
        ) : (
          <IconSortAscending size={18} />
        )}
      </button>
    </div>
  );
}
