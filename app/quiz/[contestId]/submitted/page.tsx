"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle, Clock, FileText, Trophy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { contestService } from "@/lib/services/contest-service";
import type { Contest } from "@/lib/types";

export default function SubmittedPage() {
  const params = useParams();
  const contestId = params.contestId as string;

  const [contest, setContest] = useState<Contest | null>(null);

  useEffect(() => {
    const loadContest = async () => {
        
      const res = await contestService.getContestById(contestId);
      setContest(res.data ?? null);
    };
    loadContest();

    // Exit fullscreen if still active
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }

    // Trigger confetti animation on page load in the browser only
    let confettiTimer: number | undefined;
    let active = true;

    import('canvas-confetti').then(({ default: confetti }) => {
      if (!active) return;

      const confettiEffect = () => {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        setTimeout(() => {
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.6 },
          });
        }, 500);
      };

      confettiTimer = window.setTimeout(confettiEffect, 300);
    });

    return () => {
      active = false;
      if (confettiTimer) {
        window.clearTimeout(confettiTimer);
      }
    };
  }, [contestId]);

  const submissionTime = new Date().toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="w-full max-w-lg"
      >
        <Card className="overflow-hidden">
          {/* Success Header */}
          <div className="bg-success p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="h-20 w-20 text-success-foreground mx-auto mb-4" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold text-success-foreground"
            >
              Quiz Submitted Successfully!
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-success-foreground/80 mt-2"
            >
              Your responses have been recorded
            </motion.p>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Submission Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-lg border p-4 space-y-3"
            >
              <h2 className="font-semibold text-foreground">Submission Details</h2>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Contest
                  </span>
                  <span className="text-foreground font-medium">
                    {contest?.title || "Loading..."}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Submitted At
                  </span>
                  <span className="text-foreground">{submissionTime}</span>
                </div>
              </div>
            </motion.div>

            {/* What's Next */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="rounded-lg bg-muted p-4 space-y-3"
            >
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                What&apos;s Next?
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-medium">
                    1
                  </span>
                  <span>Your responses are being evaluated automatically</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-medium">
                    2
                  </span>
                  <span>Results will be published once evaluation is complete</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-medium">
                    3
                  </span>
                  <span>You&apos;ll receive an email notification with your results</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 text-xs font-medium">
                    4
                  </span>
                  <span>Check the leaderboard to see your ranking</span>
                </li>
              </ul>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <Link href={`/results/${contestId}`} className="flex-1">
                <Button className="w-full" size="lg">
                  View Results
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/contests" className="flex-1">
                <Button variant="outline" className="w-full" size="lg">
                  Browse More Contests
                </Button>
              </Link>
            </motion.div>

            {/* Footer Note */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-xs text-center text-muted-foreground"
            >
              Thank you for participating! If you have any questions, please contact support.
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
