/* MebelPro KG — дизайн-токены Tailwind (общие для всех экранов) */
tailwind.config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'on-tertiary-container': '#fffbff', 'secondary-fixed': '#89f5e7', 'on-primary-fixed': '#001d31',
        'surface-variant': '#dae2fd', secondary: '#006a61', tertiary: '#a33900',
        'on-tertiary-fixed-variant': '#7f2b00', 'error-container': '#ffdad6', 'on-background': '#131b2e',
        'secondary-fixed-dim': '#6bd8cb', 'on-tertiary-fixed': '#370e00', 'on-surface': '#131b2e',
        error: '#ba1a1a', 'primary-container': '#007bb9', 'on-secondary': '#ffffff',
        'on-primary-fixed-variant': '#004b73', 'on-error-container': '#93000a', 'surface-bright': '#faf8ff',
        'on-primary-container': '#fdfcff', 'inverse-surface': '#283044', 'surface-container-lowest': '#ffffff',
        'on-tertiary': '#ffffff', surface: '#faf8ff', 'on-secondary-fixed-variant': '#005049',
        outline: '#707881', 'outline-variant': '#bfc7d2', primary: '#006194', 'surface-container-high': '#e2e7ff',
        'inverse-primary': '#93ccff', 'on-error': '#ffffff', 'inverse-on-surface': '#eef0ff',
        'surface-container-low': '#f2f3ff', 'surface-container': '#eaedff', 'on-secondary-fixed': '#00201d',
        'on-secondary-container': '#006f66', 'tertiary-container': '#cc4900', 'surface-container-highest': '#dae2fd',
        'primary-fixed-dim': '#93ccff', 'secondary-container': '#86f2e4', 'tertiary-fixed': '#ffdbce',
        background: '#faf8ff', 'primary-fixed': '#cce5ff', 'on-primary': '#ffffff', 'surface-tint': '#006398',
        'on-surface-variant': '#3f4850', 'tertiary-fixed-dim': '#ffb599', 'surface-dim': '#d2d9f4'
      },
      borderRadius: { DEFAULT: '0.125rem', lg: '0.25rem', xl: '0.5rem', '2xl': '0.75rem', full: '9999px' },
      boxShadow: { xs: '0 1px 2px rgba(0,0,0,0.05)' },
      spacing: {
        'margin-lg': '2rem', 'space-lg': '1rem', 'space-2xl': '2rem', gutter: '1rem', 'margin-md': '1.5rem',
        'space-md': '0.75rem', 'space-xs': '0.25rem', 'gutter-md': '1.25rem', margin: '1rem', 'space-xl': '1.5rem',
        'gutter-lg': '1.5rem', 'space-sm': '0.5rem'
      },
      fontFamily: {
        'headline-md': ['Space Grotesk', 'Onest', 'system-ui', 'sans-serif'], 'body-md': ['Geist', 'Onest', 'system-ui', 'sans-serif'], 'label-md': ['JetBrains Mono', 'ui-monospace', 'monospace'],
        'headline-xl': ['Space Grotesk', 'Onest', 'system-ui', 'sans-serif'], 'label-sm': ['JetBrains Mono', 'ui-monospace', 'monospace'], 'headline-sm': ['Space Grotesk', 'Onest', 'system-ui', 'sans-serif'],
        'body-sm': ['Geist', 'Onest', 'system-ui', 'sans-serif'], 'headline-lg': ['Space Grotesk', 'Onest', 'system-ui', 'sans-serif'], 'body-lg': ['Geist', 'Onest', 'system-ui', 'sans-serif'], 'label-lg': ['JetBrains Mono', 'ui-monospace', 'monospace'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace']
      },
      fontSize: {
        'headline-md': ['24px', { lineHeight: '32px', fontWeight: '600' }],
        'body-md': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'label-md': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'headline-xl': ['40px', { lineHeight: '48px', fontWeight: '700' }],
        'label-sm': ['11px', { lineHeight: '14px', fontWeight: '500' }],
        'headline-sm': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'body-sm': ['12px', { lineHeight: '16px', fontWeight: '400' }],
        'headline-lg': ['32px', { lineHeight: '40px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'label-lg': ['14px', { lineHeight: '20px', fontWeight: '500' }]
      }
    }
  }
};
