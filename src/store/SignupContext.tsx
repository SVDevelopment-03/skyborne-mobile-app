import React, { createContext, useContext, useState } from 'react';

export interface Step2Data {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  agreeTerms: boolean;
  authProvider?: 'email' | 'google' | 'apple';
  googleId?: string;
  appleId?: string;
}

export interface Step3Data {
  phoneNumber: string;
  state?: string;
  city?: string;
}

export interface Step4Data {
  otp: string;
  tempUserId?: string;
}

export interface FormDataType {
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
}

interface SignupContextType {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  totalSteps: number;
  formData: FormDataType;
  updateStepData: (stepKey: keyof FormDataType, data: Partial<Step2Data | Step3Data | Step4Data>) => void;
  resetFormData: () => void;
}

const defaultFormData: FormDataType = {
  step2: {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    agreeTerms: false,
    authProvider: 'email',
    googleId: '',
    appleId: '',
  },
  step3: {
    phoneNumber: '',
  },
  step4: {
    otp: '',
    tempUserId: '',
  },
};

const SignupContext = createContext<SignupContextType | undefined>(undefined);

export const SignupProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentStep, setCurrentStep] = useState(2);
  const [formData, setFormData] = useState<FormDataType>(defaultFormData);

  const updateStepData = (
    stepKey: keyof FormDataType,
    data: Partial<Step2Data | Step3Data | Step4Data>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [stepKey]: { ...prev[stepKey], ...data },
    }));
  };

  const resetFormData = () => {
    setFormData(defaultFormData);
    setCurrentStep(2);
  };

  const value: SignupContextType = {
    currentStep,
    setCurrentStep,
    totalSteps: 4,
    formData,
    updateStepData,
    resetFormData,
  };

  return (
    <SignupContext.Provider value={value}>
      {children}
    </SignupContext.Provider>
  );
};

export const useSignup = (): SignupContextType => {
  const context = useContext(SignupContext);
  if (!context) {
    throw new Error('useSignup must be used within SignupProvider');
  }
  return context;
};