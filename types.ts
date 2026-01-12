
export interface AuditRecord {
  id: string;
  location: string;
  section: string;
  points: number;
  maxPoints: number;
  submittedDate: string; // ISO format
  comment?: string;
  questionText?: string;
}

export type PerformanceRating = 'Poor' | 'Fair' | 'Good' | 'Excellent';

export interface ComparisonData {
  currentScore: number;
  previousScore: number;
  currentPoints: number;
  previousPoints: number;
  currentMaxPoints: number;
  previousMaxPoints: number;
  difference: number;
  percentageChange: number;
  rating: PerformanceRating;
}

export interface FilterState {
  location: string;
  section: string;
  searchQuery: string;
  answerFilter?: string;
  audit1Date: string;
  audit2Date: string;
  audit3Date: string;
}

export interface ChartDataPoint {
  date: string;
  audit1: number | null;
  audit2: number | null;
  audit3: number | null;
}
