/** @type {import('tailwindcss').Config} */


module.exports = {

  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
  	container: {
  		center: 'true',
  		padding: '2rem',
		width: 'w-full',
  		screens: {
  			'2xl': '1400px',
			'xs': '375px'
  		}
  	},
  	extend: {
		backgroundImage: {
			'hero': "url('/home_hero_img.jpg')",
		  },
		fontFamily: {
			sans: ['Inter var', 'sans-serif'],
			display: ['Clash Display', 'sans-serif'], // For headings
		  },
		  spacing: {
			'safe-top': 'env(safe-area-inset-top)',
			'safe-bottom': 'env(safe-area-inset-bottom)',
			'safe-left': 'env(safe-area-inset-left)',
			'safe-right': 'env(safe-area-inset-right)',
		  },
		  boxShadow: {
			'soft': '0 4px 20px rgba(0, 0, 0, 0.05)',
		  },		
  		colors: {
			// 'primary-dark': '#5b5545',
			'primary': '#875f45',
			'primary-light': '#c9bca9',
			'background': {
				DEFAULT: '#f8f7f4',
				subtle: '#e2ded2',
			},
			'accent': {
				DEFAULT: '#c5b7a3',
				dark: '#8c7355',
			},
			border: 'hsl(var(--border))',
			input: 'hsl(var(--input))',
			ring: 'hsl(var(--ring))',
			foreground: 'hsl(var(--foreground))',
			// 'text': '#2f2e2c',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
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
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
		  buttonVariants: {
			variants: {
			  default: "bg-background text-primary-light hover:bg-background/90",
			  primary: "bg-primary text-primary-light hover:bg-primary/90",
			  outline: "border border-primary text-primary hover:bg-primary/10",
			  ghost: "text-primary hover:bg-primary/10 hover:text-primary-dark",
			  link: "text-primary hover:text-primary-dark underline-offset-4 hover:underline",
			  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
			  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
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
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}