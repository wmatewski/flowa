import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export const Table = ({ className, ...props }: HTMLAttributes<HTMLTableElement>) => (
  <table className={cn("wf-table", className)} {...props} />
);

export const TableHeader = ({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn(className)} {...props} />
);

export const TableBody = ({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn(className)} {...props} />
);

export const TableRow = ({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={cn(className)} {...props} />
);

export const TableHead = ({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) => (
  <th className={cn(className)} {...props} />
);

export const TableCell = ({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) => (
  <td className={cn(className)} {...props} />
);
