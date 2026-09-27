/**
 * Format cents as a display price string (e.g. 5500 → "$55.00")
 */
export function formatUsdPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Generate a human-readable booking reference like UBD-2026-ABC123
 */
export function generateBookingReference(): string {
  const year = new Date().getFullYear();
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1 for readability
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `UBD-${year}-${code}`;
}
