import * as React from "react"
import PropTypes from "prop-types"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-primary-foreground shadow-card hover:shadow-elegant hover:scale-[1.02] border-0",
        destructive: "bg-gradient-to-r from-danger to-danger/90 text-destructive-foreground shadow-card hover:shadow-elegant hover:scale-[1.02]",
        outline: "border-2 border-primary/30 bg-background text-foreground shadow-sm hover:bg-primary/5 hover:border-primary/50 hover:shadow-card",
        secondary: "bg-gradient-to-r from-secondary to-secondary/80 text-secondary-foreground shadow-card hover:shadow-elegant hover:from-secondary/90 hover:to-secondary/70",
        ghost: "text-foreground hover:bg-accent hover:text-accent-foreground rounded-xl transition-smooth",
        link: "text-primary underline-offset-4 hover:underline font-medium",
        hero: "bg-gradient-hero text-white shadow-elegant hover:shadow-dramatic hover:scale-105 border-0 font-semibold",
        security: "bg-gradient-security text-security-foreground shadow-card hover:shadow-elegant hover:scale-[1.02]",
        warning: "bg-gradient-to-r from-warning to-warning/90 text-warning-foreground shadow-card hover:shadow-elegant hover:scale-[1.02]",
        danger: "bg-gradient-to-r from-danger to-danger/90 text-danger-foreground shadow-card hover:shadow-elegant hover:scale-[1.02]",
        glass: "glass-card text-white hover:bg-white/20 border-white/30 backdrop-blur-md",
        accent: "bg-gradient-accent text-white shadow-card hover:shadow-elegant hover:scale-[1.02]",
        premium: "bg-gradient-to-r from-primary via-primary-light to-primary text-white shadow-elegant hover:shadow-glow hover:scale-105 border-0 font-semibold relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700",
      },
      size: {
        default: "h-10 px-6 py-2 text-sm",
        sm: "h-8 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-12 text-lg font-semibold",
        icon: "h-10 w-10 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  )
})
Button.displayName = "Button"

export { Button, buttonVariants }