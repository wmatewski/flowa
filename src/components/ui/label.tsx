import type { LabelHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Label = ({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("wf-field-label", className)} {...props} />
);
