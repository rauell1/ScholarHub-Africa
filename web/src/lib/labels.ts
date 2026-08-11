/**
 * Choice labels (port of apps/scholarships/templatetags/scholarship_tags.py).
 */
export const FUNDING_LABELS: Record<string, string> = {
  full: 'Full',
  partial: 'Partial',
  tuition_only: 'Tuition Only',
  living_only: 'Living Only',
};

export const ELIGIBILITY_LABELS: Record<string, string> = {
  CE: 'Confirmed Eligible',
  LE: 'Likely Eligible',
  PE: 'Pending Clarification',
  NE: 'Not Eligible',
};

export const STATUS_LABELS: Record<string, string> = {
  open_now: 'Open Now',
  opening_soon: 'Opening Soon',
  upcoming: 'Upcoming',
  not_yet_open: 'Not Yet Open',
  closed: 'Closed',
  ineligible: 'Ineligible',
  unknown: 'Unknown',
};

export const MBA_LABELS: Record<string, string> = {
  none: 'No impact',
  risk: 'Risk',
  disqualifies: 'Disqualifies',
  check: 'Check',
  unknown: 'Unknown',
};

export function fundingLabel(code: string): string {
  return FUNDING_LABELS[code] ?? code;
}

export function eligibilityLabel(code: string): string {
  return ELIGIBILITY_LABELS[code] ?? code;
}

export function statusLabel(code: string): string {
  return STATUS_LABELS[code] ?? code;
}

export function mbaLabel(code: string): string {
  return MBA_LABELS[code] ?? code;
}
