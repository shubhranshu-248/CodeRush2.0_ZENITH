"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ShieldCheck, XCircle, CheckCircle2 } from "lucide-react";

interface ApprovalGateProps {
  isOpen: boolean;
  onApprove: () => void;
  onReject: () => void;
}

export const ApprovalGate: React.FC<ApprovalGateProps> = ({ isOpen, onApprove, onReject }) => {
  return (
    <Modal isOpen={isOpen} onClose={onReject} title="Human Approval Required">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-950/15 border border-amber-500/15">
          <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs text-gray-300 leading-relaxed">
              The Verifier Agent has completed evaluation. Review the synthesized output before proceeding to final artifact generation.
            </p>
            <p className="text-[10px] text-gray-500 mt-1.5">
              This is a human-in-the-loop checkpoint per AE-03 workflow requirements.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-2.5 pt-2">
          <Button variant="outline" size="sm" onClick={onReject}>
            <XCircle className="w-3.5 h-3.5 text-red-400" />
            <span>Reject &amp; Revise</span>
          </Button>
          <Button variant="primary" size="sm" onClick={onApprove}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Approve Artifact</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
