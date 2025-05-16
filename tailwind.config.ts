import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "flip": {
          "0%": {
            transform: "rotateY(0deg)",
          },
          "50%": {
            transform: "rotateY(180deg)",
          },
          "100%": {
            transform: "rotateY(360deg)",
          },
        },
        "dash": {
          "0%": {
            strokeDasharray: "1, 150",
            strokeDashoffset: "0",
          },
          "50%": {
            strokeDasharray: "90, 150",
            strokeDashoffset: "-35",
          },
          "100%": {
            strokeDasharray: "90, 150",
            strokeDashoffset: "-124",
          },
        },
        "chart-bar-1": {
          "0%, 100%": {
            height: "33.333333%",
          },
          "50%": {
            height: "60%",
          },
        },
        "chart-bar-2": {
          "0%, 100%": {
            height: "66.666667%",
          },
          "50%": {
            height: "40%",
          },
        },
        "chart-bar-3": {
          "0%, 100%": {
            height: "100%",
          },
          "50%": {
            height: "70%",
          },
        },
        "chart-bar-4": {
          "0%, 100%": {
            height: "50%",
          },
          "50%": {
            height: "80%",
          },
        },
        "chart-bar-5": {
          "0%, 100%": {
            height: "75%",
          },
          "50%": {
            height: "50%",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "flip": "flip 1.5s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite",
        "dash": "dash 1.5s ease-in-out infinite",
        "chart-bar-1": "chart-bar-1 1.5s ease-in-out infinite",
        "chart-bar-2": "chart-bar-2 1.5s ease-in-out infinite 0.2s",
        "chart-bar-3": "chart-bar-3 1.5s ease-in-out infinite 0.4s",
        "chart-bar-4": "chart-bar-4 1.5s ease-in-out infinite 0.6s",
        "chart-bar-5": "chart-bar-5 1.5s ease-in-out infinite 0.8s",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
