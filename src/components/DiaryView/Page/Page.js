import React, { useRef, useEffect, useCallback } from 'react';
import styles from './Page.module.css'; 

const MAX_LINES = 18;

const Page = ({
  pageData,
  onContentChange,
  onPageFull,
  onNavigatePrev,
  onNavigateNext,
  initialFocusPosition,
  isCurrentPageFocused,
  animationClass 
}) => {
  const editorRef = useRef(null);

  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.textContent !== (pageData.content || '')) {
        editorRef.current.textContent = pageData.content || '';
      }
    }
  }, [pageData.id, pageData.content]);

  useEffect(() => {
    if (isCurrentPageFocused && editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.focus();
      const sel = window.getSelection();
      if (sel) {
        const range = document.createRange();
        const textContent = editorRef.current.textContent || "";
        const len = textContent.length;
        const pos = Math.min(Math.max(0, initialFocusPosition), len);
        const nodeToSetRange = editorRef.current.firstChild || editorRef.current;
        
        try {
          if (nodeToSetRange.nodeType === Node.TEXT_NODE || nodeToSetRange.childNodes.length === 0) {
            range.setStart(nodeToSetRange, Math.min(pos, nodeToSetRange.nodeValue?.length ?? 0));
          } else if (nodeToSetRange.childNodes.length > 0) {
            let targetNode = nodeToSetRange.firstChild;
            while(targetNode && targetNode.nodeType !== Node.TEXT_NODE && targetNode.firstChild) {
                targetNode = targetNode.firstChild;
            }
            if (targetNode && targetNode.nodeType === Node.TEXT_NODE) {
                 range.setStart(targetNode, Math.min(pos, targetNode.nodeValue.length));
            } else {
                 range.setStart(nodeToSetRange, 0); 
            }
          } else {
             range.setStart(nodeToSetRange, 0); 
          }
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
        } catch (error) {
          // console.error("Error setting cursor position:", error);
          editorRef.current.focus();
        }
      }
    }
  }, [isCurrentPageFocused, initialFocusPosition, pageData.id]);

  const handleInput = useCallback((e) => {
    if (!editorRef.current) return;
    const text = editorRef.current.textContent || "";
    const lines = text.split(/\r?\n/);

    if (lines.length > MAX_LINES) {
      const visible = lines.slice(0, MAX_LINES).join('\n');
      const overflow = lines.slice(MAX_LINES).join('\n');
      onContentChange(pageData.id, visible); 
      onPageFull(overflow, 'next');
    } else {
      onContentChange(pageData.id, text);
    }
  }, [onContentChange, onPageFull, pageData.id]);

  const handleKeyDown = useCallback((e) => {
    if (!editorRef.current) return;
    const sel = window.getSelection();
    if (!sel) return;

    if (e.key === 'Backspace') {
      // const editorContent = editorRef.current.textContent || ""; // Not needed for this simplified check
      const isAtVeryStart = sel.anchorOffset === 0 && sel.focusOffset === 0 && 
                           (sel.anchorNode === editorRef.current || (editorRef.current.firstChild && sel.anchorNode === editorRef.current.firstChild && sel.anchorNode.nodeType === Node.TEXT_NODE && sel.anchorOffset === 0));
      if (isAtVeryStart) {
         e.preventDefault();
         onPageFull('', 'prev'); 
      }
    } else if (e.key === 'ArrowRight') {
        const text = editorRef.current.textContent || "";
        const atEnd = sel.anchorOffset === text.length && sel.focusOffset === text.length && sel.isCollapsed;
        if(atEnd) {
            e.preventDefault();
            onNavigateNext();
        }
    } else if (e.key === 'ArrowLeft') {
        const atStart = sel.anchorOffset === 0 && sel.focusOffset === 0 && sel.isCollapsed;
        if(atStart) {
            e.preventDefault();
            onNavigatePrev();
        }
    }
  }, [onPageFull, onNavigatePrev, onNavigateNext]);

  const renderLines = () =>
    Array.from({ length: MAX_LINES }).map((_, i) =>
      <div key={i} className={styles.ruleLine} />
    );

  const pageClasses = `${styles.page} ${animationClass ? styles.pageAnimating : ''} ${animationClass || ''}`.trim();

  return (
    <div className={pageClasses}>
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
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        suppressContentEditableWarning
        spellCheck="false"
      />
    </div>
  );
};

export default Page;