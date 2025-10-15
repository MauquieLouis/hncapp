import React, { createContext, useContext, useState } from "react";

type SignupData = {
  email?: string;
  phone?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  gender?: "male" | "female";
  country?: string;
  password?: string;
  password2?: string;
};

type SignupContextType = {
  data: SignupData;
  setData: (values: Partial<SignupData>) => void;
  reset: () => void;
};

const SignupContext = createContext<SignupContextType | undefined>(undefined);

export const SignupProvider = ({ children }: { children: React.ReactNode }) => {
  const [data, setDataState] = useState<SignupData>({});

  const setData = (values: Partial<SignupData>) => {
    setDataState((prev) => ({ ...prev, ...values }));
  };

  const reset = () => setDataState({});

  return (
    <SignupContext.Provider value={{ data, setData, reset }}>
      {children}
    </SignupContext.Provider>
  );
};

export const useSignup = () => {
  const context = useContext(SignupContext);
  if (!context) {
    throw new Error("useSignup must be used within a SignupProvider");
  }
  return context;
};
