/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './app/components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#36aac7',
        secondary: '#ffcc00',
        glass: {
          white: 'rgba(255, 255, 255, 0.15)',
          'white-light': 'rgba(255, 255, 255, 0.25)',
          'white-dark': 'rgba(255, 255, 255, 0.1)',
          border: 'rgba(255, 255, 255, 0.2)',
          'border-light': 'rgba(255, 255, 255, 0.3)',
          blue: 'rgba(59, 130, 246, 0.3)',
          'blue-border': 'rgba(59, 130, 246, 0.4)',
        },
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        '2xl': '24px',
        '3xl': '32px',
      },
      boxShadow: {
        glass: '0 4px 20px rgba(0, 0, 0, 0.15)',
        'glass-lg': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'glass-button': '0 4px 15px rgba(59, 130, 246, 0.2)',
        'glass-input': 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.3)',
      },
      borderColor: {
        glass: 'rgba(255, 255, 255, 0.2)',
        'glass-light': 'rgba(255, 255, 255, 0.3)',
        'glass-blue': 'rgba(59, 130, 246, 0.4)',
      },
      backgroundColor: {
        glass: 'rgba(255, 255, 255, 0.15)',
        'glass-light': 'rgba(255, 255, 255, 0.25)',
        'glass-input': 'rgba(255, 255, 255, 0.2)',
        'glass-button': 'rgba(59, 130, 246, 0.3)',
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        shimmer: 'shimmer 2s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities, theme }) {
      const newUtilities = {
        '.glass-morphism': {
          background: 'rgba(255, 255, 255, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        },
        '.glass-card': {
          background: 'rgba(255, 255, 255, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(15px)',
          WebkitBackdropFilter: 'blur(15px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
        },
        '.glass-input': {
          background: 'rgba(255, 255, 255, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
        },
        '.glass-button': {
          background: 'rgba(59, 130, 246, 0.3)',
          border: '1px solid rgba(59, 130, 246, 0.4)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          boxShadow: '0 4px 15px rgba(59, 130, 246, 0.2)',
        },
        '.text-glass': {
          color: 'rgba(255, 255, 255, 0.95)',
          textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
        },
        '.text-glass-secondary': {
          color: 'rgba(255, 255, 255, 0.8)',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
