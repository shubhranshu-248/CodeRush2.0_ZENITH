"use client";

import { Suspense, useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Canvas } from "@/components/flow/canvas";
import { ExecutionMonitor } from "@/components/agent/execution-monitor";
import { ApprovalGate } from "@/components/agent/approval-gate";
import { AgentConfigPanel } from "@/components/agent/agent-config-panel";
import { ExportPanel } from "@/components/agent/export-panel";
import { ReplayModal } from "@/components/agent/replay-modal";
import { useExecution } from "@/hooks/use-execution";
import { useGraphGeneration } from "@/hooks/use-graph-generation";

function WorkspaceContent() {
  const execution = useExecution();
  const graph = useGraphGeneration();
  const [goal, setGoal] = useState("");
  const [mode, setMode] = useState<"demo" | "live">("live");

  const { startRun, approve, export: doExport, stopExecution } = execution;
  const searchParams = useSearchParams();
  const autoExecutedRef = useRef(false);

  // Auto-execute when navigated from home page with ?goal= param
  useEffect(() => {
    if (autoExecutedRef.current) return;
    const goalParam = searchParams.get("goal");
    if (goalParam && goalParam.trim()) {
      autoExecutedRef.current = true;
      const decoded = decodeURIComponent(goalParam).trim();
      setGoal(decoded);
      // Generate graph first, then execute after a short delay
      graph.generateGraph();
      const timer = setTimeout(() => {
        startRun(decoded);
      }, 1500); // allow graph animation to start
      return () => clearTimeout(timer);
    }
  }, [searchParams, startRun, graph]);

  // Export panel state
  const [exportPanelOpen, setExportPanelOpen] = useState(false);
  const [exportResult, setExportResult] = useState<Record<string, unknown> | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Replay modal state
  const [replayOpen, setReplayOpen] = useState(false);

  /** Phase 1: Generate Graph — animate nodes onto canvas */
  const handleGenerateGraph = useCallback(() => {
    if (!goal.trim()) return;
    graph.generateGraph();
  }, [goal, graph]);

  /** Phase 2: Execute Workflow — POST /run + SSE */
  const handleExecute = useCallback(async () => {
    if (mode === "live" && goal.trim()) {
      await startRun(goal.trim());
    }
  }, [mode, goal, startRun]);

  /** Header run button — in demo mode runs demo, in live mode triggers current phase */
  const handleRun = useCallback(async () => {
    if (mode === "demo") return;
    if (graph.graphReady) {
      await handleExecute();
    } else {
      handleGenerateGraph();
    }
  }, [mode, graph.graphReady, handleExecute, handleGenerateGraph]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const result = await doExport("MARKDOWN");
      if (result) {
        setExportResult(result as Record<string, unknown>);
      }
      setExportPanelOpen(true);
    } finally {
      setIsExporting(false);
    }
  }, [doExport]);

  const handleExportDownload = useCallback(async (format: "MARKDOWN" | "PDF") => {
    setIsExporting(true);
    try {
      const result = await doExport("MARKDOWN"); // always fetch markdown from backend
      if (!result) return;

      const data = result as Record<string, unknown>;
      const content = (data.content as string) ?? JSON.stringify(data, null, 2);

      if (format === "PDF") {
        // Open a styled print-preview page in a new tab
        const printWindow = window.open("", "_blank");
        if (!printWindow) return;

        // Convert markdown to basic HTML for print
        const htmlContent = content
          .replace(/^### (.+)$/gm, "<h3>$1</h3>")
          .replace(/^## (.+)$/gm, "<h2>$1</h2>")
          .replace(/^# (.+)$/gm, "<h1>$1</h1>")
          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
          .replace(/^- (.+)$/gm, "<li>$1</li>")
          .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
          .replace(/\n{2,}/g, "</p><p>")
          .replace(/\n/g, "<br/>");

        printWindow.document.write(`<!DOCTYPE html>
<html><head><title>ForgeAI Report</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', system-ui, sans-serif; color: #1a1a2e; padding: 48px 56px; max-width: 800px; margin: 0 auto; line-height: 1.7; }
  h1 { font-size: 26px; font-weight: 700; margin: 0 0 8px; color: #0f0f23; border-bottom: 2px solid #6366f1; padding-bottom: 12px; }
  h2 { font-size: 20px; font-weight: 600; margin: 28px 0 10px; color: #1e1e3f; }
  h3 { font-size: 16px; font-weight: 600; margin: 22px 0 8px; color: #2d2d5e; }
  p { margin: 10px 0; font-size: 14px; }
  ul { margin: 10px 0 10px 20px; }
  li { margin: 4px 0; font-size: 14px; }
  strong { font-weight: 600; }
  .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; padding-bottom: 16px; border-bottom: 1px solid #e5e7eb; }
  .brand { font-size: 12px; font-weight: 700; color: #6366f1; letter-spacing: 1px; text-transform: uppercase; }
  .date { font-size: 11px; color: #9ca3af; }
  @media print { body { padding: 32px; } .no-print { display: none; } }
</style></head><body>
<div class="header"><span class="brand">ForgeAI Report</span><span class="date">${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span></div>
<p>${htmlContent}</p>
<script>window.onload = function() { window.print(); }</script>
</body></html>`);
        printWindow.document.close();
      } else {
        // Markdown download
        const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "forgeai-report.md";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } finally {
      setIsExporting(false);
    }
  }, [doExport]);

  const handleApprove = useCallback(() => {
    approve(true);
  }, [approve]);

  const handleReject = useCallback(() => {
    approve(false);
  }, [approve]);

  const handleGoalChange = useCallback((newGoal: string) => {
    setGoal(newGoal);
    if (graph.graphReady || graph.isGenerating) {
      graph.resetGraph();
    }
  }, [graph]);

  const [configPanelNode, setConfigPanelNode] = useState<{
    id: string;
    data: Record<string, unknown>;
  } | null>(null);

  const handleNodeClick = useCallback((nodeId: string, nodeData: Record<string, unknown>) => {
    setConfigPanelNode({ id: nodeId, data: nodeData });
  }, []);

  const isRunning = execution.isStreaming || execution.isStarting;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#090d16]">
      <Header
        onRun={handleRun}
        onExport={handleExport}
        isRunning={isRunning}
        onStop={stopExecution}
        mode={mode}
        onModeChange={setMode}
        hasGoal={goal.trim().length > 0}
        graphReady={graph.graphReady}
        onReplay={execution.runId ? () => setReplayOpen(true) : undefined}
      />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          goal={goal}
          onGoalChange={handleGoalChange}
          onGenerateGraph={handleGenerateGraph}
          onSubmitGoal={handleExecute}
          isRunning={isRunning}
          isGenerating={graph.isGenerating}
          graphReady={graph.graphReady}
        />
        <main className="flex-1 flex flex-col relative overflow-hidden">
          <Canvas
            visibleNodes={graph.visibleNodes}
            visibleEdges={graph.visibleEdges}
            allNodes={graph.allNodes}
            setNodes={graph.setNodes}
            execution={execution}
            mode={mode}
            onNodeClick={handleNodeClick}
          />
          <ExecutionMonitor
            logs={execution.logs}
            isStreaming={execution.isStreaming}
            elapsed={execution.elapsed}
            progress={execution.progress}
            error={execution.error}
            currentNode={execution.currentNode}
            completedNodes={execution.completedNodes}
            totalTokens={execution.totalTokens}
            totalCost={execution.totalCost}
          />
        </main>
      </div>
      <ApprovalGate
        isOpen={execution.approvalRequired}
        onApprove={handleApprove}
        onReject={handleReject}
      />
      <AgentConfigPanel
        isOpen={configPanelNode !== null}
        onClose={() => setConfigPanelNode(null)}
        nodeId={configPanelNode?.id ?? null}
        nodeData={configPanelNode?.data ?? null}
      />
      <ExportPanel
        isOpen={exportPanelOpen}
        onClose={() => setExportPanelOpen(false)}
        result={exportResult}
        onExport={handleExportDownload}
        isExporting={isExporting}
      />
      <ReplayModal
        isOpen={replayOpen}
        onClose={() => setReplayOpen(false)}
        executionId={execution.runId}
      />
    </div>
  );
}

export default function WorkspacePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center bg-[#090d16] text-gray-500">Loading workspace...</div>}>
      <WorkspaceContent />
    </Suspense>
  );
}
