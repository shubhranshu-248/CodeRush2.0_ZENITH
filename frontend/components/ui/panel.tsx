import React from "react";

interface PanelProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export const Panel: React.FC<PanelProps> = ({ title, children, className = "" }) => {
  return (
    <div className={`glass-panel rounded-xl p-4 shadow-xl ${className}`}>
      {title && (
        <div className="pb-3 mb-3 border-b border-white/[0.08]">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
};
