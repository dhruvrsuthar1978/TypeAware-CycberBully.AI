/**
 * @typedef {Object} CardProps
 * @property {React.ReactNode} [children]
 * @property {string} [className]
 */

/**
 * @typedef {React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>>} CardComponent
 */

/**
 * @typedef {React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>>} CardHeaderComponent
 */

/**
 * @typedef {React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>>} CardFooterComponent
 */

/**
 * @typedef {React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLHeadingElement>>} CardTitleComponent
 */

/**
 * @typedef {React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLParagraphElement>>} CardDescriptionComponent
 */

/**
 * @typedef {React.ForwardRefExoticComponent<CardProps & React.RefAttributes<HTMLDivElement>>} CardContentComponent
 */

// Re-export the components from card.jsx with type information
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './card.jsx';
