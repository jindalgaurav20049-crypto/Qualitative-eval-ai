export interface UploadedFile {
  name: string;
  content: string;
}

export interface ManagementScorecardItem {
  criteria: string;
  score: number; // Score out of 10
  weight: number; // Percentage
  justification: string;
}

export interface PeerComparison {
  peerName: string;
  managementScore: number; // Overall comparative score
  notes: string;
}

export interface MoatAnalysis {
  source: string; // e.g., "Network Effects", "Intangible Assets"
  durability: "High" | "Medium" | "Low";
  description: string;
}

export interface EsgAnalysis {
  environmental: string;
  social: string;
  governance: string;
}

export interface RiskAndResilience {
  keyRisks: string[];
  resilienceFactors: string[];
}

export type Sentiment = 'Positive' | 'Negative' | 'Neutral';

export interface QualitativeReport {
  companyName: string;
  overallVerdict: string;
  verdictColor: 'green' | 'yellow' | 'red';
  summary: string;
  managementEvaluation: {
    scorecard: ManagementScorecardItem[];
    peerComparison: PeerComparison[];
    narrative: string;
    sentiment: Sentiment;
  };
  businessModel: string;
  moatAnalysis: MoatAnalysis;
  esgAnalysis: EsgAnalysis;
  corporateCulture: {
    description: string;
    sentiment: Sentiment;
  };
  riskAndResilience: RiskAndResilience;
  growthStrategy: string;
}

export interface AnalysisSource {
  title: string;
  uri: string;
}

export interface AnalysisResultData {
  report: QualitativeReport;
  sources: AnalysisSource[];
}