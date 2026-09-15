'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AccountMenu } from './AccountMenu';

const BILLING_URL = 'https://www.nssapros.com/settings/cards';

const BG      = '#0D1520';
const SURFACE = '#182435';
const BORDER  = '#1E2D42';
const ACCENT  = '#1C80BC';
const TEXT    = '#F0F4F8';
const MUTED   = '#8EA3B8';
const DIM     = '#4A6070';
const HOVER   = '#1A2B3E';
const ACTIVE  = '#1C3550';
const RED     = '#F87171';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ConversationMeta {
  id:         string;
  title:      string;
  pinned:     boolean;
  client_id:  string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientMeta {
  id:   string;
  name: string;
}

interface Props {
  activeId:         string | null;
  onSelect:         (conv: ConversationMeta) => void;
  onNew:            () => void;
  onDelete:         (id: string) => void;
  registerRefresh?: (fn: () => void) => void;
  userEmail?:       string;
  tier?:            string;
  status?:          string;
}

// ── Date grouping (used in Recent view) ───────────────────────────────────────

function groupByDate(convs: ConversationMeta[]): { label: string; items: ConversationMeta[] }[] {
  const now       = new Date();
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const week7     = today - 6 * 86400000;
  const month30   = today - 29 * 86400000;
  const groups: Record<string, ConversationMeta[]> = {
    Today: [], Yesterday: [], 'Previous 7 days': [], 'Previous 30 days': [], Older: [],
  };
  for (const c of convs) {
    const t = new Date(c.updated_at).getTime();
    if      (t >= today)     groups['Today'].push(c);
    else if (t >= yesterday) groups['Yesterday'].push(c);
    else if (t >= week7)     groups['Previous 7 days'].push(c);
    else if (t >= month30)   groups['Previous 30 days'].push(c);
    else                     groups['Older'].push(c);
  }
  return Object.entries(groups).filter(([, i]) => i.length > 0).map(([label, items]) => ({ label, items }));
}

// ── Client picker (submenu inside ⋮ menu) ────────────────────────────────────

interface ClientPickerProps {
  clients:          ClientMeta[];
  currentClientId:  string | null;
  onAssign:         (clientId: string | null) => void;
  onCreateClient:   (name: string) => Promise<ClientMeta>;
  onBack:           () => void;
}

function ClientPicker({ clients, currentClientId, onAssign, onCreateClient, onBack }: ClientPickerProps) {
  const [search,   setSearch]   = useState('');
  const [creating, setCreating] = useState(false);
  const [newName,  setNewName]  = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 30); }, []);

  const filtered = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    const client = await onCreateClient(name);
    onAssign(client.id);
  }

  return (
    <div>
      {/* Back */}
      <button
        onClick={onBack}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, width: '100%',
          padding: '8px 12px', background: 'none', border: 'none',
          cursor: 'pointer', fontSize: 12, color: MUTED, fontFamily: 'inherit',
          borderRadius: 6,
        }}
        onMouseEnter={e => e.currentTarget.style.background = HOVER}
        onMouseLeave={e => e.currentTarget.style.background = 'none'}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M8 2L4 6l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Add to client
      </button>

      <div style={{ height: 1, background: BORDER, margin: '3px 0' }} />

      {/* Search */}
      <div style={{ padding: '6px 8px' }}>
        <input
          ref={inputRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search clients…"
          style={{
            width: '100%', padding: '5px 8px', fontSize: 12,
            background: BG, border: `1px solid ${BORDER}`,
            borderRadius: 5, color: TEXT, outline: 'none',
            fontFamily: 'inherit', boxSizing: 'border-box' as const,
          }}
        />
      </div>

      {/* Client list */}
      <div style={{ maxHeight: 160, overflowY: 'auto', padding: '2px 4px' }}>
        {/* None / unassign */}
        <button
          onClick={() => onAssign(null)}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', padding: '7px 10px', background: 'none', border: 'none',
            cursor: 'pointer', fontSize: 12, color: !currentClientId ? TEXT : MUTED,
            fontFamily: 'inherit', borderRadius: 5, textAlign: 'left',
          }}
          onMouseEnter={e => e.currentTarget.style.background = HOVER}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <span style={{ fontStyle: 'italic' }}>No client</span>
          {!currentClientId && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
        </button>

        {filtered.map(client => (
          <button
            key={client.id}
            onClick={() => onAssign(client.id)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              width: '100%', padding: '7px 10px', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 12,
              color: client.id === currentClientId ? TEXT : MUTED,
              fontWeight: client.id === currentClientId ? 600 : 400,
              fontFamily: 'inherit', borderRadius: 5, textAlign: 'left',
            }}
            onMouseEnter={e => e.currentTarget.style.background = HOVER}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            <span>{client.name}</span>
            {client.id === currentClientId && (
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke={ACCENT} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        ))}

        {filtered.length === 0 && search && (
          <p style={{ fontSize: 11, color: DIM, padding: '4px 10px', margin: 0 }}>No matches</p>
        )}
      </div>

      <div style={{ height: 1, background: BORDER, margin: '3px 0' }} />

      {/* New client */}
      {!creating ? (
        <button
          onClick={() => { setCreating(true); setNewName(search); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, width: '100%',
            padding: '7px 10px', background: 'none', border: 'none',
            cursor: 'pointer', fontSize: 12, color: ACCENT, fontFamily: 'inherit', borderRadius: 5,
          }}
          onMouseEnter={e => e.currentTarget.style.background = HOVER}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          New client…
        </button>
      ) : (
        <div style={{ padding: '4px 8px 8px' }}>
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreating(false); }}
            placeholder="Client name"
            style={{
              width: '100%', padding: '5px 8px', fontSize: 12,
              background: BG, border: `1px solid ${ACCENT}`,
              borderRadius: 5, color: TEXT, outline: 'none',
              fontFamily: 'inherit', boxSizing: 'border-box' as const, marginBottom: 6,
            }}
          />
          <div style={{ display: 'flex', gap: 5 }}>
            <button onClick={handleCreate} style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 5, border: 'none', background: ACCENT, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Add</button>
            <button onClick={() => setCreating(false)} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 5, border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Context menu ──────────────────────────────────────────────────────────────

interface ContextMenuProps {
  conv:            ConversationMeta;
  clients:         ClientMeta[];
  onPin:           () => void;
  onRename:        () => void;
  onAssignClient:  (clientId: string | null) => void;
  onCreateClient:  (name: string) => Promise<ClientMeta>;
  onDelete:        () => void;
  onClose:         () => void;
  anchorRef:       React.RefObject<HTMLButtonElement | null>;
}

function ContextMenu({ conv, clients, onPin, onRename, onAssignClient, onCreateClient, onDelete, onClose, anchorRef }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [panel, setPanel] = useState<'main' | 'client'>('main');

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) &&
          anchorRef.current && !anchorRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose, anchorRef]);

  useEffect(() => {
    function handler(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const item = (icon: React.ReactNode, label: string, sub: React.ReactNode | null, onClick: () => void, danger = false) => (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', background: 'none', border: 'none',
        cursor: 'pointer', fontSize: 13, fontWeight: 500,
        color: danger ? RED : TEXT, fontFamily: 'inherit', textAlign: 'left',
        borderRadius: 6, transition: 'background 0.1s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = danger ? 'rgba(248,113,113,0.08)' : HOVER}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{icon}{label}</span>
      {sub}
    </button>
  );

  const currentClientName = clients.find(c => c.id === conv.client_id)?.name;

  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute', left: 8, right: 8, zIndex: 100,
        background: '#1E2D42', border: `1px solid #2A3F58`,
        borderRadius: 10, padding: '4px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
      }}
    >
      {panel === 'main' ? (
        <>
          {item(
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3.5 1.5L6.5 4.5 4 7 2.5 5.5l2.5-2.5L3.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
            conv.pinned ? 'Unpin' : 'Pin', null, onPin,
          )}
          {item(
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9.5 2l2.5 2.5L5 11.5H2.5V9L9.5 2z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
            'Rename', null, onRename,
          )}
          {item(
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 7h4M7 5v4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>,
            'Add to client',
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {currentClientName && <span style={{ fontSize: 11, color: DIM }}>{currentClientName}</span>}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>,
            () => setPanel('client'),
          )}
          <div style={{ height: 1, background: BORDER, margin: '3px 0' }} />
          {item(
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2.5 4h9M5.5 4V3h3v1M4.5 4v7a1 1 0 001 1h3a1 1 0 001-1V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>,
            'Delete', null, onDelete, true,
          )}
        </>
      ) : (
        <ClientPicker
          clients={clients}
          currentClientId={conv.client_id}
          onAssign={(id) => { onAssignClient(id); onClose(); }}
          onCreateClient={onCreateClient}
          onBack={() => setPanel('main')}
        />
      )}
    </div>
  );
}

// ── Conversation item ─────────────────────────────────────────────────────────

interface ConvItemProps {
  conv:           ConversationMeta;
  isActive:       boolean;
  clients:        ClientMeta[];
  onSelect:       () => void;
  onPin:          () => void;
  onRename:       (newTitle: string) => void;
  onAssignClient: (clientId: string | null) => void;
  onCreateClient: (name: string) => Promise<ClientMeta>;
  onDelete:       () => void;
}

function ConvItem({ conv, isActive, clients, onSelect, onPin, onRename, onAssignClient, onCreateClient, onDelete }: ConvItemProps) {
  const [hovered,    setHovered]    = useState(false);
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [renaming,   setRenaming]   = useState(false);
  const [renameVal,  setRenameVal]  = useState(conv.title);
  const [confirming, setConfirming] = useState(false);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const inputRef   = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) { setRenameVal(conv.title); setTimeout(() => inputRef.current?.select(), 30); }
  }, [renaming, conv.title]);

  function handleRenameSubmit() {
    const t = renameVal.trim();
    if (t) onRename(t);
    setRenaming(false);
  }

  if (confirming) {
    return (
      <div style={{ padding: '8px 10px', borderRadius: 8, background: 'rgba(248,113,113,0.06)', border: `1px solid rgba(248,113,113,0.2)`, marginBottom: 2 }}>
        <p style={{ margin: '0 0 6px', fontSize: 12, color: MUTED, lineHeight: 1.4 }}>Delete &ldquo;{conv.title.slice(0, 36)}&rdquo;?</p>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={onDelete} style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 5, border: 'none', background: '#DC2626', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
          <button onClick={() => setConfirming(false)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 5, border: `1px solid ${BORDER}`, background: 'transparent', color: MUTED, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <div
        onClick={renaming ? undefined : onSelect}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: renaming ? '5px 6px' : '7px 10px',
          borderRadius: 8, cursor: renaming ? 'default' : 'pointer',
          background: isActive ? ACTIVE : hovered ? HOVER : 'transparent',
          transition: 'background 0.1s', marginBottom: 1,
        }}
      >
        {conv.pinned && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
            <path d="M3.5 1.5L6.5 4.5 4 7 2.5 5.5l2.5-2.5L3.5 1.5z" stroke={MUTED} strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        )}

        {renaming ? (
          <input
            ref={inputRef}
            value={renameVal}
            onChange={e => setRenameVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleRenameSubmit(); } if (e.key === 'Escape') setRenaming(false); }}
            onBlur={handleRenameSubmit}
            style={{
              flex: 1, fontSize: 13, color: TEXT, background: BG,
              border: `1px solid ${ACCENT}`, borderRadius: 5,
              padding: '4px 8px', outline: 'none', fontFamily: 'inherit',
            }}
          />
        ) : (
          <span style={{
            flex: 1, fontSize: 13, color: isActive ? TEXT : MUTED,
            fontWeight: isActive ? 600 : 400,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.4,
          }}>
            {conv.title}
          </span>
        )}

        {!renaming && (hovered || isActive || menuOpen) && (
          <button
            ref={menuBtnRef}
            onClick={e => { e.stopPropagation(); setMenuOpen(o => !o); }}
            title="More options"
            style={{
              flexShrink: 0, background: menuOpen ? SURFACE : 'none', border: 'none',
              cursor: 'pointer', color: MUTED, padding: '2px 4px', borderRadius: 4, lineHeight: 1,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = TEXT; e.currentTarget.style.background = SURFACE; }}
            onMouseLeave={e => { if (!menuOpen) { e.currentTarget.style.color = MUTED; e.currentTarget.style.background = 'none'; }}}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="3"  r="1.1" fill="currentColor"/>
              <circle cx="7" cy="7"  r="1.1" fill="currentColor"/>
              <circle cx="7" cy="11" r="1.1" fill="currentColor"/>
            </svg>
          </button>
        )}
      </div>

      {menuOpen && (
        <ContextMenu
          conv={conv}
          clients={clients}
          anchorRef={menuBtnRef}
          onClose={() => setMenuOpen(false)}
          onPin={() => { setMenuOpen(false); onPin(); }}
          onRename={() => { setMenuOpen(false); setRenaming(true); }}
          onAssignClient={onAssignClient}
          onCreateClient={onCreateClient}
          onDelete={() => { setMenuOpen(false); setConfirming(true); }}
        />
      )}
    </div>
  );
}

// ── Client section (expandable) ───────────────────────────────────────────────

function ClientSection({ name, convs, activeId, clients, onSelect, onPin, onRename, onAssignClient, onCreateClient, onDelete }: {
  name: string; convs: ConversationMeta[]; activeId: string | null; clients: ClientMeta[];
  onSelect: (c: ConversationMeta) => void; onPin: (id: string) => void;
  onRename: (id: string, t: string) => void; onAssignClient: (id: string, cid: string | null) => void;
  onCreateClient: (name: string) => Promise<ClientMeta>; onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ marginBottom: 4 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6, width: '100%',
          padding: '8px 10px 4px', background: 'none', border: 'none',
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s', color: DIM }}>
          <path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: MUTED }}>{name}</span>
        <span style={{ fontSize: 10, color: DIM, marginLeft: 2 }}>({convs.length})</span>
      </button>
      {open && convs.map(conv => (
        <ConvItem
          key={conv.id} conv={conv} isActive={conv.id === activeId} clients={clients}
          onSelect={() => onSelect(conv)} onPin={() => onPin(conv.id)}
          onRename={(t) => onRename(conv.id, t)} onAssignClient={(cid) => onAssignClient(conv.id, cid)}
          onCreateClient={onCreateClient} onDelete={() => onDelete(conv.id)}
        />
      ))}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

export function ConversationSidebar({ activeId, onSelect, onNew, onDelete, registerRefresh, userEmail, tier, status }: Props) {
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [clients,       setClients]       = useState<ClientMeta[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [view,          setView]          = useState<'recent' | 'client'>('recent');
  const [collapsed,     setCollapsed]     = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [convRes, clientRes] = await Promise.all([
        fetch('/codex/api/axiom/conversations'),
        fetch('/codex/api/axiom/clients'),
      ]);
      if (convRes.ok)   setConversations((await convRes.json()).conversations   ?? []);
      if (clientRes.ok) setClients(      (await clientRes.json()).clients       ?? []);
    } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    if (registerRefresh) registerRefresh(fetchAll);
  }, [fetchAll, registerRefresh]);

  async function handlePin(id: string) {
    const conv = conversations.find(c => c.id === id);
    if (!conv) return;
    const pinned = !conv.pinned;
    setConversations(prev => prev.map(c => c.id === id ? { ...c, pinned } : c));
    fetch(`/codex/api/axiom/conversations/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pinned }) }).catch(() => {});
  }

  async function handleRename(id: string, newTitle: string) {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, title: newTitle } : c));
    fetch(`/codex/api/axiom/conversations/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: newTitle }) }).catch(() => {});
  }

  async function handleAssignClient(convId: string, clientId: string | null) {
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, client_id: clientId } : c));
    fetch(`/codex/api/axiom/conversations/${convId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ client_id: clientId }) }).catch(() => {});
  }

  async function handleCreateClient(name: string): Promise<ClientMeta> {
    const res = await fetch('/codex/api/axiom/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
    const data = await res.json();
    const client: ClientMeta = data.client;
    setClients(prev => [...prev, client].sort((a, b) => a.name.localeCompare(b.name)));
    return client;
  }

  async function handleDelete(id: string) {
    setConversations(prev => prev.filter(c => c.id !== id));
    fetch(`/codex/api/axiom/conversations/${id}`, { method: 'DELETE' }).catch(() => {});
    if (id === activeId) onNew();
    onDelete(id);
  }

  const convItemProps = (conv: ConversationMeta) => ({
    conv, isActive: conv.id === activeId, clients,
    onSelect:      () => onSelect(conv),
    onPin:         () => handlePin(conv.id),
    onRename:      (t: string) => handleRename(conv.id, t),
    onAssignClient:(cid: string | null) => handleAssignClient(conv.id, cid),
    onCreateClient: handleCreateClient,
    onDelete:      () => handleDelete(conv.id),
  });

  const pinned   = conversations.filter(c => c.pinned);
  const unpinned = conversations.filter(c => !c.pinned);

  // Client view grouping
  const byClient = clients.map(client => ({
    client,
    convs: unpinned.filter(c => c.client_id === client.id).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()),
  })).filter(g => g.convs.length > 0);

  const unassigned = unpinned.filter(c => !c.client_id).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

  // ── Collapsed rail ────────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <div style={{ width: 48, flexShrink: 0, background: BG, borderRight: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '12px 0', gap: 12 }}>
        <button onClick={() => setCollapsed(false)} title="Expand" style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: '6px' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M7 4l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button onClick={onNew} title="New conversation" style={{ background: 'none', border: 'none', cursor: 'pointer', color: MUTED, padding: '6px' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 4v10M4 9h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
        </button>
      </div>
    );
  }

  return (
    <div style={{
      width: 260, flexShrink: 0, background: BG, borderRight: `1px solid ${BORDER}`,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
    }}>

      {/* Brand + collapse */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 14px 14px', flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="https://eqipvrcmugnvkextqmym.supabase.co/storage/v1/object/public/site-resources/axiom-by-nssa.png" alt="AXIOM by NSSA" style={{ height: 22, width: 'auto', display: 'block', opacity: 0.9 }} />
        <button onClick={() => setCollapsed(true)} title="Collapse" style={{ background: 'none', border: 'none', cursor: 'pointer', color: DIM, padding: '2px', lineHeight: 1 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* Past-due warning */}
      {status === 'past_due' && (
        <div style={{ margin: '0 8px 4px', padding: '8px 10px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, flexShrink: 0 }}>
          <p style={{ margin: '0 0 3px', fontSize: 11, fontWeight: 700, color: '#FCD34D' }}>⚠ Payment issue</p>
          <a href={BILLING_URL} target="_blank" rel="noopener" style={{ fontSize: 11, color: '#FDE68A', textDecoration: 'underline' }}>Update billing to keep access →</a>
        </div>
      )}

      {/* New conversation */}
      <div style={{ padding: '10px 10px 6px', flexShrink: 0 }}>
        <button
          onClick={onNew}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: `1px solid ${BORDER}`, background: 'transparent', color: TEXT, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s, border-color 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = HOVER; e.currentTarget.style.borderColor = ACCENT; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = BORDER; }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
          New conversation
        </button>
      </div>

      {/* View toggle */}
      {conversations.length > 0 && (
        <div style={{ display: 'flex', padding: '4px 10px 8px', gap: 4, flexShrink: 0 }}>
          {(['recent', 'client'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                flex: 1, padding: '4px 0', borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 600, fontFamily: 'inherit',
                background: view === v ? SURFACE : 'transparent',
                color:      view === v ? TEXT    : DIM,
                transition: 'all 0.15s',
              }}
            >
              {v === 'recent' ? 'Recent' : 'By Client'}
            </button>
          ))}
        </div>
      )}

      {/* Conversation list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 6px 12px' }}>
        {loading && <div style={{ padding: '20px 12px', color: DIM, fontSize: 12, textAlign: 'center' }}>Loading…</div>}

        {!loading && conversations.length === 0 && (
          <div style={{ padding: '20px 12px', color: DIM, fontSize: 12, textAlign: 'center', lineHeight: 1.6 }}>
            No conversations yet.<br />Ask your first question to get started.
          </div>
        )}

        {/* Pinned (shown in both views) */}
        {!loading && pinned.length > 0 && (
          <div>
            <div style={{ padding: '10px 10px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: DIM, display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3.5 1.5L6.5 4.5 4 7 2.5 5.5l2.5-2.5L3.5 1.5z" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
              Pinned
            </div>
            {pinned.map(conv => <ConvItem key={conv.id} {...convItemProps(conv)} />)}
          </div>
        )}

        {/* ── RECENT VIEW ─────────────────────────────────────────────── */}
        {!loading && view === 'recent' && groupByDate(unpinned).map(group => (
          <div key={group.label}>
            <div style={{ padding: '10px 10px 4px', fontSize: 10, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', color: DIM }}>{group.label}</div>
            {group.items.map(conv => <ConvItem key={conv.id} {...convItemProps(conv)} />)}
          </div>
        ))}

        {/* ── CLIENT VIEW ─────────────────────────────────────────────── */}
        {!loading && view === 'client' && (
          <>
            {byClient.map(({ client, convs }) => (
              <ClientSection
                key={client.id} name={client.name} convs={convs}
                activeId={activeId} clients={clients}
                onSelect={onSelect} onPin={handlePin} onRename={handleRename}
                onAssignClient={handleAssignClient} onCreateClient={handleCreateClient}
                onDelete={handleDelete}
              />
            ))}
            {unassigned.length > 0 && (
              <ClientSection
                name="Unassigned" convs={unassigned}
                activeId={activeId} clients={clients}
                onSelect={onSelect} onPin={handlePin} onRename={handleRename}
                onAssignClient={handleAssignClient} onCreateClient={handleCreateClient}
                onDelete={handleDelete}
              />
            )}
            {byClient.length === 0 && unassigned.length === 0 && unpinned.length === 0 && (
              <p style={{ fontSize: 12, color: DIM, textAlign: 'center', padding: '16px 12px', lineHeight: 1.6 }}>
                No conversations yet.
              </p>
            )}
            {byClient.length === 0 && unassigned.length > 0 && unpinned.length > 0 && !pinned.length && (
              <p style={{ fontSize: 11, color: DIM, textAlign: 'center', padding: '8px 12px' }}>
                Use ⋮ → Add to client to group conversations.
              </p>
            )}
          </>
        )}
      </div>

      {/* Account menu */}
      {userEmail && (
        <div style={{ flexShrink: 0, borderTop: `1px solid ${BORDER}`, padding: '6px 6px' }}>
          <AccountMenu
            userEmail={userEmail} tier={tier} status={status}
            onClearAll={() => { setConversations([]); setClients([]); onNew(); }}
          />
        </div>
      )}
    </div>
  );
}
