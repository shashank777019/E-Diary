// Page.js
import React, { useRef, useEffect } from 'react';
import styles from './Page.module.css';

const MAX_LINES = 18;  // ← added

const Page = ({
  pageData,
  onContentChange,
  onPageFull,              // ← added
  initialFocusPosition,
  isCurrentPageFocused
}) => {
  const editorRef = useRef(null);

  // When pageData changes, update the editor
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.textContent = pageData.content || '';
    }
  }, [pageData.id, pageData.content]);

  // Focus & restore cursor position
  useEffect(() => {
    if (isCurrentPageFocused && editorRef.current) {
      editorRef.current.focus();
      const sel = window.getSelection();
      const range = document.createRange();
      const len = editorRef.current.textContent.length;
      const pos = Math.min(initialFocusPosition, len);
      const node = editorRef.current.firstChild || editorRef.current;
      range.setStart(node, pos);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }, [isCurrentPageFocused, initialFocusPosition, pageData.id]);

  // ← replaced simple onContentChange with overflow logic
  const handleInput = e => {
    const text = editorRef.current.textContent;
    const lines = text.split(/\r?\n/);
    if (lines.length > MAX_LINES) {
      const visible = lines.slice(0, MAX_LINES).join('\n');
      const overflow = lines.slice(MAX_LINES).join('\n');
      onContentChange(pageData.id, visible);
      onPageFull(overflow, 'next');    // ← call overflow
    } else {
      onContentChange(pageData.id, text);
    }
  };

  // ← added: backspace-at-zero & arrow navigation
  const handleKeyDown = e => {
    if (e.key === 'Backspace') {
      const sel = window.getSelection();
      if (sel.anchorOffset === 0 && sel.focusOffset === 0) {
        e.preventDefault();
        onPageFull('', 'prev');
      }
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      onPageFull('', 'next');
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onPageFull('', 'prev');
    }
  };

  const renderLines = () =>
    Array.from({ length: MAX_LINES }).map((_, i) =>
      <div key={i} className={styles.ruleLine} />
    );

  return (
    <div className={styles.page}>
      <div className={styles.pageDate}>
        {new Date(pageData.date).toLocaleDateString(undefined, {
          year: 'numeric', month: 'long', day: 'numeric'
        })}
      </div>
      <div className={styles.leftMarginLine} />
      <div className={styles.ruledLinesContainer}>
        {renderLines()}
      </div>
      <div
        ref={editorRef}
        contentEditable
        className={styles.editorArea}
        onInput={handleInput}       // ← uses overflow logic
        onKeyDown={handleKeyDown}   // ← added
        suppressContentEditableWarning
        spellCheck="false"
      />
    </div>
  );
};

export default Page;