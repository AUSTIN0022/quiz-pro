import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Question, Answer, QuizAttempt, Contest } from '@/lib/types';

interface QuizState {
  // Current quiz session
  contest: Contest | null;
  attempt: QuizAttempt | null;
  questions: Question[];
  
  // Navigation
  currentQuestionIndex: number;
  
  // Timer
  remainingSeconds: number;
  isTimerRunning: boolean;
  
  // Answers (local state before sync)
  localAnswers: Map<string, Answer>;
  
  // UI State
  isSubmitting: boolean;
  showSubmitConfirm: boolean;
  
  // Actions
  initializeQuiz: (contest: Contest, attempt: QuizAttempt, questions: Question[]) => void;
  setCurrentQuestion: (index: number) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  
  selectOption: (questionId: string, optionId: string, isMultiple: boolean) => void;
  toggleReviewMark: (questionId: string) => void;
  
  updateTimer: (seconds: number) => void;
  startTimer: () => void;
  stopTimer: () => void;
  
  setSubmitting: (value: boolean) => void;
  setShowSubmitConfirm: (value: boolean) => void;
  
  getAnswer: (questionId: string) => Answer | undefined;
  getQuestionStatus: (questionId: string) => 'unanswered' | 'answered' | 'marked' | 'answered-marked';
  getProgress: () => { answered: number; marked: number; unanswered: number };
  
  clearQuiz: () => void;
}

export const useQuizStore = create<QuizState>()(
  persist(
    (set, get) => ({
      // Initial state
      contest: null,
      attempt: null,
      questions: [],
      currentQuestionIndex: 0,
      remainingSeconds: 0,
      isTimerRunning: false,
      localAnswers: new Map(),
      isSubmitting: false,
      showSubmitConfirm: false,
      
      // Actions
      initializeQuiz: (contest, attempt, questions) => {
        const answersMap = new Map<string, Answer>();
        attempt.answers.forEach(a => {
          answersMap.set(a.questionId, a);
        });
        
        set({
          contest,
          attempt,
          questions,
          currentQuestionIndex: 0,
          remainingSeconds: contest.durationMinutes * 60,
          isTimerRunning: false,
          localAnswers: answersMap,
          isSubmitting: false,
          showSubmitConfirm: false
        });
      },
      
      setCurrentQuestion: (index) => {
        const { questions } = get();
        if (index >= 0 && index < questions.length) {
          set({ currentQuestionIndex: index });
        }
      },
      
      nextQuestion: () => {
        const { currentQuestionIndex, questions } = get();
        if (currentQuestionIndex < questions.length - 1) {
          set({ currentQuestionIndex: currentQuestionIndex + 1 });
        }
      },
      
      previousQuestion: () => {
        const { currentQuestionIndex } = get();
        if (currentQuestionIndex > 0) {
          set({ currentQuestionIndex: currentQuestionIndex - 1 });
        }
      },
      
      selectOption: (questionId, optionId, isMultiple) => {
        const { localAnswers } = get();
        const current = localAnswers.get(questionId);
        const currentSelected = current?.selectedOptionIds || [];
        
        let newSelected: string[];
        
        if (isMultiple) {
          // Multiple select - toggle the option
          if (currentSelected.includes(optionId)) {
            newSelected = currentSelected.filter(id => id !== optionId);
          } else {
            newSelected = [...currentSelected, optionId];
          }
        } else {
          // Single select - replace
          newSelected = [optionId];
        }
        
        const newAnswer: Answer = {
          questionId,
          selectedOptionIds: newSelected,
          isMarkedForReview: current?.isMarkedForReview || false,
          timeSpentSeconds: current?.timeSpentSeconds || 0,
          answeredAt: new Date().toISOString()
        };
        
        const newAnswers = new Map(localAnswers);
        newAnswers.set(questionId, newAnswer);
        
        set({ localAnswers: newAnswers });
      },
      
      toggleReviewMark: (questionId) => {
        const { localAnswers } = get();
        const current = localAnswers.get(questionId);
        
        const newAnswer: Answer = {
          questionId,
          selectedOptionIds: current?.selectedOptionIds || [],
          isMarkedForReview: !current?.isMarkedForReview,
          timeSpentSeconds: current?.timeSpentSeconds || 0,
          answeredAt: current?.answeredAt
        };
        
        const newAnswers = new Map(localAnswers);
        newAnswers.set(questionId, newAnswer);
        
        set({ localAnswers: newAnswers });
      },
      
      updateTimer: (seconds) => {
        set({ remainingSeconds: Math.max(0, seconds) });
      },
      
      startTimer: () => {
        set({ isTimerRunning: true });
      },
      
      stopTimer: () => {
        set({ isTimerRunning: false });
      },
      
      setSubmitting: (value) => {
        set({ isSubmitting: value });
      },
      
      setShowSubmitConfirm: (value) => {
        set({ showSubmitConfirm: value });
      },
      
      getAnswer: (questionId) => {
        return get().localAnswers.get(questionId);
      },
      
      getQuestionStatus: (questionId) => {
        const answer = get().localAnswers.get(questionId);
        if (!answer) return 'unanswered';
        
        const hasAnswer = answer.selectedOptionIds.length > 0;
        const isMarked = answer.isMarkedForReview;
        
        if (hasAnswer && isMarked) return 'answered-marked';
        if (hasAnswer) return 'answered';
        if (isMarked) return 'marked';
        return 'unanswered';
      },
      
      getProgress: () => {
        const { questions, localAnswers } = get();
        let answered = 0;
        let marked = 0;
        let unanswered = 0;
        
        questions.forEach(q => {
          const answer = localAnswers.get(q.id);
          if (!answer || answer.selectedOptionIds.length === 0) {
            unanswered++;
          } else {
            answered++;
          }
          if (answer?.isMarkedForReview) {
            marked++;
          }
        });
        
        return { answered, marked, unanswered };
      },
      
      clearQuiz: () => {
        set({
          contest: null,
          attempt: null,
          questions: [],
          currentQuestionIndex: 0,
          remainingSeconds: 0,
          isTimerRunning: false,
          localAnswers: new Map(),
          isSubmitting: false,
          showSubmitConfirm: false
        });
      }
    }),
    {
      name: 'quizcraft-quiz-state',
      partialize: (state) => ({
        attempt: state.attempt,
        localAnswers: Array.from(state.localAnswers.entries()),
        remainingSeconds: state.remainingSeconds,
        currentQuestionIndex: state.currentQuestionIndex
      }),
      // Custom storage to handle Map serialization
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const data = JSON.parse(str);
          if (data.state?.localAnswers) {
            data.state.localAnswers = new Map(data.state.localAnswers);
          }
          return data;
        },
        setItem: (name, value) => {
          const data = {
            ...value,
            state: {
              ...value.state,
              localAnswers: value.state.localAnswers 
                ? Array.from(value.state.localAnswers.entries())
                : []
            }
          };
          localStorage.setItem(name, JSON.stringify(data));
        },
        removeItem: (name) => localStorage.removeItem(name)
      }
    }
  )
);
