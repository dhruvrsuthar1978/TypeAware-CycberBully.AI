import * as React from "react"
import PropTypes from "prop-types"

import { cn } from "@/lib/utils"
    
const Card = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow-card transition-smooth hover-lift",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
Card.displayName = "Card"
Card.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
}

const CardHeader = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  >
    {children}
  </div>
))
CardHeader.displayName = "CardHeader"
CardHeader.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
}

const CardTitle = React.forwardRef(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  >
    {children}
  </h3>
))
CardTitle.displayName = "CardTitle"
CardTitle.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
}

const CardDescription = React.forwardRef(({ className, children, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  >
    {children}
  </p>
))
CardDescription.displayName = "CardDescription"
CardDescription.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
}

const CardContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props}>
    {children}
  </div>
))
CardContent.displayName = "CardContent"
CardContent.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
}

const CardFooter = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  >
    {children}
  </div>
))
CardFooter.displayName = "CardFooter"
CardFooter.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }