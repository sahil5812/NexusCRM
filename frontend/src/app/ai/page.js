'use client';

import ChatInterface from '@/components/ai/ChatInterface';

export default function AIConsolePage() {
  return (
    <div className="page-layout anim-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">AI Console</h1>
          <p className="page-subtitle">
            Natural language interface powered by the Orchestrator Agent
          </p>
        </div>
      </div>
      <div className="glass-card chat-container">
        <ChatInterface />
      </div>
    </div>
  );
}
