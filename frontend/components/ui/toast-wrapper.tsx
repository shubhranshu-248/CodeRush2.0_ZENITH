"use client";

import React from "react";
import { ToastProvider } from "./toast";

export const ToastWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <ToastProvider>{children}</ToastProvider>;
};
