
import { AuditRecord, ComparisonData, FilterState, PerformanceRating } from './types';

export const getPerformanceRating = (percentage: number): PerformanceRating => {
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 75) return 'Good';
  if (percentage >= 50) return 'Fair';
  return 'Poor';
};

export const formatDate = (d?: string): string => {
  if (!d) return '';
  // If already YYYY-MM-DD, just reorder
  const isoMatch = d.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    return `${isoMatch[3]}-${isoMatch[2]}-${isoMatch[1]}`;
  }
  // Try parsing other ISO or date strings
  const parsed = new Date(d);
  if (!isNaN(parsed.getTime())) {
    const dd = String(parsed.getDate()).padStart(2, '0');
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const yyyy = parsed.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }
  return d;
};

export const calculateAggregate = (records: AuditRecord[]): { points: number; maxPoints: number; score: number } => {
  if (records.length === 0) return { points: 0, maxPoints: 0, score: 0 };
  const points = records.reduce((sum, r) => sum + r.points, 0);
  const maxPoints = records.reduce((sum, r) => sum + r.maxPoints, 0);
  return {
    points,
    maxPoints,
    score: (points / maxPoints) * 100
  };
};

export const filterRecordsByDate = (records: AuditRecord[], filters: FilterState, targetDate: string): AuditRecord[] => {
  if (!targetDate) return [];
  const query = (filters.searchQuery || '').toLowerCase();

  return records.filter(r => {
    const locMatch = !filters.location || filters.location === 'All' || r.location === filters.location;
    const secMatch = !filters.section || filters.section === 'All' || r.section === filters.section;
    const dateMatch = r.submittedDate === targetDate;
    const searchMatch = !query || r.location.toLowerCase().includes(query) || r.section.toLowerCase().includes(query);

    return locMatch && secMatch && dateMatch && searchMatch;
  });
};

/**
 * Compares current audit records against previous audit records.
 * Returns positive delta/change if current is higher than previous.
 */
export const getComparison = (currentRecs: AuditRecord[], previousRecs: AuditRecord[]): ComparisonData => {
  const current = calculateAggregate(currentRecs);
  const previous = calculateAggregate(previousRecs);
  
  const diff = current.score - previous.score;
  const percChange = previous.score === 0 ? 0 : (diff / previous.score) * 100;

  // Determine rating by majority of individual record ratings when available
  const ratingFromMajority = (recs: AuditRecord[]) => {
    if (!recs || recs.length === 0) return null;
    const counts: Record<string, number> = {};
    recs.forEach(r => {
      const pct = r.maxPoints > 0 ? (r.points / r.maxPoints) * 100 : 0;
      const rt = getPerformanceRating(pct);
      counts[rt] = (counts[rt] || 0) + 1;
    });
    // pick highest count; tie-breaker: prefer higher rating by order
    const order = ['Poor', 'Fair', 'Good', 'Excellent'];
    let best = order[0];
    let bestCount = counts[best] || 0;
    order.forEach(r => {
      const c = counts[r] || 0;
      if (c > bestCount) {
        best = r;
        bestCount = c;
      }
    });
    return best;
  };

  const majorityRating = ratingFromMajority(currentRecs) || getPerformanceRating(current.score);

  return {
    currentScore: current.score,
    previousScore: previous.score,
    currentPoints: current.points,
    previousPoints: previous.points,
    currentMaxPoints: current.maxPoints,
    previousMaxPoints: previous.maxPoints,
    difference: diff,
    percentageChange: percChange,
    rating: majorityRating as PerformanceRating
  };
};
