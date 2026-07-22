'use client';

/**
 * RichTextEditor — minimal contenteditable rich text editor.
 * Supports bold, italic. Stores/emits clean HTML.
 * No external dependencies.
 */
import { useRef, useEffect, useCallback } from 'react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const NAVY = '#0D3B5C';
const G    = { border: '#e5e7eb', bg: '#f9fafb', text: '#6b7280' };

export function RichTextEditor({ value, onChange, placeholder = 'Enter text…', minHeight = 100 }: Props) {
  const editorRef  = useRef<HTMLDivElement>(null);
  const lastValue  = useRef(value);

  // Initialise editor content on mount
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = value;
      lastValue.current = value;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync if value changes from outside (e.g. page switch) but don't stomp mid-edit
  useEffect(() => {
    if (editorRef.current && value !== lastValue.current) {
      editorRef.current.innerHTML = value;
      lastValue.current = value;
    }
  }, [value]);

  const handleInput = useCallback(() => {
    const html = editorRef.current?.innerHTML ?? '';
    lastValue.current = html;
    onChange(html);
  }, [onChange]);

  // Toolbar button — mousedown + preventDefault keeps focus & selection in editor
  function applyFormat(e: React.MouseEvent, command: string, value?: string) {
    e.preventDefault();
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
  }

  const btnStyle = (label: string): React.CSSProperties => ({
    width: 28, height: 28, border: `1px solid ${G.border}`, borderRadius: 4,
    background: '#fff', cursor: 'pointer', fontSize: label === 'B' ? 14 : 13,
    fontWeight: label === 'B' ? 700 : 400,
    fontStyle: label === 'I' ? 'italic' : 'normal',
    color: '#374151', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: 'Georgia, serif',
    flexShrink: 0,
  });

  return (
    <div style={{ border: `1px solid ${G.border}`, borderRadius: 6, overflow: 'hidden', background: '#fff' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', gap: 4, padding: '6px 8px',
        background: G.bg, borderBottom: `1px solid ${G.border}`,
        alignItems: 'center',
      }}>
        <button style={btnStyle('B')} onMouseDown={e => applyFormat(e, 'bold')} title="Bold (⌘B)">B</button>
        <button style={btnStyle('I')} onMouseDown={e => applyFormat(e, 'italic')} title="Italic (⌘I)">I</button>
        <div style={{ width: 1, height: 18, background: G.border, margin: '0 4px' }} />
        <button style={{ ...btnStyle('×'), fontSize: 11, fontWeight: 400, fontStyle: 'normal', color: G.text, fontFamily: 'inherit' }}
          onMouseDown={e => applyFormat(e, 'removeFormat')} title="Clear formatting">
          A×
        </button>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: G.text }}>⌘B bold · ⌘I italic</span>
      </div>

      {/* Editor area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={e => {
          // Prevent Enter from creating <div> in some browsers — use <br> instead
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            document.execCommand('insertLineBreak');
          }
        }}
        style={{
          minHeight, padding: '12px 14px', outline: 'none',
          fontSize: 14, lineHeight: 1.65, color: '#111',
          fontFamily: '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif',
        }}
        data-placeholder={placeholder}
      />

      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9CA3AF;
          pointer-events: none;
        }
        [contenteditable] strong, [contenteditable] b { font-weight: 700; }
        [contenteditable] em, [contenteditable] i { font-style: italic; }
      `}</style>
    </div>
  );
}
