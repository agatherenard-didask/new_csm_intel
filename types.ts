export type Tier = "Premium" | "Standard" | "Light";
export type ClientStage = "Kick off" | "Onboarding" | "Conception/diffusion" | "Running";
export type OnboardingTrack = "mentoring" | "formation initiale";
export type TicketStatus = "résolu" | "en cours" | "abandonné";

export interface SupportTicket {
  date: string;
  topic: string;
  status: TicketStatus;
  url: string;
}

export interface SupportConversation {
  date: string;
  topic: string;
}

export interface OnboardingData {
  track: OnboardingTrack;
  currentStep: string;
  startDate: string;
  plannedEndDate: string;
  mentor: string;
  mentorSentiment: number;
  mentorNote: string;
}

export interface PostTrainingSurvey {
  averageScore: number;
  responseCount: number;
  invitedCount: number;
  completedAt: string;
  dimensions: {
    pedagogie: number;
    mentor: number;
    plateforme: number;
    roi: number;
  };
  verbatims: {
    positive: string;
    critical: string;
  };
  typeformResultsUrl: string;
}

export interface Account {
  id: string;
  name: string;
  tier: Tier;
  csm: string;
  kam: string;
  pulse: number;          // 1–5
  start: string;          // dd/mm/yyyy
  end: string;            // dd/mm/yyyy
  uLog: number;           // days since last user login
  lLog: number;           // days since last long activity
  meet: number;           // days since last meeting
  next: string | null;    // next meeting date dd/mm/yyyy
  aiAct: boolean;
  aiMsg: number;
  coachAct: boolean;
  coachMsg: number;
  trend: number;          // % usage trend over 30d
  seatsUsed: number;
  seatsContract: number;
  creditsUsed: number;
  creditsContract: number;
  mrr: number;
  nps: number | null;
  clientStage: ClientStage;
  contentCreationCount: number;
  lastContentCreatedDate: string | null;
  lastEmailDate: string | null;
  lastInteractionDate: string | null;
  appName: string;
  appUrl: string;
  slackChannelUrl: string | null;
  onboarding: OnboardingData;
  postTrainingSurvey?: PostTrainingSurvey;
  healthScoreHistory: number[];
  riskChurnHistory: number[];
  supportConversations: SupportConversation[];
  supportTickets: SupportTicket[];
}

export interface ScoreDetails {
  pulsePts: number;
  engagementPts: number;
  relationPts: number;
  proactivityPts: number;
  engagementAvg: number;
  tierThreshold: number;
  healthScore: number;
}

export interface ChurnRiskDetails {
  total: number;
  healthRisk: number;
  timeRisk: number;
  daysToRenewal: number;
}

export interface AIAdoptionDetails {
  total: number;
  aiPts: number;
  aiUsagePts: number;
  coachPts: number;
}

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertCategory = "adoption" | "stakeholder" | "renewal" | "expansion" | "onboarding";

export interface Alert {
  id: string;
  accountId: string;
  category: AlertCategory;
  severity: AlertSeverity;
  title: string;
  detail: string;
  suggestedAction: string;
}

export interface PriorityEntry {
  account: Account;
  healthScore: number;
  churnRisk: ChurnRiskDetails;
  priorityScore: number;
  mainReason: string;
  suggestedAction: string;
  alerts: Alert[];
  segment: "churn_risk" | "adoption_issue" | "expansion" | "onboarding" | "healthy";
}

export interface PortfolioStats {
  totalAccounts: number;
  totalARR: number;
  healthyCount: number;
  atRiskCount: number;
  needsAttentionCount: number;
  avgHealthScore: number;
}
