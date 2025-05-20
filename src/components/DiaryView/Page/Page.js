import React, { useRef, useEffect, useCallback, useState } from 'react';
import styles from './Page.module.css';

const MAX_LINES = 18;
// Define the width of the draggable zones based on your visual red lines
const LEFT_DRAG_ZONE_WIDTH = 40; // px from the left edge of the page div
const RIGHT_DRAG_ZONE_WIDTH = 20; // px from the right edge of the page div (slightly more than 15px padding for easier grab)


const getOverflowSplit = (text, editorElement, maxHeight) => {
    const tempDiv = document.createElement('div');
    const computedStyle = window.getComputedStyle(editorElement);
    tempDiv.style.width = `${editorElement.clientWidth}px`;
    tempDiv.style.font = computedStyle.font;
    tempDiv.style.lineHeight = computedStyle.lineHeight;
    tempDiv.style.padding = computedStyle.padding;
    tempDiv.style.boxSizing = computedStyle.boxSizing;
    tempDiv.style.whiteSpace = 'pre-wrap';
    tempDiv.style.wordWrap = 'break-word';
    tempDiv.style.visibility = 'hidden';
    tempDiv.style.position = 'absolute';
    tempDiv.style.top = '-9999px';
    tempDiv.style.left = '-9999px';
    document.body.appendChild(tempDiv);

    let visibleText = "";
    let overflowText = "";

    tempDiv.textContent = text;
    if (tempDiv.scrollHeight <= maxHeight) {
        document.body.removeChild(tempDiv);
        return { visibleText: text, overflowText: "" };
    }

    const words = text.split(/(\s+)/);
    let currentTextAttempt = "";
    for (let i = 0; i < words.length; i++) {
        const wordCandidate = words[i];
        const nextTextAttempt = currentTextAttempt + wordCandidate;
        tempDiv.textContent = nextTextAttempt;

        if (tempDiv.scrollHeight > maxHeight) {
            if (currentTextAttempt === "") {
                for (let j = 0; j < wordCandidate.length; j++) {
                    tempDiv.textContent = wordCandidate.substring(0, j + 1);
                    if (tempDiv.scrollHeight > maxHeight) {
                        visibleText = wordCandidate.substring(0, j);
                        overflowText = wordCandidate.substring(j) + words.slice(i + 1).join("");
                        document.body.removeChild(tempDiv);
                        return { visibleText, overflowText };
                    }
                }
                visibleText = "";
                overflowText = text;
            } else {
                visibleText = currentTextAttempt.trimEnd();
                overflowText = (words.slice(i).join("")).trimStart();
            }
            document.body.removeChild(tempDiv);
            return { visibleText, overflowText };
        }
        currentTextAttempt = nextTextAttempt;
    }
    document.body.removeChild(tempDiv);
    return { visibleText: text, overflowText: "" };
};

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
  const pageRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragCurrentX, setDragCurrentX] = useState(0);
  const [draggedPageStyle, setDraggedPageStyle] = useState({});
  const [isMidDragAnimation, setIsMidDragAnimation] = useState(false);
  const [showGrabCursor, setShowGrabCursor] = useState(false); // For dynamic cursor


  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.textContent !== (pageData.content || '')) {
        editorRef.current.textContent = pageData.content || '';
      }
    }
  }, [pageData.id, pageData.content]);

  useEffect(() => {
    if (isCurrentPageFocused && !isDragging && editorRef.current && document.activeElement !== editorRef.current) {
      editorRef.current.focus();
      const sel = window.getSelection();
      if (sel) {
        const range = document.createRange();
        let nodeToSetRange = editorRef.current.firstChild;
        if (!nodeToSetRange && editorRef.current.childNodes.length === 0) {
            editorRef.current.appendChild(document.createTextNode(""));
            nodeToSetRange = editorRef.current.firstChild;
        } else if (!nodeToSetRange) {
            nodeToSetRange = editorRef.current;
        }
        
        const textContentLength = nodeToSetRange?.nodeValue?.length ?? 0;
        const pos = Math.min(Math.max(0, initialFocusPosition), textContentLength);
        
        try {
          if (nodeToSetRange.nodeType === Node.TEXT_NODE) {
            range.setStart(nodeToSetRange, pos);
          } else if (nodeToSetRange.childNodes.length > 0) {
            let targetNode = nodeToSetRange.firstChild || nodeToSetRange;
            let finalOffset = 0;
            while(targetNode && targetNode.nodeType !== Node.TEXT_NODE && targetNode.firstChild) {
                targetNode = targetNode.firstChild;
            }
            if(targetNode && targetNode.nodeType === Node.TEXT_NODE){
                finalOffset = Math.min(pos, targetNode.nodeValue.length);
                range.setStart(targetNode, finalOffset);
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
          editorRef.current.focus();
        }
      }
    }
  }, [isCurrentPageFocused, initialFocusPosition, pageData.id, pageData.content, isDragging]);

  const handleInput = useCallback((e) => {
    if (!editorRef.current) return;
    const currentText = editorRef.current.textContent || "";
    const previousContent = pageData.content || "";

    if (editorRef.current.scrollHeight > editorRef.current.clientHeight) {
        if (currentText.length >= previousContent.length) {
            const split = getOverflowSplit(currentText, editorRef.current, editorRef.current.clientHeight);
            if (split.overflowText) {
                onContentChange(pageData.id, split.visibleText, true);
                onPageFull(split.overflowText, 'next');
                return; 
            }
        }
    }

    const linesBasedOnNewlines = currentText.split(/\r?\n/);
    if (linesBasedOnNewlines.length > MAX_LINES) {
        if (currentText.length >= previousContent.length) {
            const visibleContent = linesBasedOnNewlines.slice(0, MAX_LINES).join('\n');
            const overflowDueToNewlines = linesBasedOnNewlines.slice(MAX_LINES).join('\n');
            onContentChange(pageData.id, visibleContent, true);
            onPageFull(overflowDueToNewlines, 'next');
            return; 
        }
    }
    onContentChange(pageData.id, currentText, false);
  }, [onContentChange, onPageFull, pageData.id, pageData.content, editorRef]);

  const handleKeyDown = useCallback((e) => {
    if (!editorRef.current || isDragging) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const editorContent = editorRef.current.textContent || "";
    const range = sel.getRangeAt(0);
    
    let atVeryStartOfEditor = false;
    if (range.startOffset === 0 && range.endOffset === 0 && sel.isCollapsed) {
        if (range.startContainer === editorRef.current) {
            atVeryStartOfEditor = true;
        } else if (editorRef.current.firstChild) {
            let currentNode = range.startContainer;
            let currentOffset = range.startOffset;
            let isAtStart = true;
            while(currentNode !== editorRef.current) {
                if (currentOffset > 0 || currentNode.previousSibling || !currentNode.parentNode) {
                    isAtStart = false; break;
                }
                currentOffset = Array.from(currentNode.parentNode.childNodes).indexOf(currentNode);
                currentNode = currentNode.parentNode;
            }
            if (isAtStart && currentOffset === 0) atVeryStartOfEditor = true;
        }
    }

    if (e.key === 'Backspace' && editorContent.length === 0 && atVeryStartOfEditor) {
       e.preventDefault();
       onPageFull('', 'prev');
    } else if (e.key === 'ArrowRight') {
        const textLength = editorRef.current.textContent.length;
        if (sel.isCollapsed && range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset === range.startContainer.length) {
            let container = range.startContainer; let atEnd = true;
            while (container !== editorRef.current) {
                if (container.nextSibling || !container.parentNode) { atEnd = false; break; }
                container = container.parentNode;
            }
            if (atEnd && sel.focusOffset === textLength) { e.preventDefault(); onNavigateNext(); }
        } else if (sel.isCollapsed && editorRef.current.textContent === "" && range.startContainer === editorRef.current ) {
            e.preventDefault(); onNavigateNext();
        }
    } else if (e.key === 'ArrowLeft') {
        if(atVeryStartOfEditor) { e.preventDefault(); onNavigatePrev(); }
    }
  }, [onPageFull, onNavigatePrev, onNavigateNext, editorRef, isDragging]);

  const DRAG_THRESHOLD_RATIO = 0.25;

  const handleDragStart = useCallback((e) => {
    if (animationClass || isMidDragAnimation || !pageRef.current) return;
    
    const pageRect = pageRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;

    const isOverLeftHandle = clientX >= pageRect.left && clientX < pageRect.left + LEFT_DRAG_ZONE_WIDTH;
    const isOverRightHandle = clientX > pageRect.right - RIGHT_DRAG_ZONE_WIDTH && clientX <= pageRect.right;

    if (!isOverLeftHandle && !isOverRightHandle) {
        return; // Not dragging from a valid edge zone
    }
    
    setIsDragging(true);
    setDragStartX(clientX);
    setDragCurrentX(clientX);
    setDraggedPageStyle({ transition: 'none' });
    if (editorRef.current) editorRef.current.blur();
    e.preventDefault();
  }, [animationClass, isMidDragAnimation]);

  const handleDragMove = useCallback((e) => {
    if (!isDragging || animationClass || isMidDragAnimation || !pageRef.current) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setDragCurrentX(clientX);
    const deltaX = clientX - dragStartX;
    const pageWidth = pageRef.current.offsetWidth;
    const rotateYFactor = 90 / (pageWidth / 1.5); 
    const scaleFactor = Math.max(0.7, 1 - Math.abs(deltaX) / (pageWidth * 2));

    let transform = `perspective(2000px) translateX(${deltaX * 0.7}px) scale(${scaleFactor})`;
    let transformOrigin = '50% 50%';

    if (deltaX < 0) { 
        transformOrigin = '0% 50%'; 
        transform += ` rotateY(${Math.max(-80, deltaX * rotateYFactor * 0.3)}deg)`;
    } else if (deltaX > 0) { 
        transformOrigin = '100% 50%'; 
        transform += ` rotateY(${Math.min(80, deltaX * rotateYFactor * 0.3)}deg)`;
    }
    
    setDraggedPageStyle({
        transform,
        transformOrigin,
        transition: 'none',
        boxShadow: `0 10px 30px rgba(0,0,0,${Math.min(0.3, Math.abs(deltaX) / pageWidth)})`
    });

  }, [isDragging, dragStartX, animationClass, isMidDragAnimation]);

  const handleDragEnd = useCallback(() => {
    if (!isDragging || animationClass || isMidDragAnimation || !pageRef.current) return;
    setIsDragging(false);
    
    const deltaX = dragCurrentX - dragStartX;
    const pageWidth = pageRef.current.offsetWidth;
    const turnThreshold = pageWidth * DRAG_THRESHOLD_RATIO;

    let turnDirection = null;
    if (deltaX < -turnThreshold) {
        turnDirection = 'next';
    } else if (deltaX > turnThreshold) {
        turnDirection = 'prev';
    }

    if (turnDirection) {
        setIsMidDragAnimation(true);
        setDraggedPageStyle({ 
            transform: `perspective(2000px) translateX(${turnDirection === 'next' ? '-110%' : '110%'}) rotateY(${turnDirection === 'next' ? -150 : 150}deg) scale(0.5)`,
            transformOrigin: turnDirection === 'next' ? '0% 50%' : '100% 50%',
            opacity: 0,
            transition: 'transform 0.5s ease-in-out, opacity 0.5s ease-in-out',
            boxShadow: `0 15px 50px rgba(0,0,0,0.3)`
        });
        setTimeout(() => {
            if (turnDirection === 'next') onNavigateNext();
            else if (turnDirection === 'prev') onNavigatePrev();
            setDraggedPageStyle({}); 
            setIsMidDragAnimation(false);
        }, 500); 
    } else {
        setDraggedPageStyle({
            transform: 'perspective(2000px) translateX(0px) rotateY(0deg) scale(1)',
            transition: 'transform 0.3s ease-out',
            boxShadow: '0 0 15px rgba(0,0,0,0.1)'
        });
        setTimeout(()=> setDraggedPageStyle({}), 300);
    }
  }, [isDragging, dragStartX, dragCurrentX, onNavigateNext, onNavigatePrev, animationClass, isMidDragAnimation]);
  
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('touchmove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchend', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Handle mouse move on page to set grab cursor
  const handleMouseMoveOnPage = useCallback((e) => {
    if (isDragging || isMidDragAnimation || animationClass || !pageRef.current) {
        if(showGrabCursor) setShowGrabCursor(false); // Ensure grab cursor is removed if dragging/animating
        return;
    }

    const pageRect = pageRef.current.getBoundingClientRect();
    const clientX = e.clientX;

    const isOverLeftHandle = clientX >= pageRect.left && clientX < pageRect.left + LEFT_DRAG_ZONE_WIDTH;
    const isOverRightHandle = clientX > pageRect.right - RIGHT_DRAG_ZONE_WIDTH && clientX <= pageRect.right;

    if (isOverLeftHandle || isOverRightHandle) {
        if(!showGrabCursor) setShowGrabCursor(true);
    } else {
        if(showGrabCursor) setShowGrabCursor(false);
    }
  }, [isDragging, isMidDragAnimation, animationClass, showGrabCursor]);


  const renderLines = () =>
    Array.from({ length: MAX_LINES }).map((_, i) =>
      <div key={i} className={styles.ruleLine} />
    );

  let pageDynamicStyle = draggedPageStyle;
  let pageDynamicClassName = styles.page;

  if (animationClass && !isDragging && !Object.keys(draggedPageStyle).length) {
    pageDynamicClassName = `${styles.page} ${styles.pageAnimating} ${animationClass}`.trim();
  } else if (isDragging || Object.keys(draggedPageStyle).length) {
    pageDynamicClassName = `${styles.page} ${styles.isDragging}`;
  } else if (showGrabCursor) {
    pageDynamicClassName = `${styles.page} ${styles.canDrag}`;
  }


  return (
    <div
      ref={pageRef}
      className={pageDynamicClassName}
      style={pageDynamicStyle}
      onMouseDown={handleDragStart}
      onTouchStart={handleDragStart}
      onMouseMove={handleMouseMoveOnPage} // Added to manage grab cursor
    >
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
        contentEditable={!isDragging}
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