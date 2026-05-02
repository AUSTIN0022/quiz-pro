// ============================================
// QuizCraft Pro - Core Types
// ============================================

// Base Types
export type ContestStatus = 'draft' | 'published' | 'active' | 'completed' | 'cancelled';
export type QuestionType = 'mcq' | 'msq' | 'fill' | 'trueFalse';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled';
export type AttemptStatus = 'not_started' | 'in_progress' | 'submitted' | 'timed_out' | 'disqualified';

// Contest & Questions
export interface Contest {
  id: string;
  title: string;
  slug: string;
  description: string;
  longDescription?: string;
  category: string;
  difficulty: DifficultyLevel;
  status: ContestStatus;
  bannerImage?: string;
  thumbnailImage?: string;
  
  // Timing
  registrationStartDate: string;
  registrationEndDate: string;
  contestDate: string;
  contestStartTime: string;
  contestEndTime: string;
  durationMinutes: number;
  
  // Configuration
  totalQuestions: number;
  totalMarks: number;
  passingMarks: number;
  negativeMarking: boolean;
  negativeMarkValue?: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  allowBackNavigation: boolean;
  
  // Registration
  registrationFee: number;
  maxParticipants: number;
  currentParticipants: number;
  
  // Proctoring
  proctoringEnabled: boolean;
  fullscreenRequired: boolean;
  webcamRequired: boolean;
  tabSwitchLimit: number;
  
  // Prizes
  prizes?: Prize[];
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  organizerId: string;
}

export interface Prize {
  rank: number | string; // 1, 2, 3 or "4-10"
  title: string;
  amount?: number;
  description?: string;
}

export interface Question {
  id: string;
  contestId: string;
  questionNumber: number;
  type: QuestionType;
  text: string;
  imageUrl?: string;
  options: Option[];
  correctOptionIds: string[];
  marks: number;
  negativeMarks: number;
  explanation?: string;
  difficulty: DifficultyLevel;
  tags?: string[];
}

export interface Option {
  id: string;
  text: string;
  imageUrl?: string;
}

// Registration & Participants
export interface Registration {
  id: string;
  contestId: string;
  participantId: string;
  status: RegistrationStatus;
  registeredAt: string;
  paymentId?: string;
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  participantDetails: ParticipantDetails;
}

export interface ParticipantDetails {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  institution?: string;
  city?: string;
  state?: string;
  country?: string;
  profileImage?: string;
}

// Quiz Attempt
export interface QuizAttempt {
  id: string;
  registrationId: string;
  contestId: string;
  participantId: string;
  status: AttemptStatus;
  startedAt?: string;
  submittedAt?: string;
  timeSpentSeconds: number;
  answers: Answer[];
  score?: number;
  rank?: number;
  percentile?: number;
  proctoringViolations: ProctoringViolation[];
}

export interface Answer {
  questionId: string;
  selectedOptionIds: string[];
  isMarkedForReview: boolean;
  timeSpentSeconds: number;
  answeredAt?: string;
}

export interface ProctoringViolation {
  type: 'tab_switch' | 'fullscreen_exit' | 'face_not_detected' | 'multiple_faces';
  timestamp: string;
  count: number;
}

// Results & Leaderboard
export interface QuizResult {
  attemptId: string;
  contestId: string;
  participantId: string;
  participantName: string;
  score: number;
  totalMarks: number;
  correctAnswers: number;
  wrongAnswers: number;
  unattempted: number;
  timeTaken: string;
  rank: number;
  totalParticipants: number;
  percentile: number;
  isPassed: boolean;
  breakdown: ResultBreakdown[];
}

export interface ResultBreakdown {
  questionId: string;
  questionNumber: number;
  questionText: string;
  yourAnswer: string[];
  correctAnswer: string[];
  isCorrect: boolean;
  marksObtained: number;
  maxMarks: number;
}

export interface LeaderboardEntry {
  rank: number;
  participantId: string;
  participantName: string;
  profileImage?: string;
  score: number;
  timeTaken: string;
  institution?: string;
}

// Form Types
export interface RegistrationFormData {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth?: string;
  institution?: string;
  city?: string;
  state?: string;
  country: string;
  agreeToTerms: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Filter Types
export interface ContestFilters {
  status?: ContestStatus;
  category?: string;
  difficulty?: DifficultyLevel;
  search?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

// ============================================
// Messaging & Templates
// ============================================

export type MessageChannel = 'whatsapp' | 'email' | 'both';
export type MessageStatus = 'draft' | 'scheduled' | 'sent' | 'failed';
export type SystemEventType = 'registration_confirmed' | 'day_before_reminder' | 'hour_reminder' | 'contest_started' | 'results_published' | 'certificate_ready';
export type RecipientFilter = 'all' | 'confirmed' | 'paid' | 'custom';

export interface MessageTemplate {
  id: string;
  orgId: string;
  name: string;
  channel: MessageChannel;
  body: string;
  variables: string[];
  isSystem: boolean;
  systemEvent?: SystemEventType;
  createdAt: string;
  updatedAt: string;
}

export interface MessageDraft {
  id: string;
  contestId: string;
  templateId: string;
  channel: MessageChannel;
  recipientFilter: RecipientFilter;
  customFilter?: Record<string, any>;
  recipientCount: number;
  scheduledFor?: string;
  status: MessageStatus;
  createdAt: string;
}

export interface SentMessage {
  id: string;
  contestId: string;
  templateId: string;
  channel: MessageChannel;
  sentAt: string;
  totalRecipients: number;
  deliveredCount: number;
  failedCount: number;
  status: 'sent' | 'partial' | 'failed';
}

// ============================================
// Organization & Team
// ============================================

export type TeamRole = 'admin' | 'editor' | 'viewer';
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  website?: string;
  industry?: string;
  logo?: string;
  favicon?: string;
  primaryColor?: string;
  secondaryColor?: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  testMode: boolean;
  aisensynAPIKey?: string;
  whatsappNumber?: string;
  smtpConfig?: {
    host: string;
    port: number;
    username: string;
    password: string;
    from: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  orgId: string;
  email: string;
  name: string;
  role: TeamRole;
  status: 'active' | 'inactive';
  joinedAt: string;
}

export interface TeamInvitation {
  id: string;
  orgId: string;
  email: string;
  role: TeamRole;
  status: InvitationStatus;
  sentAt: string;
  expiresAt: string;
  acceptedAt?: string;
}

export interface ParticipantProfile {
  id: string;
  participantId: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
  bio?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
  notificationPreferences: {
    emailReminders: boolean;
    whatsappReminders: boolean;
    emailResults: boolean;
  };
  createdAt: string;
  updatedAt: string;
}
