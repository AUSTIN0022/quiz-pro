import { useState } from 'react';
import { analyticsService } from '@/lib/services/analytics-service';

export function useContestAnalytics(contestId: string) {
  const [loading] = useState(false);

  const analytics = analyticsService.getContestAnalytics(contestId);

  const getAverageScore = () => {
    let totalScore = 0;
    let totalParticipants = 0;

    analytics.scoreDistribution.forEach(item => {
      const rangeParts = item.range.split('-');
      const midpoint = (parseInt(rangeParts[0]) + parseInt(rangeParts[1])) / 2;
      totalScore += midpoint * item.count;
      totalParticipants += item.count;
    });

    return Math.round(totalScore / totalParticipants);
  };

  const getPassRate = () => {
    const passCount = analytics.scoreDistribution
      .filter(item => parseInt(item.range.split('-')[0]) >= 40)
      .reduce((sum, item) => sum + item.count, 0);
    const totalCount = analytics.scoreDistribution.reduce((sum, item) => sum + item.count, 0);
    return Math.round((passCount / totalCount) * 100);
  };

  return {
    analytics,
    loading,
    stats: {
      totalParticipants: analytics.scoreDistribution.reduce((sum, item) => sum + item.count, 0),
      averageScore: getAverageScore(),
      passRate: getPassRate(),
    },
  };
}
