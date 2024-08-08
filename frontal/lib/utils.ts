import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toTitleCase(str: string): string {
  if (!str) {
    return "";
  }

  return str.replace(
    /\w\S*/g,
    (text) => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase(),
  );
}

export function parseSize(size: string): number {
    if (!size) {
        throw new Error("Size is required");
    }

    // Regular expression to extract the number and the unit
    const regex = /^(\d+(?:\.\d+)?)([a-zA-Z]+)$/;
    const match = size.match(regex);
    
    if (!match) {
        throw new Error(`Invalid size format: ${size}`);
    }

    const value = parseFloat(match[1]);
    const unit = match[2].toLowerCase();

    // Convert the unit to bytes
    const unitConversion: { [key: string]: number } = {
        b: 1,
        kb: 1024,
        kib: 1024,
        mb: 1024 * 1024,
        mib: 1024 * 1024,
        gb: 1024 * 1024 * 1024,
        gib: 1024 * 1024 * 1024,
        tb: 1024 * 1024 * 1024 * 1024,
        tib: 1024 * 1024 * 1024 * 1024,
    };

    const unitFactor = unitConversion[unit];

    if (unitFactor === undefined) {
        throw new Error(`Unknown unit: ${unit}`);
    }

    return value * unitFactor;
}
