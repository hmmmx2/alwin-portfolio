type ClassValue = string | number | null | undefined | false | ClassValue[];

/**
 * Minimal class joiner. The design maps almost one-to-one onto static utility
 * strings, so there is nothing here that needs tailwind-merge's conflict
 * resolution — and no reason to ship it.
 */
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) out.push(nested);
    } else {
      out.push(String(value));
    }
  }
  return out.join(" ");
}
