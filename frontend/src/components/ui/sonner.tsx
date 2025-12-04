"use client";

import { useTheme } from "../../contexts/ThemeContext";
import { Toaster as Sonner } from 'sonner';
import type { ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      theme={theme === "light" ? "light" : "dark"}
      className="toaster group"
      toastOptions={{
        style: {
          background: theme === "light" ? "white" : "#1e293b",
          color: theme === "light" ? "#1e293b" : "#f8fafc",
          border: `1px solid ${theme === "light" ? "#e2e8f0" : "#334155"}`,
        },
      }}
      {...props}
    />
  );
};

export { Toaster };