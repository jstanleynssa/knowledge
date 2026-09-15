'use client';

/**
 * AccountMenu — bottom-of-sidebar account management popover.
 * Shows email, subscription tier, clear-all conversations, and sign out.
 */

import { useState, useRef, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';

const BG     = '#0D1520';
const SURFACE= '#1A2B3E';
const BORDER = '#1E2D42';
const TEXT   = '#F0F4F8';
const MUTED  = '#8EA3B8';
const DIM    = '#4A6070';
const ACCENT = '#1C80BC';
const RED    = '#F87171';

// Update this URL when switching to arpinstitute.com
const BILLING_URL = 'https://www.nssapros.com/settings/cards';

const TIER_LABEL: Record<string, string> = {
  standard:   'Standard',
  arpi_grad:  'ARPI Graduate',
  firm:       'Firm',
  staff:      'Staff',
};

interface Props {
  userEmail:   string;
  tier?:       string;
  status?:     string;
  onClearAll?: () => void;
}

function initials(email: string) {
  const name = email.split('@')[0];
  const parts = name.split(/[._-]/);
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

export function AccountMenu({ userEmail, tier = 'standard', status = 'active', onClearAll }: Props) {
  const [open,        setOpen]        = useState(false);
  const [confirming,  setConfirming]  = useState(false);
  const [signingOut,  setSigningOut]  = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirming(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  async function handleSignOut() {
    setSigningOut(true);
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await supabase.auth.signOut();
    window.location.href = '/codex/axiom/login';
  }

  async function handleClearAll() {
    try {
      // Fetch all conversation ids then delete
      const res  = await fetch('/codex/api/axiom/conversations');
      const data = await res.json().catch(() => ({}));
      const ids: string[] = (data.conversations ?? []).map((c: { id: string }) => c.id);
      await Promise.all(
        ids.map(id => fetch(`/codex/api/axiom/conversations/${id}`, { method: 'DELETE' }))
      );
    } catch { /* ignore */ }
    onClearAll?.();
    setConfirming(false);
    setOpen(false);
  }

  return (
    <div ref={menuRef} style={{ position: 'relative' }}>

      {/* ── Trigger button ─────────────────────────────────────────────── */}
      <button
        onClick={() => { setOpen(o => !o); setConfirming(false); }}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          borderRadius: 8, textAlign: 'left',
          transition: 'background 0.15s',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#1A2B3E'}
        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      >
        {/* Avatar */}
        <div style={{
          width: 30, height: 30, borderRadius: '50%',
          background: ACCENT, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, flexShrink: 0, letterSpacing: '.05em',
        }}>
          {initials(userEmail)}
        </div>
        {/* Email */}
        <span style={{
          flex: 1, fontSize: 12, color: MUTED,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {userEmail}
        </span>
        {/* Chevron */}
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, color: DIM }}>
          <path d={open ? 'M2 8l4-4 4 4' : 'M2 4l4 4 4-4'} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* ── Popover ────────────────────────────────────────────────────── */}
      {open && (
        <div style={{
          position: 'absolute', bottom: '100%', left: 8, right: 8,
          marginBottom: 6,
          background: SURFACE,
          border: `1px solid ${BORDER}`,
          borderRadius: 10,
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
          zIndex: 50,
        }}>

          {/* Account info */}
          <div style={{ padding: '14px 14px 10px', borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: TEXT, marginBottom: 6,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {userEmail}
            </div>

            {/* Status badge */}
            {status === 'past_due' ? (
              <div style={{
                background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 8, padding: '8px 10px', marginBottom: 8,
              }}>
                <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: '#FCD34D' }}>
                  ⚠ Payment issue
                </p>
                <p style={{ margin: '0 0 6px', fontSize: 11, color: '#FDE68A', lineHeight: 1.5 }}>
                  Your subscription has a billing issue. Update your payment method to keep access.
                </p>
                <a
                  href={BILLING_URL}
                  target="_blank"
                  rel="noopener"
                  style={{
                    fontSize: 11, fontWeight: 700, color: '#FCD34D',
                    textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 3,
                  }}
                >
                  Update billing →
                </a>
              </div>
            ) : (
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '.08em',
                textTransform: 'uppercase', color: '#34D399',
                background: 'rgba(52,211,153,0.12)',
                border: '1px solid rgba(52,211,153,0.25)',
                borderRadius: 99, padding: '2px 8px',
                display: 'inline-block', marginBottom: 2,
              }}>
                Active
              </span>
            )}
          </div>

          {/* Actions */}
          <div style={{ padding: '6px 0' }}>

            {/* Manage billing */}
            <a
              href={BILLING_URL}
              target="_blank"
              rel="noopener"
              style={{ ...menuItemStyle(), textDecoration: 'none', display: 'flex' }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#1E3047'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x="1.5" y="3" width="10" height="7.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M1.5 6h10" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
              Manage billing
            </a>

            {/* Clear all conversations */}
            {!confirming ? (
              <button
                onClick={() => setConfirming(true)}
                style={menuItemStyle()}
                onMouseEnter={e => e.currentTarget.style.background = '#1E3047'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 3.5h9M5 3.5V2.5h3v1M4 3.5v7a1 1 0 001 1h3a1 1 0 001-1v-7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Clear all conversations
              </button>
            ) : (
              <div style={{ padding: '8px 14px' }}>
                <p style={{ margin: '0 0 8px', fontSize: 12, color: MUTED, lineHeight: 1.5 }}>
                  Delete all conversation history? This can't be undone.
                </p>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={handleClearAll}
                    style={{
                      fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 6,
                      border: 'none', background: '#DC2626', color: '#fff', cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Clear all
                  </button>
                  <button
                    onClick={() => setConfirming(false)}
                    style={{
                      fontSize: 12, padding: '5px 12px', borderRadius: 6,
                      border: `1px solid ${BORDER}`, background: 'transparent',
                      color: MUTED, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Divider */}
            <div style={{ height: 1, background: BORDER, margin: '6px 0' }} />

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              style={{ ...menuItemStyle(), color: signingOut ? DIM : RED }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(248,113,113,0.06)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M5 2H2.5A1.5 1.5 0 001 3.5v6A1.5 1.5 0 002.5 11H5M8.5 9.5L11 7l-2.5-2.5M11 7H5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function menuItemStyle(): React.CSSProperties {
  return {
    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 14px', background: 'transparent', border: 'none',
    cursor: 'pointer', fontSize: 13, color: MUTED, textAlign: 'left',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif',
    transition: 'background 0.1s',
  };
}
