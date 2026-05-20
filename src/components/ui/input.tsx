import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Input = ({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) => (
  <input className={cn("wf-input", className)} {...props} />
);
