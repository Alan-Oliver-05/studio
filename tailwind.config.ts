
import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontSize: {
      'xs': ['0.75rem', { lineHeight: '1rem' }],      // 12px
      'sm': ['0.8125rem', { lineHeight: '1.125rem' }],// 13px (prev 14px)
      'base': ['0.9375rem', { lineHeight: '1.375rem' }],// 15px (prev 16px)
      'lg': ['1.0625rem', { lineHeight: '1.625rem' }], // 17px (prev 18px)
      'xl': ['1.1875rem', { lineHeight: '1.75rem' }],  // 19px (prev 20px)
      '2xl': ['1.375rem', { lineHeight: '1.875rem' }], // 22px (prev 24px)
      '3xl': ['1.75rem', { lineHeight: '2.125rem' }],  // 28px (prev 30px)
      '4xl': ['2.125rem', { lineHeight: '2.5rem' }],   // 34px (prev 36px)
      '5xl': ['2.75rem', { lineHeight: '1' }],      // 44px (prev 48px)
      '6xl': ['3.5rem', { lineHeight: '1' }],       // 56px (prev 60px)
      '7xl': ['4.25rem', { lineHeight: '1' }],      // 68px (prev 72px)
      '8xl': ['5.5rem', { lineHeight: '1' }],       // 88px (prev 96px)
      '9xl': ['7.5rem', { lineHeight: '1' }],       // 120px (prev 128px)
    },
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: { // Added sidebar specific colors
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				background: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		},
      fontFamily: { // Added font family definition from globals.css
        sans: ['var(--font-geist-sans)', 'Arial', 'Helvetica', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
  	}
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")], // Added typography plugin
} satisfies Config;
