"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Loader2,
  Phone,
  Mail,
  Shield,
  Monitor,
  Smartphone,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authService } from "@/lib/services/auth-service";
import { contestService } from "@/lib/services/contest-service";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useCameraStream } from "@/lib/hooks/useCameraStream";
import { CameraCheckWidget } from "@/components/features/proctoring/CameraCheckWidget";
import type { Contest } from "@/lib/types";

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════
type Step = "IDENTIFY" | "OTP" | "CAMERA" | "REDIRECTING";
type InputMode = "phone" | "email";

const STEP_INDEX: Record<Step, number> = {
  IDENTIFY: 0,
  OTP: 1,
  CAMERA: 2,
  REDIRECTING: 2,
};

// ═══════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════
const stepVariants = {
  enter: { x: 24, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -24, opacity: 0 },
};

// ═══════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════
export default function QuizEntryPage() {
  const params = useParams();
  const router = useRouter();
  const contestId = params.contestId as string;

  // Contest data
  const [contest, setContest] = useState<Contest | null>(null);
  const [contestLoading, setContestLoading] = useState(true);

  // Step machine
  const [step, setStep] = useState<Step>("IDENTIFY");
  const [inputMode, setInputMode] = useState<InputMode>("phone");

  // Identity
  const [identifier, setIdentifier] = useState("");
  const [maskedIdentifier, setMaskedIdentifier] = useState("");
  const [countryCode] = useState("+91");

  // OTP
  const [otpValues, setOtpValues] = useState<string[]>(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timers & state
  const [resendTimer, setResendTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [shakeOtp, setShakeOtp] = useState(false);

  // Device conflict
  const [showConflict, setShowConflict] = useState(false);

  // Camera
  const { stream, status: cameraStatus, errorMessage: cameraError, requestCamera, stopCamera } = useCameraStream();

  // Auth store
  const setSession = useAuthStore((s) => s.setSession);

  // ─── Load contest ───────────────────────────────
  useEffect(() => {
    const loadContest = async () => {
      const res = await contestService.getContestById(contestId);
      if (res.success && res.data) {
        setContest(res.data);
      }
      setContestLoading(false);
    };
    loadContest();
  }, [contestId]);

  // ─── Resend timer ───────────────────────────────
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  // ─── Focus first OTP cell on step change ────────
  useEffect(() => {
    if (step === "OTP") {
      setTimeout(() => otpRefs.current[0]?.focus(), 300);
    }
  }, [step]);

  // ─── Request camera on CAMERA step ──────────────
  useEffect(() => {
    if (step === "CAMERA") {
      requestCamera();
    }
    return () => {
      if (step === "CAMERA") stopCamera();
    };
  }, [step]);

  // ─── Full identifier with country code ──────────
  const getFullIdentifier = useCallback(() => {
    if (inputMode === "phone") return countryCode + identifier;
    return identifier;
  }, [inputMode, identifier, countryCode]);

  // ═══════════════════════════════════════════════════════
  // STEP 1: SEND OTP
  // ═══════════════════════════════════════════════════════
  const handleSendOTP = async () => {
    if (!identifier.trim()) return;
    setLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      const res = await authService.sendOTP(getFullIdentifier(), inputMode, contestId);
      if (res.success && res.data) {
        setMaskedIdentifier(res.data.maskedContact);
        setResendTimer(res.data.expiresIn || 60);
        setStep("OTP");
        setOtpValues(["", "", "", "", "", ""]);
      }
    } catch (err: unknown) {
      const e = err as { code?: string };
      const code = e?.code || "UNKNOWN";
      setErrorCode(code);
      if (code === "NOT_REGISTERED") {
        setError(`This ${inputMode} is not registered for this contest.`);
      } else if (code === "CONTEST_NOT_OPEN") {
        setError("This contest has not opened for entry yet.");
      } else if (code === "CONTEST_ENDED") {
        setError("This contest has ended and is no longer accepting entries.");
      } else if (code === "RATE_LIMITED") {
        setError("Too many attempts. Please wait 60 seconds.");
      } else {
        // For seed mode: if auth service returns success=false in response
        setError("Could not send OTP. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════
  // STEP 2: VERIFY OTP
  // ═══════════════════════════════════════════════════════
  const handleVerifyOTP = async (otpString?: string) => {
    if (loading) return;
    const otp = otpString || otpValues.join("");
    if (otp.length !== 6) return;

    setLoading(true);
    setError(null);
    setErrorCode(null);

    try {
      const res = await authService.verifyOTP(getFullIdentifier(), inputMode, otp, contestId);
      if (res.success && res.data) {
        setSession({
          sessionToken: res.data.sessionToken,
          participantId: res.data.registration.participantId,
          contestId,
          identifier: getFullIdentifier(),
          identifierType: inputMode,
          deviceId: res.data.deviceId,
        });

        if (contest?.proctoringEnabled && contest?.webcamRequired) {
          setStep("CAMERA");
        } else {
          handleRedirect();
        }
      } else {
        handleOTPError(res.error || "UNKNOWN", res.message);
      }
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string };
      handleOTPError(e?.code || "UNKNOWN", e?.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPError = (code: string, message?: string) => {
    if (code === "SESSION_CONFLICT") {
      setShowConflict(true);
      return;
    }

    setShakeOtp(true);
    setTimeout(() => setShakeOtp(false), 400);

    if (code === "INCORRECT_OTP" || code === "WRONG_OTP") {
      setAttemptsLeft((v) => Math.max(0, v - 1));
      setError(message || `Incorrect OTP. ${attemptsLeft - 1} attempts remaining.`);
      setOtpValues(["", "", "", "", "", ""]);
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } else if (code === "OTP_EXPIRED") {
      setError(message || "OTP expired. Please request a new one.");
    } else if (code === "MAX_ATTEMPTS_EXCEEDED") {
      setError(message || "Too many incorrect attempts. Please request a new OTP.");
    } else {
      setError(message || "Verification failed. Please try again.");
    }
  };

  // ═══════════════════════════════════════════════════════
  // SMART REDIRECT
  // ═══════════════════════════════════════════════════════
  const handleRedirect = () => {
    setStep("REDIRECTING");

    setTimeout(() => {
      if (!contest) {
        router.push(`/quiz/${contestId}/waiting`);
        return;
      }

      const now = new Date();
      const contestDate = contest.contestDate;
      const startParts = contest.contestStartTime.split(":");
      const endParts = contest.contestEndTime.split(":");

      const startTime = new Date(contestDate);
      startTime.setHours(parseInt(startParts[0]), parseInt(startParts[1]), 0);

      const endTime = new Date(contestDate);
      endTime.setHours(parseInt(endParts[0]), parseInt(endParts[1]), 0);

      if (now < startTime) {
        router.push(`/quiz/${contestId}/waiting`);
      } else if (now >= startTime && now < endTime) {
        router.push(`/quiz/${contestId}/live`);
      } else {
        router.push(`/quiz/${contestId}/submitted`);
      }
    }, 1500);
  };

  // ═══════════════════════════════════════════════════════
  // OTP INPUT HANDLERS
  // ═══════════════════════════════════════════════════════
  const handleOtpChange = (index: number, value: string) => {
    // Only digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newValues = [...otpValues];
    newValues[index] = digit;
    setOtpValues(newValues);

    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 filled
    if (digit && index === 5) {
      const full = newValues.join("");
      if (full.length === 6) {
        handleVerifyOTP(full);
      }
    } else if (digit) {
      const full = newValues.join("");
      if (full.length === 6) {
        handleVerifyOTP(full);
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace") {
      if (!otpValues[index] && index > 0) {
        otpRefs.current[index - 1]?.focus();
      } else {
        const newValues = [...otpValues];
        newValues[index] = "";
        setOtpValues(newValues);
      }
    } else if (e.key === "Tab") {
      // Let tab work naturally within OTP
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      otpRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      e.preventDefault();
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newValues = [...otpValues];
    for (let i = 0; i < pasted.length && i < 6; i++) {
      newValues[i] = pasted[i];
    }
    setOtpValues(newValues);

    const focusIndex = Math.min(pasted.length, 5);
    otpRefs.current[focusIndex]?.focus();

    if (pasted.length === 6) {
      handleVerifyOTP(pasted);
    }
  };

  const handleResend = async () => {
    setOtpValues(["", "", "", "", "", ""]);
    setError(null);
    setAttemptsLeft(3);
    setResendTimer(60);
    await authService.sendOTP(getFullIdentifier(), inputMode, contestId);
    otpRefs.current[0]?.focus();
  };

  // ═══════════════════════════════════════════════════════
  // DEVICE CONFLICT HANDLER
  // ═══════════════════════════════════════════════════════
  const handleForceSession = async () => {
    setLoading(true);
    try {
      const session = useAuthStore.getState();
      if (session.participantId) {
        await authService.forceSession(session.participantId, contestId);
      }
      setShowConflict(false);
      if (contest?.proctoringEnabled && contest?.webcamRequired) {
        setStep("CAMERA");
      } else {
        handleRedirect();
      }
    } catch {
      setError("Failed to take over session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════
  // PROGRESS DOTS
  // ═══════════════════════════════════════════════════════
  const totalDots = contest?.proctoringEnabled && contest?.webcamRequired ? 3 : 2;
  const currentDot = STEP_INDEX[step];

  // ═══════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════
  if (contestLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F2040 0%, #0D1117 100%)" }}>
        <Loader2 className="w-8 h-8 text-white/60 animate-spin" />
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════
  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "linear-gradient(135deg, #0F2040 0%, #0D1117 100%)" }}>

      {/* Device Conflict Modal */}
      {showConflict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card rounded-2xl shadow-2xl border p-6 max-w-sm w-full mx-4"
          >
            <div className="flex justify-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <Monitor className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-center mb-2">Already active on another device</h3>
            <p className="text-sm text-muted-foreground text-center mb-3">
              You have an active quiz session on another device. If you continue here, that session will be permanently closed. All answers saved so far will be preserved.
            </p>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 mb-4">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span className="text-xs text-amber-700 dark:text-amber-400">Your previous device will be logged out immediately</span>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowConflict(false)}>Cancel</Button>
              <Button variant="destructive" className="flex-1" onClick={handleForceSession} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Continue Here
              </Button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Main Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[480px]"
      >
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-6 pt-8 pb-6 sm:px-10 sm:pt-10 sm:pb-8">
            {/* Card Header */}
            {step !== "REDIRECTING" && (
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">QuizCraft Pro</span>
                </div>
                <h1 className="text-xl font-bold text-foreground mb-1">
                  {contest?.title || "Quiz Entry"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {step === "IDENTIFY" && "Verify your identity to enter"}
                  {step === "OTP" && "Enter the verification code"}
                  {step === "CAMERA" && "Camera check for proctoring"}
                </p>
              </div>
            )}

            {/* Step Content */}
            <AnimatePresence mode="wait">
              {/* ─── STEP 1: IDENTIFY ─────────────── */}
              {step === "IDENTIFY" && (
                <motion.div key="identify" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.26, ease: "easeOut" }}>
                  {/* Phone / Email Tabs */}
                  <div className="flex border-b border-border mb-5">
                    <button
                      type="button"
                      onClick={() => { setInputMode("phone"); setIdentifier(""); setError(null); }}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${inputMode === "phone" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    >
                      <Phone className="w-3.5 h-3.5" /> Phone
                    </button>
                    <button
                      type="button"
                      onClick={() => { setInputMode("email"); setIdentifier(""); setError(null); }}
                      className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${inputMode === "email" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    >
                      <Mail className="w-3.5 h-3.5" /> Email
                    </button>
                  </div>

                  {/* Phone Input */}
                  {inputMode === "phone" ? (
                    <div className="flex gap-2 mb-4">
                      <div className="flex items-center px-3 bg-muted rounded-lg text-sm font-mono text-muted-foreground min-w-[64px] justify-center border">
                        🇮🇳 {countryCode}
                      </div>
                      <Input
                        type="tel"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="9876543210"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className="flex-1 h-12 text-base font-mono"
                        aria-label="Phone number"
                        maxLength={10}
                      />
                    </div>
                  ) : (
                    <div className="mb-4">
                      <Input
                        type="email"
                        inputMode="email"
                        placeholder="you@example.com"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="h-12 text-base"
                        aria-label="Email address"
                      />
                    </div>
                  )}

                  {/* Error */}
                  {error && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800" role="alert" aria-live="polite">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                      {errorCode === "NOT_REGISTERED" && (
                        <a href={`/contests/${contestId}/register`} className="text-sm text-primary hover:underline mt-1 inline-block">
                          Register here →
                        </a>
                      )}
                    </div>
                  )}

                  {/* Send OTP Button */}
                  <Button onClick={handleSendOTP} disabled={!identifier.trim() || loading} className="w-full h-[52px] text-base font-semibold" aria-busy={loading}>
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" />Sending...</>
                    ) : (
                      "Send OTP"
                    )}
                  </Button>
                </motion.div>
              )}

              {/* ─── STEP 2: OTP ──────────────────── */}
              {step === "OTP" && (
                <motion.div key="otp" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.26, ease: "easeOut" }}>
                  {/* Back Button */}
                  <button
                    type="button"
                    onClick={() => { setStep("IDENTIFY"); setError(null); setOtpValues(["","","","","",""]); }}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>

                  <div className="text-center mb-5">
                    <h2 className="text-lg font-bold text-foreground mb-1">Enter the OTP</h2>
                    <p className="text-sm text-muted-foreground">
                      We sent a 6-digit code to <span className="font-mono font-medium text-foreground">{maskedIdentifier}</span>
                    </p>
                  </div>

                  {/* OTP Cells */}
                  <motion.div
                    className="flex justify-center gap-2 mb-4"
                    animate={shakeOtp ? { x: [0, 8, -8, 8, -8, 0] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    {otpValues.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                        className={`w-12 h-[60px] text-center text-2xl font-mono font-bold rounded-lg border-2 outline-none transition-all
                          ${error ? "border-red-400 dark:border-red-600" : digit ? "border-primary bg-primary/5" : "border-border"}
                          focus:border-primary focus:ring-2 focus:ring-primary/20
                          bg-white dark:bg-slate-700`}
                        aria-label={`Digit ${i + 1} of 6`}
                      />
                    ))}
                  </motion.div>

                  {/* Error */}
                  {error && (
                    <div className="mb-4 text-center" role="alert" aria-live="polite">
                      <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    </div>
                  )}

                  {/* Resend */}
                  <div className="text-center mb-4" aria-live="polite">
                    {resendTimer > 0 ? (
                      <p className="text-sm text-muted-foreground">Resend OTP in {resendTimer}s</p>
                    ) : (
                      <button type="button" onClick={handleResend} className="text-sm text-primary hover:underline font-medium">
                        Didn&apos;t receive it? Resend OTP
                      </button>
                    )}
                  </div>

                  {/* Verify Button */}
                  <Button onClick={() => handleVerifyOTP()} disabled={otpValues.join("").length < 6 || loading} className="w-full h-[52px] text-base font-semibold" aria-busy={loading}>
                    {loading ? (
                      <><Loader2 className="w-4 h-4 animate-spin mr-2" />Verifying...</>
                    ) : (
                      "Verify"
                    )}
                  </Button>
                </motion.div>
              )}

              {/* ─── STEP 3: CAMERA ───────────────── */}
              {step === "CAMERA" && (
                <motion.div key="camera" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.26, ease: "easeOut" }}>
                  <button
                    type="button"
                    onClick={() => { setStep("OTP"); stopCamera(); }}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back
                  </button>

                  <CameraCheckWidget
                    stream={stream}
                    cameraStatus={cameraStatus}
                    cameraError={cameraError}
                    onProceed={handleRedirect}
                    onRetryCamera={requestCamera}
                  />
                </motion.div>
              )}

              {/* ─── STEP 4: REDIRECTING ──────────── */}
              {step === "REDIRECTING" && (
                <motion.div key="redirecting" variants={stepVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.26, ease: "easeOut" }}>
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
                    <h2 className="text-lg font-bold text-foreground mb-1">Joining quiz...</h2>
                    <p className="text-sm text-muted-foreground">Please wait while we set things up</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Progress Dots */}
            {step !== "REDIRECTING" && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: totalDots }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      i <= currentDot ? "bg-primary scale-110" : "bg-border"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs text-white/40 mt-4">
          Powered by QuizCraft Pro • Secure Entry
        </p>
      </motion.div>
    </div>
  );
}
