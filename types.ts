
export enum AnalysisStatus {
  PENDING = 'pending',
  ANALYZING = 'analyzing',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export interface ScreenAnalysis {
  id: string;
  screenName: string;
  url: string;
  screenshotFile?: File;
  screenshotPreviewUrl?: string;
  codeSnippet?: string;
  codeLanguage?: string; // e.g., 'tsx', 'html', 'javascript'
  analysisReport?: string;
  status: AnalysisStatus;
  error?: string;
  timestamp: number;
}
    