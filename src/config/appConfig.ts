/**
 * Runtime UI config from Vite env (no hardcoded deployment-specific strings).
 */
export function getComplianceFooterLabels(): string[] {
  const raw = import.meta.env.VITE_COMPLIANCE_LABELS?.trim();
  if (!raw) return [];
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}
