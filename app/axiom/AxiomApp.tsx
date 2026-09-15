'use client';

/**
 * AxiomApp — client wrapper that manages conversation selection state,
 * wires the sidebar to AskInterface, and handles DB persistence.
 *
 * Rendered by axiom/page.tsx (server component) after auth checks.
 */

import { useState, useRef, useCallback } from 'react';
import { AskInterface, type AskTheme } from './AskInterface';
import { ConversationSidebar, type ConversationMeta } from './ConversationSidebar';

interface Props {
  sourceSummary?: string;
  reviewerName?:  string | null;
  userEmail?:     string;
  tier?:          string;
  status?:        string;
  theme?:         Partial<AskTheme>;
}

export function AxiomApp({ sourceSummary, reviewerName, userEmail, tier, status, theme }: Props) {
  // null = new (unsaved) conversation
  const [activeConvId,    setActiveConvId]    = useState<string | null>(null);
  const [activeConvTitle, setActiveConvTitle] = useState<string | null>(null);
  // Key forces AskInterface to remount (reset state) when switching conversations
  const [chatKey, setChatKey] = useState(0);
  // Initial turns when restoring a conversation from the sidebar
  const [initialTurns, setInitialTurns] = useState<unknown[]>([]);

  // Sidebar refresh function — sidebar registers this so we can trigger a refresh
  // after a new conversation is saved to DB
  const refreshSidebarRef = useRef<(() => void) | null>(null);

  const handleRegisterRefresh = useCallback((fn: () => void) => {
    refreshSidebarRef.current = fn;
  }, []);

  // User clicked a conversation in the sidebar
  async function handleSelectConversation(conv: ConversationMeta) {
    if (conv.id === activeConvId) return; // already active

    // Fetch full turns for the selected conversation
    try {
      const res = await fetch(`/codex/api/axiom/conversations/${conv.id}`);
      if (!res.ok) return;
      const data = await res.json();
      setInitialTurns(data.conversation?.turns ?? []);
    } catch {
      setInitialTurns([]);
    }

    setActiveConvId(conv.id);
    setActiveConvTitle(conv.title);
    // Remount AskInterface with the loaded turns
    setChatKey(k => k + 1);
  }

  // User clicked "New conversation" in sidebar
  function handleNew() {
    setActiveConvId(null);
    setActiveConvTitle(null);
    setInitialTurns([]);
    setChatKey(k => k + 1);
  }

  // A conversation was deleted — if it was active, start a new one
  function handleDelete(id: string) {
    if (id === activeConvId) handleNew();
  }

  // AskInterface calls this when it creates/updates a conversation
  // (title = first question, turns = current turns array, id = existing id or null)
  async function handleConversationSave(opts: {
    id:     string | null;
    title:  string;
    turns:  unknown[];
  }): Promise<string> {
    const { id, title, turns } = opts;

    if (!id) {
      // Create new conversation
      const res = await fetch('/codex/api/axiom/conversations', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ title, turns }),
      });
      const data = await res.json().catch(() => ({}));
      const newId = data.id as string;
      setActiveConvId(newId);
      setActiveConvTitle(title);
      // Refresh sidebar to show the new entry
      refreshSidebarRef.current?.();
      return newId;
    } else {
      // Update existing
      fetch(`/codex/api/axiom/conversations/${id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ turns, title }),
      }).then(() => {
        refreshSidebarRef.current?.();
      }).catch(() => {});
      return id;
    }
  }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
      {/* Sidebar — only shown for authenticated subscribers (not Fidelity demo) */}
      {userEmail && (
        <ConversationSidebar
          activeId={activeConvId}
          onSelect={handleSelectConversation}
          onNew={handleNew}
          onDelete={handleDelete}
          registerRefresh={handleRegisterRefresh}
          userEmail={userEmail}
          tier={tier}
          status={status}
        />
      )}

      {/* Chat — key forces remount when switching conversations */}
      <AskInterface
        key={chatKey}
        sourceSummary={sourceSummary}
        reviewerName={reviewerName}
        userEmail={userEmail}
        theme={theme}
        conversationId={activeConvId}
        initialTurns={initialTurns as any}
        onConversationSave={handleConversationSave}
      />
    </div>
  );
}
