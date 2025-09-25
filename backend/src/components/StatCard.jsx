import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = 'default'
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'warning':
        return 'border-warning/50 bg-warning/5';
      case 'success':
        return 'border-secondary/50 bg-secondary/5';
      case 'destructive':
        return 'border-destructive/50 bg-destructive/5';
      default:
        return 'border-primary/20 bg-primary/5';
    }
  };

  const getIconClasses = () => {
    switch (variant) {
      case 'warning':
        return 'text-warning';
      case 'success':
        return 'text-secondary';
      case 'destructive':
        return 'text-destructive';
      default:
        return 'text-primary';
    }
  };

  return (
    <Card className={`shadow-card hover:shadow-glow transition-all duration-300 ${getVariantClasses()}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${getIconClasses()}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center mt-2">
            <span className={`text-xs font-medium ${
              trend.isPositive ? 'text-secondary' : 'text-destructive'
            }`}>
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              from last month
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StatCard;
