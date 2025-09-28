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

// Backtesting types for Moving Average Crossover Strategy
export interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface MovingAverageParameters {
  shortMA: number;  // Short-term moving average period (e.g., 20 days)
  longMA: number;   // Long-term moving average period (e.g., 50 days)
}

export interface Trade {
  entryDate: string;
  entryPrice: number;
  exitDate: string;
  exitPrice: number;
  type: 'long' | 'short';
  profit: number;
  profitPercent: number;
}

export interface BacktestResults {
  parameters: MovingAverageParameters;
  totalReturn: number;
  annualizedReturn: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  maxDrawdown: number;
  sharpeRatio: number;
  trades: Trade[];
  equityCurve: { date: string; equity: number; niftyValue: number }[];
  benchmarkReturn: number; // Nifty buy and hold return
  outperformance: number;  // Strategy return - benchmark return
}

export interface OptimizationResult {
  bestParameters: MovingAverageParameters;
  bestResult: BacktestResults;
  allResults: BacktestResults[];
}