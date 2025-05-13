import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Page from './Page/Page';
import styles from './DiaryView.module.css'; 
import pageStyles from './Page/Page.module.css'; 
import { FaArrowLeft, FaArrowRight, FaSave, FaHome } from 'react-icons/fa';

const ANIMATION_DURATION = 600; // ms, matches CSS animation

const DiaryView = ({ diaries, setDiaries }) => {
  const { diaryId } = useParams();
  const navigate = useNavigate();
  const [currentDiary, setCurrentDiary] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [goToPageInput, setGoToPageInput] = useState('');
  const [lastEditPosition, setLastEditPosition] = useState(0);
  const [pageTurnState, setPageTurnState] = useState({ animatingPageId: null, direction: null });

  // Effect to initialize and update currentDiary and currentPageIndex
  useEffect(() => {
    const foundDiary = diaries.find(d => d.id === diaryId);
    if (foundDiary) {
      let initialPages = [...foundDiary.pages];
      let diaryToSet = { ...foundDiary };

      if (initialPages.length === 0) {
        const newPage = {
          id: `p${Date.now()}`,
          pageNumber: 1,
          content: '',
          date: new Date().toISOString().split('T')[0],
        };
        initialPages.push(newPage);
        diaryToSet.pages = initialPages;
        diaryToSet.lastEntryDate = new Date().toISOString().split('T')[0];
        // Update the global diaries state if a new page was added to an empty diary
        setDiaries(prevDiaries => prevDiaries.map(d => (d.id === diaryToSet.id ? diaryToSet : d)));
      }
      
      setCurrentDiary(diaryToSet); // Set the local currentDiary state
      const lastPageIdx = initialPages.length > 0 ? initialPages.length - 1 : 0;
      setCurrentPageIndex(lastPageIdx); // Set initial page index
      setLastEditPosition(initialPages[lastPageIdx]?.content?.length || 0); // Set initial cursor position

    } else {
      // If diary is not found, navigate to home.
      // Consider showing a "Diary not found" message before navigating.
      navigate('/');
    }
  }, [diaryId, diaries, navigate, setDiaries]); // Dependencies for initialization


  // Effect to ensure currentPageIndex is always valid after currentDiary.pages might have changed
  // This hook is now placed before any early returns that depend on currentDiary.
  useEffect(() => {
    if (currentDiary && currentDiary.pages && currentDiary.pages.length > 0) {
      const safeIndex = Math.min(Math.max(0, currentPageIndex), currentDiary.pages.length - 1);
      if (currentPageIndex !== safeIndex) {
        setCurrentPageIndex(safeIndex);
        // Optionally, adjust lastEditPosition here if needed, though it's often set by navigation actions
        // setLastEditPosition(currentDiary.pages[safeIndex]?.content?.length || 0);
      }
    } else if (currentDiary && (!currentDiary.pages || currentDiary.pages.length === 0)) {
      // If diary exists but has no pages (e.g., after deleting all pages, though current logic adds one if empty)
      // Reset to page 0 (or handle as appropriate for your app's logic)
      // This scenario should be less common with the initial page creation logic.
      if (currentPageIndex !== 0) {
        setCurrentPageIndex(0);
        setLastEditPosition(0);
      }
    }
  }, [currentDiary, currentPageIndex]); // Re-run if currentDiary or currentPageIndex changes


  const ensurePageExists = useCallback((currentPagesArray, indexToEnsure) => {
    let pages = [...currentPagesArray];
    while (indexToEnsure >= pages.length) {
      pages.push({
        id: `p${Date.now()}_${pages.length}`, 
        pageNumber: pages.length + 1,
        content: '',
        date: new Date().toISOString().split('T')[0],
      });
    }
    return pages;
  }, []);

  const saveDiary = useCallback((pagesToSave) => {
    if (!currentDiary) return;
    const updatedDiary = {
      ...currentDiary,
      pages: pagesToSave,
      lastEntryDate: new Date().toISOString().split('T')[0],
    };
    setCurrentDiary(updatedDiary);
    setDiaries(prevDiaries => prevDiaries.map(d => (d.id === updatedDiary.id ? updatedDiary : d)));
  }, [currentDiary, setDiaries]);

  const handleContentChange = useCallback((pageId, newContent) => {
    if (!currentDiary) return;
    const updatedPages = currentDiary.pages.map(page =>
      page.id === pageId
        ? { ...page, content: newContent, date: new Date().toISOString().split('T')[0] }
        : page
    );
    saveDiary(updatedPages);
    setLastEditPosition(newContent.length);
  }, [currentDiary, saveDiary]);

  const handleContentMovement = useCallback((overflowText, direction) => {
    if (!currentDiary || pageTurnState.animatingPageId) return; 
    let pagesCopy = [...currentDiary.pages];
    const currentIndex = currentPageIndex; // Use a stable value for current index

    if (direction === 'next') {
      const currentContent = pagesCopy[currentIndex].content;
      const lines = currentContent.split(/\r?\n/);
      pagesCopy[currentIndex].content = lines.slice(0, 18).join('\n'); // MAX_LINES is 18
      
      const nextPageIndex = currentIndex + 1;
      pagesCopy = ensurePageExists(pagesCopy, nextPageIndex);

      if (nextPageIndex < pagesCopy.length) { // Ensure the next page actually exists after ensurePageExists
        pagesCopy[nextPageIndex].content = overflowText + '\n' + (pagesCopy[nextPageIndex].content || '');
        saveDiary(pagesCopy);
        setPageTurnState({ animatingPageId: pagesCopy[currentIndex].id, direction: 'next' });
        setTimeout(() => {
          setCurrentPageIndex(nextPageIndex);
          setLastEditPosition(overflowText.length);
          setPageTurnState({ animatingPageId: null, direction: null });
        }, ANIMATION_DURATION);
      }
    } else if (direction === 'prev') { // Moving content to the previous page (e.g. backspace at start)
      if (currentIndex === 0) return; // Cannot move content to a page before the first one
      const prevIdx = currentIndex - 1;
      pagesCopy[prevIdx].content += '\n' + pagesCopy[currentIndex].content;
      pagesCopy[currentIndex].content = ''; 
      // Optional: Logic to remove the current page if it's now empty and not the only page.
      // For simplicity, we're just clearing its content.
      saveDiary(pagesCopy);
      setPageTurnState({ animatingPageId: pagesCopy[currentIndex].id, direction: 'prev' });
      setTimeout(() => {
        setCurrentPageIndex(prevIdx);
        setLastEditPosition(pagesCopy[prevIdx].content.length);
        setPageTurnState({ animatingPageId: null, direction: null });
      }, ANIMATION_DURATION);
    }
  }, [currentDiary, currentPageIndex, saveDiary, ensurePageExists, pageTurnState.animatingPageId]);

  const navigateToPreviousPage = useCallback(() => {
    if (!currentDiary || currentPageIndex === 0 || pageTurnState.animatingPageId) return;
    const pageToAnimateId = currentDiary.pages[currentPageIndex].id;
    setPageTurnState({ animatingPageId: pageToAnimateId, direction: 'prev' });
    setTimeout(() => {
      const prevIdx = currentPageIndex - 1;
      setCurrentPageIndex(prevIdx);
      setLastEditPosition(currentDiary.pages[prevIdx]?.content?.length || 0);
      setPageTurnState({ animatingPageId: null, direction: null });
    }, ANIMATION_DURATION);
  }, [currentDiary, currentPageIndex, pageTurnState.animatingPageId]);

  const navigateToNextPage = useCallback(() => {
    if (!currentDiary || pageTurnState.animatingPageId) return;
    
    const pageToAnimateId = currentDiary.pages[currentPageIndex].id;
    setPageTurnState({ animatingPageId: pageToAnimateId, direction: 'next' });

    setTimeout(() => {
      let newPageIndex = currentPageIndex + 1;
      let pagesArray = [...currentDiary.pages]; // Work with a copy

      if (newPageIndex >= pagesArray.length) { // If trying to go beyond the last page
        pagesArray = ensurePageExists(pagesArray, newPageIndex);
        if (pagesArray.length > currentDiary.pages.length) { // If a new page was actually added
          saveDiary(pagesArray); 
        }
      }
      
      setCurrentPageIndex(newPageIndex);
      // Ensure pagesArray[newPageIndex] exists before trying to access its content
      setLastEditPosition(pagesArray[newPageIndex]?.content?.length || 0);
      setPageTurnState({ animatingPageId: null, direction: null });
    }, ANIMATION_DURATION);

  }, [currentDiary, currentPageIndex, ensurePageExists, saveDiary, pageTurnState.animatingPageId]);

  const handleGoToPage = (e) => {
    e.preventDefault();
    if (!currentDiary || pageTurnState.animatingPageId) return;
    const pageNum = parseInt(goToPageInput, 10);
    // Ensure currentDiary.pages is not undefined before accessing its length
    const numPages = currentDiary.pages ? currentDiary.pages.length : 0;

    if (pageNum >= 1 && pageNum <= numPages) {
      const targetIndex = pageNum - 1;
      const direction = targetIndex > currentPageIndex ? 'next' : (targetIndex < currentPageIndex ? 'prev' : null);
      
      if (direction && targetIndex !== currentPageIndex) { // Only animate if actually changing page
        setPageTurnState({ animatingPageId: currentDiary.pages[currentPageIndex].id, direction });
        setTimeout(() => {
          setCurrentPageIndex(targetIndex);
          setLastEditPosition(currentDiary.pages[targetIndex]?.content?.length || 0);
          setPageTurnState({ animatingPageId: null, direction: null });
        }, ANIMATION_DURATION);
      } else { 
        // If no direction (i.e., targetIndex is same as currentPageIndex) or invalid, just set index
        setCurrentPageIndex(targetIndex); 
        setLastEditPosition(currentDiary.pages[targetIndex]?.content?.length || 0);
      }
    } else {
      alert(`Page number must be between 1 and ${numPages || 1}`);
    }
    setGoToPageInput('');
  };

  // Early return if diary data is not yet loaded or is invalid
  if (!currentDiary || !currentDiary.pages) {
    return <div className={styles.loading}>Loading diary data...</div>;
  }
  // If pages array is empty (even after initial effect tried to add one), show loading or empty state
  if (currentDiary.pages.length === 0) {
    return <div className={styles.loading}>No pages in diary. Creating one...</div>; 
  }
  
  // currentPageIndex should be safe now due to the useEffect above.
  // However, as a final safeguard before rendering, ensure it's within bounds.
  const finalSafeCurrentPageIndex = Math.min(Math.max(0, currentPageIndex), currentDiary.pages.length - 1);
  const currentPageData = currentDiary.pages[finalSafeCurrentPageIndex];

  if (!currentPageData) {
    // This should ideally not be reached if the above logic is correct
    console.error("Error: currentPageData is undefined. Diary State:", currentDiary, "Index:", finalSafeCurrentPageIndex);
    return <div className={styles.error}>Error loading page data. Please try again.</div>;
  }

  let animationClass = '';
  if (pageTurnState.animatingPageId === currentPageData.id) {
    if (pageTurnState.direction === 'next') {
      animationClass = pageStyles.pageCurlNext;
    } else if (pageTurnState.direction === 'prev') {
      animationClass = pageStyles.pageCurlPrev;
    }
  }
  
  const isNavDisabled = pageTurnState.animatingPageId !== null;

  return (
    <div className={styles.diaryViewContainer}>
      <div className={styles.diaryHeader}>
        <button onClick={() => navigate('/')} className={styles.controlButton} title="Home" disabled={isNavDisabled}><FaHome /></button>
        <button onClick={navigateToPreviousPage} className={styles.controlButton} title="Previous Page" disabled={finalSafeCurrentPageIndex === 0 || isNavDisabled}><FaArrowLeft /></button>
        <button 
            onClick={navigateToNextPage} 
            className={styles.controlButton} 
            title="Next Page" 
            disabled={(finalSafeCurrentPageIndex >= currentDiary.pages.length -1 && currentDiary.pages.length >= 200 /* Practical limit */) || isNavDisabled }>
            <FaArrowRight />
        </button>
        <h2>{currentDiary.name}</h2>
        <form onSubmit={handleGoToPage} className={styles.goToPageForm}>
          <input
            type="number"
            min="1"
            max={currentDiary.pages.length || 1}
            value={goToPageInput}
            onChange={e => setGoToPageInput(e.target.value)}
            placeholder="Page #"
            className={styles.goToPageInput}
            disabled={isNavDisabled}
          />
          <button type="submit" className={styles.controlButtonSmall} disabled={isNavDisabled}>Go</button>
        </form>
        <button onClick={() => alert('Diary content is auto-saved.')} className={`${styles.controlButton} ${styles.saveButton}`} title="Save" disabled={isNavDisabled}><FaSave /></button>
      </div>
      <div className={styles.pageContainer}>
        <Page
          key={currentPageData.id} 
          pageData={currentPageData}
          onContentChange={handleContentChange}
          onPageFull={handleContentMovement}
          onNavigatePrev={navigateToPreviousPage} 
          onNavigateNext={navigateToNextPage}
          initialFocusPosition={lastEditPosition}
          isCurrentPageFocused={!pageTurnState.animatingPageId} 
          animationClass={animationClass}
        />
      </div>
      <div className={styles.pageIndicator}>
        Page {currentPageData.pageNumber} of {currentDiary.pages.length}
      </div>
    </div>
  );
};

export default DiaryView;