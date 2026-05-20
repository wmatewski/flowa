import type { TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Textarea = ({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea className={cn("wf-textarea", className)} {...props} />
);
