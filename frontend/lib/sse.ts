export class SSEClient {
  private eventSource: EventSource | null = null;

  connect(
    executionId: string,
    onEvent: (eventType: string, data: unknown) => void
  ) {
    this.close();

    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    this.eventSource = new EventSource(
      `${baseUrl}/api/v1/runs/${executionId}/events?stream=true`
    );

    // Backend emits uppercase named events matching EventType enum
    const events = [
      "EXECUTION_STARTED",
      "EXECUTION_COMPLETED",
      "STEP_STARTED",
      "STEP_COMPLETED",
      "STEP_FAILED",
      "APPROVAL_REQUIRED",
      "APPROVAL_SUBMITTED",
      "WORKFLOW_CREATED",
    ];

    events.forEach((eventName) => {
      this.eventSource!.addEventListener(eventName, (event: MessageEvent) => {
        try {
          const parsed = JSON.parse(event.data);
          onEvent(eventName, parsed);
        } catch (err) {
          console.error(`[SSE] Failed to parse ${eventName} payload`, err);
        }
      });
    });

    this.eventSource.onerror = () => {
      if (this.eventSource?.readyState === EventSource.CLOSED) {
        console.error("[SSE] Connection closed permanently");
        this.close();
      }
      // readyState CONNECTING = auto-reconnect in progress, do nothing
    };
  }

  close() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  get connected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }
}
