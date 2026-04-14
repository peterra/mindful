export function isAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false;
  const allow = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return allow.includes(userId);
}
