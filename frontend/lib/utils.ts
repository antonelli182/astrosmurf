import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function normalizeUrl(url: string): string {
  let trimmed = url.trim();
  if (!trimmed) return trimmed;
  
  // Fix potentially malformed protocol from path joining (e.g. https:/google.com)
  // This handles https:/, https:///, etc. converting them to https://
  if (/^(https?):\/{1,3}(?=[^\/])/i.test(trimmed)) {
     trimmed = trimmed.replace(/^(https?):\/{1,3}/i, '$1://');
  }
  
  // If it starts with http/https, return as is
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  
  // Otherwise add https://
  return `https://${trimmed}`;
}

export function isValidUrl(url: string): boolean {
  try {
    const normalized = normalizeUrl(url);
    const parsed = new URL(normalized);
    // Basic check to ensure it has a hostname
    return !!parsed.hostname;
  } catch {
    return false;
  }
}
