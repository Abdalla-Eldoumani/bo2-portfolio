import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// clsx resolves conditional class inputs; tailwind-merge drops the losing side
// of conflicting Tailwind utilities (e.g. px-2 + px-4 -> px-4).
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
