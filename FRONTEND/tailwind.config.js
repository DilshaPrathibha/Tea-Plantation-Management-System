import daisyui from 'daisyui';

export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        'tea-dark': {
          'primary': '#22C55E',
          'primary-content': '#052e16',
          'secondary': '#0EA5E9',
          'secondary-content': '#04131d',
          'accent': '#F97316',
          'accent-content': '#2d1605',
          'neutral': '#1F2937',
          'neutral-content': '#E5E7EB',
          'base-100': '#0F172A',
          'base-200': '#111B2D',
          'base-300': '#182541',
          'base-content': '#F8FAFC',
          'info': '#38BDF8',
          'success': '#22C55E',
          'warning': '#FACC15',
          'error': '#F87171'
        }
      },
      {
        'tea-light': {
          'primary': '#16A34A',
          'primary-content': '#ffffff',
          'secondary': '#0284C7',
          'secondary-content': '#F5FAFF',
          'accent': '#F97316',
          'accent-content': '#2d1605',
          'neutral': '#0F172A',
          'neutral-content': '#E2E8F0',
          'base-100': '#FFFFFF',
          'base-200': '#ECFDF3',
          'base-300': '#D7F5E5',
          'base-content': '#1F2937',
          'info': '#0EA5E9',
          'success': '#16A34A',
          'warning': '#F59E0B',
          'error': '#EF4444'
        }
      }
    ],
  },
};
