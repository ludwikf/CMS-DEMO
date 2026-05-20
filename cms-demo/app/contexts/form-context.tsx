"use client";
import { createContext, ReactNode, useContext, useState } from "react";

export type FormItem = {
  product: string;
  type: string;
  width: number;
  height: number;
  material: string;
  color: string;
  quantity: number;
  note?: string;
};

type ShippingData = {
  deliveryMethod: string;
  city?: string;
  address?: string;
  zipCode?: string;
  orderName?: string;
};

export type FormData = {
  forms: Record<string, FormItem[]>;
  shipping: ShippingData;
};

type FormContextType = {
  formData: FormData;
  setFormData: (data: FormData) => void;
  activeForm: string;
  setActiveForm: (data: string) => void;
  activeIndex: number;
  setActiveIndex: (data: number) => void;
  userId: string;
  setUserId: (data: string) => void;
};

const FormContext = createContext<FormContextType | undefined>(undefined);

export const FormProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState<string>("");
  const [activeForm, setActiveForm] = useState<string>("");
  const [formData, setFormData] = useState<FormData>({
    forms: {},
    shipping: {
      deliveryMethod: "",
      city: undefined,
      address: undefined,
      zipCode: undefined,
    },
  });
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <FormContext.Provider
      value={{
        activeForm,
        setActiveForm,
        formData,
        setFormData,
        activeIndex,
        setActiveIndex,
        userId,
        setUserId,
      }}
    >
      {children}
    </FormContext.Provider>
  );
};

export const useFormContext = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("useFormContext must be used within a FormProvider");
  }
  return context;
};
