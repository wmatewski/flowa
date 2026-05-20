import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "outline";

const badgeVariantClasses: Record<BadgeVariant, string> = {
  default: "wf-badge",
  secondary: "wf-pill wf-pill-soft",
  outline: "wf-pill",
};

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

export const Badge = ({ className, variant = "default", ...props }: BadgeProps) => (
  <div className={cn(badgeVariantClasses[variant], className)} {...props} />
);
