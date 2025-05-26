/**
 * Modern UI Components for FigVibe
 * Clean, elegant, and pixel-perfect components
 */

import React from "react";
import * as Select from "@radix-ui/react-select";
import * as Switch from "@radix-ui/react-switch";
import * as Tabs from "@radix-ui/react-tabs";
import { Check, ChevronDown, X, AlertCircle } from "lucide-react";

// Button Component
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  isLoading = false,
  children,
  disabled,
  className = "",
  ...props
}) => {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variantClasses = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    ghost: "btn-ghost",
  };

  return (
    <button
      className={`btn ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="spinner mr-2" />
          Loading...
        </>
      ) : (
        children
      )}
    </button>
  );
};

// Select Component
interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectFieldProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  value,
  onValueChange,
  options,
  placeholder = "Select an option",
  className = "",
}) => {
  return (
    <Select.Root value={value} onValueChange={onValueChange}>
      <Select.Trigger className={`select-trigger ${className}`}>
        <Select.Value placeholder={placeholder} />
        <Select.Icon>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Content
          className="select-content"
          position="popper"
          sideOffset={8}
        >
          <Select.Viewport>
            {options.map((option) => (
              <Select.Item
                key={option.value}
                value={option.value}
                className="select-item"
              >
                <Select.ItemText>
                  <div>
                    <div className="font-medium">{option.label}</div>
                    {option.description && (
                      <div className="text-xs text-muted mt-0.5">
                        {option.description}
                      </div>
                    )}
                  </div>
                </Select.ItemText>
                <Select.ItemIndicator className="ml-auto">
                  <Check className="h-4 w-4" />
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
};

// Switch Component
interface SwitchFieldProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

export const SwitchField: React.FC<SwitchFieldProps> = ({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
}) => {
  return (
    <div className="flex items-start space-x-3">
      <Switch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className="switch-root"
      >
        <Switch.Thumb className="switch-thumb" />
      </Switch.Root>
      <div className="flex-1">
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
        {description && (
          <p className="text-xs text-muted mt-1">{description}</p>
        )}
      </div>
    </div>
  );
};

// Input Component
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  className = "",
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="text-sm font-medium text-foreground mb-1.5 block">
          {label}
        </label>
      )}
      <input
        className={`input ${error ? "border-error-500 focus:ring-error-500" : ""} ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-error-600 mt-1 flex items-center">
          <AlertCircle className="h-3 w-3 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
};

// Tabs Component
interface TabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export const TabsComponent: React.FC<TabsProps> = ({
  tabs,
  value,
  onValueChange,
  children,
}) => {
  return (
    <Tabs.Root value={value} onValueChange={onValueChange}>
      <Tabs.List className="tabs-list">
        {tabs.map((tab) => (
          <Tabs.Trigger
            key={tab.value}
            value={tab.value}
            className="tabs-trigger"
          >
            {tab.icon && <span className="mr-2">{tab.icon}</span>}
            {tab.label}
          </Tabs.Trigger>
        ))}
      </Tabs.List>
      {children}
    </Tabs.Root>
  );
};

// Card Component
interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  hoverable = false,
}) => {
  return (
    <div className={`card ${hoverable ? "card-hover" : ""} ${className}`}>
      {children}
    </div>
  );
};

// Empty State Component
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">{icon}</div>
      <h3 className="empty-state-title">{title}</h3>
      <p className="empty-state-description">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

// Error Message Component
interface ErrorMessageProps {
  title: string;
  message: string;
  onDismiss?: () => void;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  onDismiss,
}) => {
  return (
    <div className="rounded-lg border border-error-200 bg-error-50 p-4">
      <div className="flex">
        <AlertCircle className="h-5 w-5 text-error-600 mt-0.5" />
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-error-800">{title}</h3>
          <p className="text-sm text-error-700 mt-1">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-3 inline-flex rounded-md p-1.5 text-error-600 hover:bg-error-100 focus:outline-none focus:ring-2 focus:ring-error-600 focus:ring-offset-2 focus:ring-offset-error-50"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

// Loading Spinner Component
export const LoadingSpinner: React.FC<{ size?: "sm" | "md" | "lg" }> = ({
  size = "md",
}) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <div className="flex items-center justify-center p-4">
      <div className={`spinner ${sizeClasses[size]}`} />
    </div>
  );
};

// Badge Component
interface BadgeProps {
  variant?: "success" | "error" | "warning";
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = "success",
  children,
}) => {
  const variantClasses = {
    success: "badge-success",
    error: "badge-error",
    warning: "badge-warning",
  };

  return <span className={`badge ${variantClasses[variant]}`}>{children}</span>;
};
