export const AU_STATES = ["NSW", "VIC", "QLD", "SA", "WA", "TAS", "ACT", "NT"] as const;
export type AuState = (typeof AU_STATES)[number];

// Launch states for the closed beta
export const LAUNCH_STATES: AuState[] = ["NSW", "VIC"];

export const TRADE_ROLES = [
  { value: "apprentice", label: "Apprentice" },
  { value: "electrician", label: "Licensed electrician" },
  { value: "supervisor", label: "Supervisor" },
  { value: "contractor", label: "Contractor / business owner" },
  { value: "specialist", label: "Specialist" },
] as const;
export type TradeRole = (typeof TRADE_ROLES)[number]["value"];

export const JOB_TYPES = [
  { value: "residential", label: "Residential" },
  { value: "commercial", label: "Commercial" },
  { value: "industrial", label: "Industrial" },
  { value: "solar_battery", label: "Solar & battery" },
  { value: "ev_charging", label: "EV charging" },
  { value: "data_centre", label: "Data centre / critical power" },
  { value: "controls", label: "Controls & automation" },
  { value: "other", label: "Other" },
] as const;
export type JobType = (typeof JOB_TYPES)[number]["value"];

export const URGENCY_LEVELS = [
  { value: "normal", label: "Normal", description: "No rush — answer when you can" },
  { value: "same_day", label: "Same day", description: "Need an answer today" },
  { value: "stuck_on_site", label: "Stuck on site", description: "Blocked right now on a job" },
] as const;
export type UrgencyLevel = (typeof URGENCY_LEVELS)[number]["value"];

export const RISK_LEVELS = [
  { value: "low", label: "Low risk", description: "Tools, quoting, business, learning" },
  { value: "moderate", label: "Moderate", description: "Fault finding, testing, configuration" },
  { value: "high", label: "High risk", description: "Switchboards, batteries, UPS, generators" },
  { value: "needs_expert", label: "Needs expert review", description: "Wants a senior reviewer to look at it" },
] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number]["value"];

export const SPECIALISATIONS = [
  "Switchboards",
  "Solar",
  "Battery storage",
  "EV charging",
  "Controls & automation",
  "Data centre",
  "UPS / critical power",
  "Testing & commissioning",
  "Fault finding",
  "Lighting",
  "Communications / data",
  "Hazardous areas",
] as const;

export const FLAG_REASONS = [
  { value: "unsafe", label: "Unsafe advice" },
  { value: "spam", label: "Spam or self-promotion" },
  { value: "privacy", label: "Privacy issue (faces, addresses, plans)" },
  { value: "off_topic", label: "Off topic" },
  { value: "other", label: "Other" },
] as const;

export const SAFETY_DISCLAIMER =
  "Peer-to-peer discussion between verified trade professionals. Not formal advice. " +
  "Electrical work must be carried out by appropriately licensed people — check the " +
  "requirements in your state and AS/NZS 3000 before acting on anything here.";

export function jobTypeLabel(value: string): string {
  return JOB_TYPES.find((j) => j.value === value)?.label ?? value;
}

export function urgencyLabel(value: string): string {
  return URGENCY_LEVELS.find((u) => u.value === value)?.label ?? value;
}

export function riskLabel(value: string): string {
  return RISK_LEVELS.find((r) => r.value === value)?.label ?? value;
}

export function tradeRoleLabel(value: string): string {
  return TRADE_ROLES.find((t) => t.value === value)?.label ?? value;
}
