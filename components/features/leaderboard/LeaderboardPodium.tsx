'use client';

import { Trophy, Medal } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import type { QuizResult } from '@/lib/types';

interface LeaderboardPodiumProps {
  topThree: QuizResult[];
}

export function LeaderboardPodium({ topThree }: LeaderboardPodiumProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-400 to-yellow-600';
      case 2:
        return 'from-gray-300 to-gray-500';
      case 3:
        return 'from-orange-400 to-orange-600';
      default:
        return 'from-gray-300 to-gray-400';
    }
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) {
      return <Trophy className="h-5 w-5 text-yellow-600" />;
    }
    return <Medal className="h-5 w-5 text-gray-700" />;
  };

  // Arrange for podium: 2nd, 1st, 3rd
  const podiumOrder = [topThree[1], topThree[0], topThree[2]];
  const heights = ['h-40', 'h-56', 'h-32'];
  const positionText = ['2nd', '1st', '3rd'];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-center gap-6 min-h-96">
        {podiumOrder.map((result, idx) => {
          const rank = [2, 1, 3][idx];
          const isDisplayed = !!result;

          return (
            <motion.div
              key={`podium-${idx}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.2 }}
              className="flex flex-col items-center"
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="mb-4"
              >
                <div
                  className={`w-20 h-20 rounded-full bg-gradient-to-br ${getMedalColor(
                    rank
                  )} flex items-center justify-center text-white font-bold text-2xl`}
                >
                  {isDisplayed ? getInitials(result.participantName) : '-'}
                </div>
                <div className="absolute -top-2 -right-2">{getMedalIcon(rank)}</div>
              </motion.div>

              {isDisplayed && (
                <Card className={`w-48 ${heights[idx]}`}>
                  <CardContent className="p-4 flex flex-col justify-between h-full">
                    <div>
                      <div className="text-sm font-bold text-center text-amber-600 mb-2">
                        {positionText[idx]} PLACE
                      </div>
                      <p className="font-bold text-center text-lg truncate">
                        {result.participantName}
                      </p>
                      <p className="text-xs text-muted-foreground text-center">
                        {result.participantId.slice(-6)}
                      </p>
                    </div>

                    <div className="text-center space-y-1">
                      <div className="text-2xl font-bold text-primary">{result.score}</div>
                      <div className="text-xs text-muted-foreground">
                        {result.correctAnswers}/{result.totalMarks} correct
                      </div>
                      <div className="text-xs font-medium text-amber-600">
                        {Math.round((result.score / result.totalMarks) * 100)}%
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
