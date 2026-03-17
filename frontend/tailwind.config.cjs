/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          dark:       "hsl(var(--primary-dark))",
          light:      "hsl(var(--primary-light))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT:    "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        security: {
          DEFAULT:    "hsl(var(--security))",
          foreground: "hsl(var(--security-foreground))",
        },
        warning: {
          DEFAULT:    "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        danger: {
          DEFAULT:    "hsl(var(--danger))",
          foreground: "hsl(var(--danger-foreground))",
        },
      },
      borderRadius: {
        lg:   "var(--radius)",
        md:   "calc(var(--radius) - 2px)",
        sm:   "calc(var(--radius) - 4px)",
        xl:   "calc(var(--radius) + 4px)",
        "2xl":"calc(var(--radius) + 8px)",
      },
      fontFamily: {
        sans:    ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["Inter", "-apple-system", "sans-serif"],
        mono:    ["JetBrains Mono", "Fira Code", "Consolas", "monospace"],
      },
      boxShadow: {
        card:          "var(--shadow-card)",
        elegant:       "var(--shadow-elegant)",
        dramatic:      "var(--shadow-dramatic)",
        glow:          "var(--shadow-glow)",
        blue:          "var(--shadow-blue)",
        "inner-custom":"var(--shadow-inner)",
        "xl-colored":  "var(--shadow-dramatic)",
      },
      backgroundImage: {
        "gradient-primary":  "var(--gradient-primary)",
        "gradient-security": "var(--gradient-security)",
        "gradient-hero":     "var(--gradient-hero)",
        "gradient-card":     "none",
        "gradient-accent":   "var(--gradient-accent)",
        "gradient-aurora":   "var(--gradient-aurora)",
      },
      width: {
        sidebar: "var(--sidebar-width, 240px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        fadeIn: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.96)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%":      { transform: "translateY(-8px)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 12px hsl(213 94% 58% / 0.3)" },
          "50%":      { boxShadow: "0 0 28px hsl(213 94% 58% / 0.55)" },
        },
        aurora: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%":      { backgroundPosition: "100% 50%" },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-in":        "fadeIn 0.5s ease-out forwards",
        "slide-up":       "slideUp 0.5s ease-out forwards",
        "scale-in":       "scaleIn 0.35s ease-out forwards",
        float:            "float 5s ease-in-out infinite",
        "pulse-glow":     "pulse-glow 2.5s ease-in-out infinite",
        aurora:           "aurora 12s ease infinite",
        shimmer:          "shimmer 2.5s linear infinite",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
      spacing: {
        18:  "4.5rem",
        22:  "5.5rem",
        88:  "22rem",
        104: "26rem",
        120: "30rem",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
    require("tailwindcss-animate"),
  ],
};
