import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Page from './Page/Page';
import styles from './DiaryView.module.css';
import pageStyles from './Page/Page.module.css'; 
import { FaArrowLeft, FaArrowRight, FaSave, FaHome } from 'react-icons/fa';

const ANIMATION_DURATION = 500; 
const SAVE_DEBOUNCE_DELAY = 500; 

const DiaryView = ({ diaries, setDiaries }) => {
  const { diaryId } = useParams();
  const navigate = useNavigate();
  const [currentDiary, setCurrentDiary] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [goToPageInput, setGoToPageInput] = useState('');
  const [lastEditPosition, setLastEditPosition] = useState(0);
  const [pageTurnState, setPageTurnState] = useState({ animatingPageId: null, direction: null, isFinalTurn: false });

  const isInitialLoadForDiaryIdRef = useRef(true);
  const debounceTimeoutRef = useRef(null);

  useEffect(() => {
    const foundDiary = diaries.find(d => d.id === diaryId);
    if (foundDiary) {
        let pages = [...(foundDiary.pages || [])];
        let diaryToUpdate = { ...foundDiary };
        let shouldUpdateGlobalDiaries = false;

        if (pages.length === 0) {
            const newPage = {
                id: `p${Date.now()}`, pageNumber: 1, content: '',
                date: new Date().toISOString().split('T')[0],
            };
            pages.push(newPage);
            diaryToUpdate.pages = pages;
            diaryToUpdate.lastEntryDate = new Date().toISOString().split('T')[0];
            shouldUpdateGlobalDiaries = true;
        }
        
        setCurrentDiary(diaryToUpdate);

        if (shouldUpdateGlobalDiaries) {
            setDiaries(prevDiaries => prevDiaries.map(d => (d.id === diaryToUpdate.id ? diaryToUpdate : d)));
        }

        if (isInitialLoadForDiaryIdRef.current) {
            const lastPageIdx = pages.length > 0 ? pages.length - 1 : 0;
            setCurrentPageIndex(lastPageIdx);
            setLastEditPosition(pages[lastPageIdx]?.content?.length || 0);
            isInitialLoadForDiaryIdRef.current = false;
        } else {
            const currentPagesCount = pages.length;
            const safeIndex = Math.min(Math.max(0, currentPageIndex), currentPagesCount > 0 ? currentPagesCount - 1 : 0);
            if (currentPageIndex !== safeIndex || currentPageIndex >= currentPagesCount) {
                setCurrentPageIndex(safeIndex);
                setLastEditPosition(pages[safeIndex]?.content?.length || 0);
            }
        }
    } else {
        navigate('/');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [diaryId, diaries, navigate]); 

  useEffect(() => {
    isInitialLoadForDiaryIdRef.current = true;
  }, [diaryId]);


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
    const renumberedPages = pagesToSave.map((page, index) => ({
        ...page,
        pageNumber: index + 1,
    }));

    const updatedDiary = {
      ...currentDiary,
      pages: renumberedPages,
      lastEntryDate: new Date().toISOString().split('T')[0],
    };
    setCurrentDiary(updatedDiary); 
    setDiaries(prevDiaries => prevDiaries.map(d => (d.id === updatedDiary.id ? updatedDiary : d)));
  }, [currentDiary, setDiaries]);


  const debouncedSaveDiary = useCallback((pagesToSave) => {
    if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      saveDiary(pagesToSave);
    }, SAVE_DEBOUNCE_DELAY);
  }, [saveDiary]); 

  const manualSaveDiary = useCallback((pagesToSave) => {
    if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
    }
    saveDiary(pagesToSave);
  }, [saveDiary]);


  const handleContentChange = useCallback((pageId, newContent, isOverflowSplit = false) => {
    if (!currentDiary) return;
    
    const updatedPages = currentDiary.pages.map(page =>
      page.id === pageId
        ? { ...page, content: newContent, date: new Date().toISOString().split('T')[0] }
        : page
    );
    
    setCurrentDiary(prev => ({...prev, pages: updatedPages, lastEntryDate: new Date().toISOString().split('T')[0]}));
    
    if (!isOverflowSplit) {
        debouncedSaveDiary(updatedPages);
    }

    if (!pageTurnState.animatingPageId && !pageTurnState.isFinalTurn) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
             if (document.activeElement === range.startContainer || document.activeElement?.contains(range.startContainer) ) {
                setLastEditPosition(range.startOffset);
            } else {
                 setLastEditPosition(newContent.length);
            }
        } else {
            setLastEditPosition(newContent.length);
        }
    }
  }, [currentDiary, debouncedSaveDiary, pageTurnState.animatingPageId, pageTurnState.isFinalTurn]);


  const handleContentMovement = useCallback((overflowText, direction) => {
    if (!currentDiary || !currentDiary.pages || pageTurnState.isFinalTurn) return; 
    
    let pagesCopy = currentDiary.pages.map(p => ({...p}));
    const currentIndex = currentPageIndex;
    const pageBeingAnimatedId = pagesCopy[currentIndex]?.id;

    if (direction === 'next') {
      const nextPageIndex = currentIndex + 1;
      pagesCopy = ensurePageExists(pagesCopy, nextPageIndex);

      if (nextPageIndex < pagesCopy.length) {
        pagesCopy[nextPageIndex].content = (overflowText || "") + (pagesCopy[nextPageIndex].content || '');
        pagesCopy[nextPageIndex].date = new Date().toISOString().split('T')[0];
        
        manualSaveDiary(pagesCopy); 

        setCurrentPageIndex(nextPageIndex);
        setLastEditPosition(0); 

        if (pageBeingAnimatedId) { 
            setPageTurnState({ animatingPageId: pageBeingAnimatedId, direction: 'next', isFinalTurn: true });
            setTimeout(() => {
                setPageTurnState({ animatingPageId: null, direction: null, isFinalTurn: false });
            }, ANIMATION_DURATION);
        }
      }
    } else if (direction === 'prev') { 
      if (currentIndex === 0) return; 

      const prevIdx = currentIndex - 1;
      let finalPagesArray = [...pagesCopy];
      let wasPageRemoved = false;
      
      if (pagesCopy[currentIndex]?.content === '' && pagesCopy.length > 1) {
        finalPagesArray.splice(currentIndex, 1);
        wasPageRemoved = true;
      }
      
      setCurrentPageIndex(prevIdx); 
      const prevPageContent = finalPagesArray[prevIdx]?.content || '';
      setLastEditPosition(prevPageContent.length);

      if (wasPageRemoved) {
        manualSaveDiary(finalPagesArray); 
      }
      
      if (pageBeingAnimatedId) {
        setPageTurnState({ animatingPageId: pageBeingAnimatedId, direction: 'prev', isFinalTurn: true });
        setTimeout(() => {
          setPageTurnState({ animatingPageId: null, direction: null, isFinalTurn: false });
        }, ANIMATION_DURATION);
      }
    }
  }, [currentDiary, currentPageIndex, manualSaveDiary, ensurePageExists, pageTurnState.isFinalTurn, setCurrentPageIndex, setLastEditPosition]);

  const triggerPageTurn = useCallback((direction) => {
    if (!currentDiary || pageTurnState.isFinalTurn) return;

    const pageToAnimateId = currentDiary.pages[currentPageIndex]?.id;
    if (!pageToAnimateId) return;

    setPageTurnState({ animatingPageId: pageToAnimateId, direction: direction, isFinalTurn: true });

    setTimeout(() => {
        if (direction === 'next') {
            let newPageIndex = currentPageIndex + 1;
            let pagesArray = [...currentDiary.pages];
            if (newPageIndex >= pagesArray.length) {
                pagesArray = ensurePageExists(pagesArray, newPageIndex);
                if (pagesArray.length > currentDiary.pages.length) manualSaveDiary(pagesArray);
            }
            setCurrentPageIndex(newPageIndex);
            setLastEditPosition(0);
        } else if (direction === 'prev') {
            if (currentPageIndex === 0) { 
                 setPageTurnState({ animatingPageId: null, direction: null, isFinalTurn: false });
                 return;
            }
            const prevIdx = currentPageIndex - 1;
            setCurrentPageIndex(prevIdx);
            setLastEditPosition(currentDiary.pages[prevIdx]?.content?.length || 0);
        }
        setPageTurnState({ animatingPageId: null, direction: null, isFinalTurn: false });
    }, ANIMATION_DURATION);
  }, [currentDiary, currentPageIndex, ensurePageExists, manualSaveDiary, pageTurnState.isFinalTurn]);


  const navigateToPreviousPage = useCallback(() => {
    if (currentPageIndex > 0) triggerPageTurn('prev');
  }, [currentPageIndex, triggerPageTurn]);

  const navigateToNextPage = useCallback(() => {
     triggerPageTurn('next');
  }, [triggerPageTurn]);


  const handleGoToPage = (e) => {
    e.preventDefault();
    if (!currentDiary || pageTurnState.isFinalTurn) return;
    const pageNum = parseInt(goToPageInput, 10);
    const numPages = currentDiary.pages ? currentDiary.pages.length : 0;

    if (pageNum >= 1 && pageNum <= numPages) {
      const targetIndex = pageNum - 1;
      if (targetIndex === currentPageIndex) {
        setGoToPageInput('');
        return;
      }
      const direction = targetIndex > currentPageIndex ? 'next' : 'prev';
      
      const pageToAnimateId = currentDiary.pages[currentPageIndex]?.id;
      if(pageToAnimateId) {
        setPageTurnState({ animatingPageId: pageToAnimateId, direction: direction, isFinalTurn: true });
      }

      setTimeout(() => {
        setCurrentPageIndex(targetIndex);
        setLastEditPosition(0);
        setPageTurnState({ animatingPageId: null, direction: null, isFinalTurn: false });
      }, pageToAnimateId ? ANIMATION_DURATION : 0);

    } else {
      alert(`Page number must be between 1 and ${numPages || 1}`);
    }
    setGoToPageInput('');
  };

  useEffect(() => {
    return () => {
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
    };
  }, []);


  if (!currentDiary || !currentDiary.pages) {
    return <div className={styles.loading}>Loading diary data...</div>;
  }
  if (currentDiary.pages.length === 0) {
    return <div className={styles.loading}>Initializing diary...</div>;
  }
  
  const finalSafeCurrentPageIndex = Math.min(Math.max(0, currentPageIndex), currentDiary.pages.length - 1);
  const currentPageData = currentDiary.pages[finalSafeCurrentPageIndex];

  if (!currentPageData) {
    console.error("Error: currentPageData is undefined. Diary State:", currentDiary, "Index:", finalSafeCurrentPageIndex);
    return <div className={styles.error}>Error loading page data. Please try again.</div>;
  }

  let animationClassForPage = '';
  if (pageTurnState.isFinalTurn && pageTurnState.animatingPageId === currentPageData.id && pageTurnState.direction) {
    animationClassForPage = pageTurnState.direction === 'next' ? pageStyles.pageCurlNextFinal : pageStyles.pageCurlPrevFinal;
  }
  
  const isNavDisabledByAnimation = pageTurnState.isFinalTurn;
  const isPageBeingAnimatedAway = pageTurnState.isFinalTurn && pageTurnState.animatingPageId === currentPageData.id;
  const isCurrentPageTrulyFocused = (currentPageIndex === finalSafeCurrentPageIndex) && !isPageBeingAnimatedAway;


  return (
    <div className={styles.diaryViewContainer}>
      <div className={styles.diaryHeader}>
         <button onClick={() => navigate('/')} className={styles.controlButton} title="Home" disabled={isNavDisabledByAnimation}><FaHome /></button>
        <button onClick={navigateToPreviousPage} className={styles.controlButton} title="Previous Page" disabled={finalSafeCurrentPageIndex === 0 || isNavDisabledByAnimation}><FaArrowLeft /></button>
        <button
            onClick={navigateToNextPage}
            className={styles.controlButton}
            title="Next Page"
            disabled={
                (finalSafeCurrentPageIndex >= (currentDiary.pages.length || 1) - 1 && 
                (currentDiary.pages[finalSafeCurrentPageIndex]?.content || '').trim().length === 0 &&
                currentDiary.pages.length > 0 
                ) || isNavDisabledByAnimation || currentDiary.pages.length >= 200
            }>
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
            disabled={isNavDisabledByAnimation}
          />
          <button type="submit" className={styles.controlButtonSmall} disabled={isNavDisabledByAnimation}>Go</button>
        </form>
        <button onClick={() => manualSaveDiary(currentDiary.pages)} className={`${styles.controlButton} ${styles.saveButton}`} title="Save" disabled={isNavDisabledByAnimation}><FaSave /></button>
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
          isCurrentPageFocused={isCurrentPageTrulyFocused}
          animationClass={animationClassForPage} 
        />
      </div>
      <div className={styles.pageIndicator}>
        Page {currentPageData.pageNumber || (finalSafeCurrentPageIndex + 1)} of {currentDiary.pages.length}
      </div>
    </div>
  );
};

export default DiaryView;