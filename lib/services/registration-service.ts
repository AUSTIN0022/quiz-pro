import type { Registration, RegistrationFormData, ApiResponse } from '@/lib/types';
import registrationsData from '@/seed/registrations.json';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Generate unique IDs
const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const generateParticipantId = () => `QZCP${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

class RegistrationService {
  private registrations: Registration[] = registrationsData as Registration[];

  async createRegistration(
    contestId: string,
    formData: RegistrationFormData
  ): Promise<ApiResponse<Registration>> {
    await delay(500);
    
    // Check if already registered
    const existing = this.registrations.find(
      r => r.contestId === contestId && 
           r.participantDetails.email === formData.email
    );
    
    if (existing) {
      return {
        success: false,
        error: 'You are already registered for this contest'
      };
    }
    
    const registration: Registration = {
      id: `reg-${generateId()}`,
      contestId,
      participantId: generateParticipantId(),
      status: 'pending',
      registeredAt: new Date().toISOString(),
      paymentStatus: 'pending',
      participantDetails: {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth,
        institution: formData.institution,
        city: formData.city,
        state: formData.state,
        country: formData.country
      }
    };
    
    this.registrations.push(registration);
    
    return {
      success: true,
      data: registration,
      message: 'Registration created successfully'
    };
  }

  async processPayment(
    registrationId: string,
    _paymentDetails: { method: string }
  ): Promise<ApiResponse<Registration>> {
    await delay(1000); // Simulate payment processing
    
    const registration = this.registrations.find(r => r.id === registrationId);
    
    if (!registration) {
      return {
        success: false,
        error: 'Registration not found'
      };
    }
    
    // Simulate successful payment
    registration.paymentId = `pay-${generateId()}`;
    registration.paymentStatus = 'completed';
    registration.status = 'confirmed';
    
    return {
      success: true,
      data: registration,
      message: 'Payment processed successfully'
    };
  }

  async getRegistrationById(id: string): Promise<ApiResponse<Registration>> {
    await delay(200);
    
    const registration = this.registrations.find(r => r.id === id);
    
    if (!registration) {
      return {
        success: false,
        error: 'Registration not found'
      };
    }
    
    return {
      success: true,
      data: registration
    };
  }

  async getRegistrationByParticipantId(participantId: string): Promise<ApiResponse<Registration>> {
    await delay(200);
    
    const registration = this.registrations.find(r => r.participantId === participantId);
    
    if (!registration) {
      return {
        success: false,
        error: 'Registration not found'
      };
    }
    
    return {
      success: true,
      data: registration
    };
  }

  async verifyOTP(participantId: string, otp: string): Promise<ApiResponse<Registration>> {
    await delay(300);
    
    // For demo, accept any 6-digit OTP or "123456"
    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      return {
        success: false,
        error: 'Invalid OTP format'
      };
    }
    
    const registration = this.registrations.find(r => r.participantId === participantId);
    
    if (!registration) {
      return {
        success: false,
        error: 'Participant not found'
      };
    }
    
    if (registration.status !== 'confirmed') {
      return {
        success: false,
        error: 'Registration is not confirmed'
      };
    }
    
    return {
      success: true,
      data: registration,
      message: 'OTP verified successfully'
    };
  }

  async sendOTP(email: string): Promise<ApiResponse<{ sent: boolean }>> {
    await delay(400);
    
    // Simulate sending OTP
    return {
      success: true,
      data: { sent: true },
      message: `OTP sent to ${email}`
    };
  }
}

export const registrationService = new RegistrationService();
