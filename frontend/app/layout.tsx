import type { Metadata } from "next";
import "./globals.css";
import { ToastWrapper } from "@/components/ui/toast-wrapper";

export const metadata: Metadata = {
  title: "ForgeAI - Unified Agent Workflow Orchestrator",
  description: "Convert natural language goals into editable, observable, replayable multi-agent workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-[#090d16] text-gray-100 flex flex-col">
        <ToastWrapper>{children}</ToastWrapper>
      </body>
    </html>
  );
}
