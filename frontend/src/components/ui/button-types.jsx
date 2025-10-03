/**
 * @typedef {Object} ButtonProps
 * @property {React.ReactNode} [children]
 * @property {string} [className]
 * @property {"default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "hero" | "security" | "warning" | "danger" | "glass" | "accent" | "premium"} [variant]
 * @property {"default" | "sm" | "lg" | "xl" | "icon"} [size]
 * @property {boolean} [asChild]
 */

/**
 * @typedef {React.ForwardRefExoticComponent<ButtonProps & React.RefAttributes<HTMLButtonElement>>} ButtonComponent
 */

// Re-export the Button component from button.jsx with type information
export { Button } from './button.jsx';
