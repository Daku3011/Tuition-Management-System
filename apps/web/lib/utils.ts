import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = "INR"): string {
  if (currency === "INR") {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount);
}

export function formatDate(dateString: string | Date | undefined): string {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
