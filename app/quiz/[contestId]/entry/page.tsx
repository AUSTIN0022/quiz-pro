"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { KeyRound, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { registrationService } from "@/lib/services/registration-service";
import { CameraCheckWidget } from "@/components/features/proctoring/CameraCheckWidget";

export default function QuizEntryPage() {
  const params = useParams();
  const router = useRouter();
  const contestId = params.contestId as string;

  const [participantId, setParticipantId] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"id" | "otp" | "camera">("id");
  const [cameraReady, setCameraReady] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);

  const handleIdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const registration = await registrationService.getRegistrationById(participantId);
      
      if (!registration) {
        setError("Invalid Participant ID. Please check and try again.");
        setLoading(false);
        return;
      }

      if (registration.contestId !== contestId) {
        setError("This Participant ID is not registered for this contest.");
        setLoading(false);
        return;
      }

      // Simulate OTP send
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setStep("otp");
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const otpValue = otp.join("");
    
    if (otpValue.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      setLoading(false);
      return;
    }

    // Simulate OTP verification (any 6-digit code works for demo)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Move to camera check step
    setStep("camera");
    setOtp(["", "", "", "", "", ""]);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Quiz Entry</CardTitle>
            <CardDescription>
              {step === "id"
                ? "Enter your Participant ID to continue"
                : step === "otp"
                ? "Enter the OTP sent to your registered email"
                : "Verify your camera for proctoring"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {step === "id" ? (
              <form onSubmit={handleIdSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="participantId">Participant ID</Label>
                  <Input
                    id="participantId"
                    placeholder="e.g., QCP-2024-001"
                    value={participantId}
                    onChange={(e) => setParticipantId(e.target.value.toUpperCase())}
                    className="text-center font-mono text-lg tracking-wider"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Your Participant ID was provided when you registered
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading || !participantId}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Continue"
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Don&apos;t have a Participant ID?{" "}
                  <Link href="/contests" className="text-primary hover:underline">
                    Register for a contest
                  </Link>
                </p>
              </form>
            ) : (
              <form onSubmit={handleOtpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>One-Time Password</Label>
                  <div className="flex gap-2 justify-center">
                    {otp.map((digit, index) => (
                      <Input
                        key={index}
                        id={`otp-${index}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(index, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(index, e)}
                        className="w-12 h-12 text-center text-xl font-mono"
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    For demo purposes, enter any 6 digits
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying OTP...
                    </>
                  ) : (
                    "Verify & Continue"
                  )}
                </Button>

                <div className="flex justify-between text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("id");
                      setOtp(["", "", "", "", "", ""]);
                      setError(null);
                    }}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    Change Participant ID
                  </button>
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => alert("OTP resent! (Demo)")}
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            ) : step === "camera" ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (cameraReady && faceDetected) {
                    // Store participant info in session storage
                    sessionStorage.setItem("quizParticipant", JSON.stringify({
                      participantId,
                      contestId,
                      verified: true,
                    }));
                    router.push(`/quiz/${contestId}/system-check`);
                  }
                }}
                className="space-y-4"
              >
                <CameraCheckWidget
                  onCameraReady={setCameraReady}
                  onFaceDetected={setFaceDetected}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!cameraReady || !faceDetected}
                >
                  Proceed to System Check
                </Button>

                <button
                  type="button"
                  onClick={() => {
                    setStep("otp");
                    setOtp(["", "", "", "", "", ""]);
                  }}
                  className="w-full text-sm text-muted-foreground hover:text-foreground"
                >
                  Back to OTP
                </button>
              </form>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
