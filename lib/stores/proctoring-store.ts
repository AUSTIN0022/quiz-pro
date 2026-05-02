import { create } from 'zustand';

export type WarningType = 'TAB_SWITCH' | 'FULLSCREEN_EXIT' | 'MULTIPLE_FACES' | 'NO_FACE' | 'CAMERA_OFF';

interface Warning {
  type: WarningType;
  timestamp: string;
  count: number;
}

interface ProctoringState {
  // System check status
  isFullscreen: boolean;
  isCameraEnabled: boolean;
  isCameraPermissionGranted: boolean;
  
  // Face detection
  faceDetected: boolean;
  faceCount: number;
  lightingOk: boolean;
  
  // Violation tracking
  tabSwitchCount: number;
  fullscreenExitCount: number;
  maxTabSwitches: number;
  warnings: Warning[];
  
  // Warning state
  showWarning: boolean;
  warningMessage: string;
  currentWarningType: WarningType | null;
  
  // Disqualification
  isDisqualified: boolean;
  isFlagged: boolean;
  
  // Stream
  videoStream: MediaStream | null;
  
  // Actions
  setFullscreen: (value: boolean) => void;
  setCameraEnabled: (value: boolean) => void;
  setCameraPermissionGranted: (value: boolean) => void;
  setVideoStream: (stream: MediaStream | null) => void;
  
  recordTabSwitch: () => boolean; // Returns true if disqualified
  recordFullscreenExit: () => void;
  
  setWarning: (show: boolean, message?: string) => void;
  setMaxTabSwitches: (max: number) => void;
  
  enterFullscreen: () => Promise<boolean>;
  exitFullscreen: () => Promise<void>;
  requestCameraPermission: () => Promise<boolean>;
  
  reset: () => void;
}

export const useProctoringStore = create<ProctoringState>((set, get) => ({
  // Initial state
  isFullscreen: false,
  isCameraEnabled: false,
  isCameraPermissionGranted: false,
  tabSwitchCount: 0,
  fullscreenExitCount: 0,
  maxTabSwitches: 3,
  showWarning: false,
  warningMessage: '',
  isDisqualified: false,
  videoStream: null,
  
  // Actions
  setFullscreen: (value) => set({ isFullscreen: value }),
  setCameraEnabled: (value) => set({ isCameraEnabled: value }),
  setCameraPermissionGranted: (value) => set({ isCameraPermissionGranted: value }),
  setVideoStream: (stream) => set({ videoStream: stream }),
  
  recordTabSwitch: () => {
    const { tabSwitchCount, maxTabSwitches } = get();
    const newCount = tabSwitchCount + 1;
    
    if (newCount >= maxTabSwitches) {
      set({ 
        tabSwitchCount: newCount,
        isDisqualified: true,
        showWarning: true,
        warningMessage: 'You have been disqualified for exceeding the tab switch limit.'
      });
      return true;
    }
    
    set({ 
      tabSwitchCount: newCount,
      showWarning: true,
      warningMessage: `Warning: Tab switch detected (${newCount}/${maxTabSwitches}). You will be disqualified after ${maxTabSwitches} switches.`
    });
    
    return false;
  },
  
  recordFullscreenExit: () => {
    const { fullscreenExitCount } = get();
    set({ 
      fullscreenExitCount: fullscreenExitCount + 1,
      isFullscreen: false,
      showWarning: true,
      warningMessage: 'Please return to fullscreen mode to continue the quiz.'
    });
  },
  
  setWarning: (show, message = '') => {
    set({ showWarning: show, warningMessage: message });
  },
  
  setMaxTabSwitches: (max) => set({ maxTabSwitches: max }),
  
  enterFullscreen: async () => {
    try {
      if (typeof document !== 'undefined' && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        set({ isFullscreen: true });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },
  
  exitFullscreen: async () => {
    try {
      if (typeof document !== 'undefined' && document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
        set({ isFullscreen: false });
      }
    } catch {
      // Ignore errors
    }
  },
  
  requestCameraPermission: async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      set({ 
        isCameraPermissionGranted: true,
        isCameraEnabled: true,
        videoStream: stream
      });
      return true;
    } catch {
      set({ 
        isCameraPermissionGranted: false,
        isCameraEnabled: false
      });
      return false;
    }
  },
  
  reset: () => {
    const { videoStream } = get();
    
    // Stop any active video tracks
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }
    
    set({
      isFullscreen: false,
      isCameraEnabled: false,
      isCameraPermissionGranted: false,
      tabSwitchCount: 0,
      fullscreenExitCount: 0,
      showWarning: false,
      warningMessage: '',
      isDisqualified: false,
      videoStream: null
    });
  }
}));
