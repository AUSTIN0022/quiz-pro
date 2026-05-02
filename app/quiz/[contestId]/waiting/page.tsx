"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, Users, Trophy, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { contestService } from "@/lib/services/contest-service";
import type { Contest } from "@/lib/types";

export default function WaitingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const contestId = params.contestId as string;

  const [contest, setContest] = useState<Contest | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    const loadContest = async () => {
      const data = await contestService.getContestById(contestId);
      setContest(data);
    };
    loadContest();
  }, [contestId]);

  useEffect(() => {
    if (!contest) return;

    // For demo, set the quiz to start in 30 seconds
    const startTime = Date.now() + 30000;

    const interval = setInterval(() => {
      const remaining = Math.max(0, startTime - Date.now());
      setTimeRemaining(remaining);

      // Simulate participants joining
      setParticipantCount((prev) => Math.min(prev + Math.floor(Math.random() * 3), 50));

      if (remaining <= 0) {
        setIsReady(true);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [contest]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const startQuiz = () => {
    router.push(`/quiz/${contestId}/live`);
  };

  if (!contest) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg"
      >
        <Card className="overflow-hidden">
          <div className="bg-primary p-6 text-center">
            <Trophy className="h-12 w-12 text-primary-foreground mx-auto mb-3" />
            <h1 className="text-xl font-bold text-primary-foreground">{contest.title}</h1>
            <p className="text-primary-foreground/80 text-sm mt-1">Waiting Room</p>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Countdown Timer */}
            <div className="text-center">
              {!isReady ? (
                <>
                  <p className="text-sm text-muted-foreground mb-2">Quiz starts in</p>
                  <motion.div
                    key={timeRemaining}
                    initial={{ scale: 1.1 }}
                    animate={{ scale: 1 }}
                    className="text-5xl font-mono font-bold text-primary"
                  >
                    {timeRemaining !== null ? formatTime(timeRemaining) : "--:--"}
                  </motion.div>
                </>
              ) : (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="space-y-2"
                >
                  <CheckCircle className="h-12 w-12 text-success mx-auto" />
                  <p className="text-lg font-semibold text-success">Quiz is ready!</p>
                </motion.div>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted rounded-lg p-4 text-center">
                <Users className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{participantCount}</p>
                <p className="text-xs text-muted-foreground">Participants joined</p>
              </div>
              <div className="bg-muted rounded-lg p-4 text-center">
                <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
                <p className="text-2xl font-bold text-foreground">{contest.duration}</p>
                <p className="text-xs text-muted-foreground">Minutes duration</p>
              </div>
            </div>

            {/* Quiz Info */}
            <div className="rounded-lg border p-4 space-y-2">
              <h3 className="font-medium text-foreground">Quiz Information</h3>
              <div className="grid gap-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Questions</span>
                  <span className="text-foreground">{contest.totalQuestions}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Marks per Question</span>
                  <span className="text-foreground">{contest.marksPerQuestion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Negative Marking</span>
                  <span className="text-foreground">
                    {contest.negativeMarking ? `${contest.negativeMarkingValue} per wrong` : "No"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Question Navigation</span>
                  <span className="text-foreground">
                    {contest.allowSkipping ? "Free navigation" : "Sequential only"}
                  </span>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                Once you start the quiz, the timer will begin and cannot be paused.
                Make sure you are ready before clicking Start.
              </AlertDescription>
            </Alert>

            {/* Start Button */}
            <Button
              className="w-full"
              size="lg"
              disabled={!isReady}
              onClick={startQuiz}
            >
              {isReady ? "Start Quiz Now" : "Waiting for quiz to begin..."}
            </Button>

            {/* Tips */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Quick Tips:</p>
              <ul className="list-disc list-inside space-y-0.5">
                <li>Stay in fullscreen mode throughout the quiz</li>
                <li>Keep your face visible to the camera</li>
                <li>Do not switch tabs or windows</li>
                <li>Your progress is auto-saved every 30 seconds</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
