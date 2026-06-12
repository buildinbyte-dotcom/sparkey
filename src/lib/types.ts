import type { AuState, JobType, RiskLevel, TradeRole, UrgencyLevel } from "./constants";

export type VerificationStatus = "unverified" | "pending" | "verified" | "rejected" | "expired";
export type QuestionStatus = "open" | "resolved" | "closed" | "removed";
export type FlagStatus = "open" | "upheld" | "dismissed";
export type FlagTarget = "question" | "answer" | "comment";
export type FlagReason = "unsafe" | "spam" | "privacy" | "off_topic" | "other";

export interface Profile {
  id: string;
  handle: string;
  display_name: string;
  real_name: string | null;
  state: AuState;
  trade_role: TradeRole;
  years_experience: number;
  bio: string | null;
  specialisations: string[];
  verification_status: VerificationStatus;
  is_admin: boolean;
  is_moderator: boolean;
  is_expert: boolean;
  is_founding_member: boolean;
  reputation: number;
  safety_score: number;
  created_at: string;
}

export interface Tag {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

export interface Question {
  id: string;
  author_id: string;
  title: string;
  body: string;
  state: AuState;
  job_type: JobType;
  urgency: UrgencyLevel;
  risk: RiskLevel;
  status: QuestionStatus;
  accepted_answer_id: string | null;
  outcome_note: string | null;
  view_count: number;
  needs_expert_review: boolean;
  created_at: string;
  author?: Profile;
  tags?: Tag[];
  answer_count?: number;
}

export interface QuestionMedia {
  id: string;
  question_id: string;
  storage_path: string;
  media_type: string;
}

export interface Answer {
  id: string;
  question_id: string;
  author_id: string;
  body: string;
  is_accepted: boolean;
  is_removed: boolean;
  helpful_count: number;
  includes_reference: boolean;
  created_at: string;
  author?: Profile;
}

export interface Comment {
  id: string;
  question_id: string | null;
  answer_id: string | null;
  author_id: string;
  body: string;
  is_removed: boolean;
  created_at: string;
  author?: Profile;
}

export interface Flag {
  id: string;
  reporter_id: string;
  target_type: FlagTarget;
  target_id: string;
  reason: FlagReason;
  detail: string | null;
  status: FlagStatus;
  created_at: string;
}

export interface LicenceVerification {
  id: string;
  user_id: string;
  state: AuState;
  licence_number: string;
  licence_class: string | null;
  status: VerificationStatus;
  expiry_date: string | null;
  checked_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

export interface CategoryScore {
  user_id: string;
  category: JobType;
  score: number;
}
