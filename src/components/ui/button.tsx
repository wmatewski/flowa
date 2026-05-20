"use client";

import type { ButtonHTMLAttributes, ReactElement, ReactNode } from "react";
import { cloneElement, isValidElement, forwardRef } from "react";

import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "ghost" | "destructive" | "outline";
type ButtonSize = "default" | "sm" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  size?: ButtonSize;
  variant?: ButtonVariant;
  children: ReactNode;
}

const buttonVariantClasses: Record<ButtonVariant, string> = {
  default: "wf-btn wf-btn-primary",
  secondary: "wf-btn wf-btn-secondary",
  ghost: "wf-link-button",
  destructive: "wf-btn wf-btn-secondary danger",
  outline: "wf-btn wf-btn-secondary",
};

const buttonSizeClasses: Record<ButtonSize, string> = {
  default: "",
  sm: "",
  lg: "wf-btn-large",
  icon: "wf-icon-button",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, children, className, size = "default", variant = "default", type = "button", ...props }, ref) => {
    const buttonClassName = cn(buttonVariantClasses[variant], buttonSizeClasses[size], className);

    if (asChild && isValidElement(children)) {
      const child = children as ReactElement<{ className?: string }>;
      return cloneElement(child, {
        ...props,
        className: cn(child.props.className, buttonClassName),
      } as React.Attributes & { className?: string }) as ReactElement;
    }

    return (
      <button ref={ref} className={buttonClassName} type={type} {...props}>
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
