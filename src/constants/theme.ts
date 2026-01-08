/**
 * EpiLanka Theme Constants
 * Centralized color scheme and design tokens
 */

export const COLORS = {
  primary: {
    main: '#1E3A8A',
    hover: '#1e40af',
    light: '#3b82f6',
    dark: '#1e293b',
  },
  secondary: {
    main: '#0EA5A4',
    hover: '#0d9190',
    light: '#14b8a6',
    dark: '#0f766e',
  },
  background: {
    main: '#F8FAFC',
    card: '#ffffff',
    secondary: '#f1f5f9',
    hover: '#e2e8f0',
  },
  status: {
    danger: '#DC2626',
    dangerHover: '#b91c1c',
    dangerLight: '#f87171',
    warning: '#F97316',
    warningHover: '#ea580c',
    warningLight: '#fb923c',
    success: '#16A34A',
    successHover: '#15803d',
    successLight: '#4ade80',
  },
  text: {
    primary: '#0f172a',
    secondary: '#64748b',
    tertiary: '#94a3b8',
    inverse: '#ffffff',
  },
  border: {
    default: '#e2e8f0',
    hover: '#cbd5e1',
    focus: '#1E3A8A',
  },
} as const;

export const SHADOWS = {
  xs: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  sm: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
} as const;

export const RADIUS = {
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  full: '9999px',
} as const;

export const SPACING = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '3rem',
} as const;

/**
 * Severity Color Mapping
 */
export const getSeverityColor = (severity: string): string => {
  switch (severity.toLowerCase()) {
    case 'high':
    case 'severe':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'medium':
    case 'moderate':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'low':
    case 'mild':
      return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

/**
 * Status Color Mapping
 */
export const getStatusColor = (status: string | null): string => {
  switch (status?.toLowerCase()) {
    case 'verified':
    case 'confirmed':
      return 'bg-green-50 text-green-700 border-green-200';
    case 'pending':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'investigating':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    default:
      return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

/**
 * Theme Class Names for Tailwind
 */
export const THEME_CLASSES = {
  buttons: {
    primary: 'bg-[#1E3A8A] hover:bg-[#1e40af] text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed',
    secondary: 'bg-[#0EA5A4] hover:bg-[#0d9190] text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-60',
    outline: 'bg-white hover:bg-blue-50 text-[#1E3A8A] border-2 border-[#1E3A8A] font-semibold py-3 px-6 rounded-lg shadow-sm hover:shadow-md transition-all duration-300',
    danger: 'bg-[#DC2626] hover:bg-[#b91c1c] text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300',
    dark: 'bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300',
  },
  cards: {
    primary: 'rounded-xl border border-gray-200 bg-white shadow-md hover:shadow-xl p-6 transition-all duration-300',
    accent: 'rounded-xl bg-gradient-to-br from-[#1E3A8A] to-[#1e293b] text-white shadow-lg p-6',
    secondary: 'rounded-xl bg-gradient-to-br from-[#0EA5A4] to-[#0f766e] text-white shadow-lg p-6',
  },
  inputs: {
    primary: 'w-full px-4 py-3 rounded-lg bg-gray-50 border-2 border-gray-300 focus:outline-none focus:border-[#1E3A8A] focus:ring-2 focus:ring-blue-100 text-gray-800 placeholder:text-gray-500 transition-all duration-300',
  },
  alerts: {
    success: 'alert-success',
    danger: 'alert-danger',
    warning: 'alert-warning',
    info: 'alert-info',
  },
  badges: {
    primary: 'badge-primary',
    secondary: 'badge-secondary',
    success: 'badge-success',
    danger: 'badge-danger',
    warning: 'badge-warning',
  },
} as const;

