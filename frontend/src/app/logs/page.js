'use client';

import AgentLogViewer from '@/components/ai/AgentLogViewer';

export default function LogsPage() {
  return (
    <div className="page-layout anim-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Agent Activity Logs</h1>
          <p className="page-subtitle">
            Transparent audit trail of all AI agent actions and tool executions
          </p>
        </div>
      </div>
      <AgentLogViewer />
    </div>
  );
}
