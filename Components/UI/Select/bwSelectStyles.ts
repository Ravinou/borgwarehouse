import type { GroupBase, StylesConfig, Theme } from 'react-select';

/**
 * Shared react-select styling so every dropdown matches the icon picker
 * and follows the light/dark theme tokens. Use on any <Select>:
 *   <Select styles={bwSelectStyles} theme={bwSelectTheme} ... />
 */
export const bwSelectStyles: StylesConfig<any, false, GroupBase<any>> = {
  control: (base, state) => ({
    ...base,
    minHeight: '38px',
    backgroundColor: 'var(--surface-2)',
    borderRadius: '11px',
    borderColor: state.isFocused ? 'var(--primary)' : 'var(--border-strong)',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(109, 74, 255, 0.18)' : 'none',
    cursor: 'pointer',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease',
    '&:hover': {
      borderColor: state.isFocused ? 'var(--primary)' : 'var(--primary-soft-border)',
      backgroundColor: 'var(--surface)',
    },
  }),
  valueContainer: (base) => ({ ...base, padding: '2px 10px' }),
  singleValue: (base) => ({ ...base, color: 'var(--text-strong)' }),
  input: (base) => ({ ...base, color: 'var(--text-strong)', margin: 0 }),
  placeholder: (base) => ({ ...base, color: 'var(--text-faint)' }),
  indicatorSeparator: (base) => ({ ...base, backgroundColor: 'var(--border)' }),
  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isFocused ? 'var(--primary)' : 'var(--text-faint)',
    '&:hover': { color: 'var(--primary)' },
  }),
  clearIndicator: (base) => ({
    ...base,
    color: 'var(--text-faint)',
    '&:hover': { color: 'var(--danger)' },
  }),
  loadingIndicator: (base) => ({ ...base, color: 'var(--text-faint)' }),
  menu: (base) => ({
    ...base,
    backgroundColor: 'var(--elevated)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    boxShadow: 'var(--shadow-lg)',
    overflow: 'hidden',
    zIndex: 30,
  }),
  menuList: (base) => ({ ...base, padding: '6px' }),
  option: (base, state) => ({
    ...base,
    borderRadius: '8px',
    cursor: 'pointer',
    color: state.isSelected ? 'var(--primary)' : 'var(--text-secondary)',
    backgroundColor: state.isSelected
      ? 'var(--primary-soft)'
      : state.isFocused
        ? 'var(--surface-2)'
        : 'transparent',
    '&:active': { backgroundColor: 'var(--primary-soft)' },
  }),
};

export const bwSelectTheme = (theme: Theme): Theme => ({
  ...theme,
  borderRadius: 11,
  colors: {
    ...theme.colors,
    primary: 'var(--primary)',
    primary25: 'var(--surface-2)',
    primary50: 'var(--primary-soft)',
    neutral0: 'var(--elevated)',
    neutral80: 'var(--text-strong)',
  },
});
