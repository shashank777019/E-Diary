import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Page from './Page/Page';
import styles from './DiaryView.module.css';
import { FaArrowLeft, FaArrowRight, FaSave, FaHome } from 'react-icons/fa';

const DiaryView = ({ diaries, setDiaries }) => {
  const { diaryId } = useParams();
  const navigate = useNavigate();
  const [currentDiary, setCurrentDiary] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [goToPageInput, setGoToPageInput] = useState('');
  const [lastEditPosition, setLastEditPosition] = useState(0);

  useEffect(() => {
    const foundDiary = diaries.find(d => d.id === diaryId);
    if (foundDiary) {
      setCurrentDiary(foundDiary);
      const lastPageIdx = foundDiary.pages.length > 0 ? foundDiary.pages.length - 1 : 0;
      setCurrentPageIndex(lastPageIdx);
      setLastEditPosition(foundDiary.pages[lastPageIdx]?.content.length || 0);
    } else {
      alert('Diary not found!');
      navigate('/');
    }
  }, [diaryId, diaries, navigate]);

  const saveDiary = (pages) => {
    const updatedDiary = {
      ...currentDiary,
      pages,
      lastEntryDate: new Date().toISOString().split('T')[0]
    };
    setCurrentDiary(updatedDiary);
    setDiaries(prev => prev.map(d => (d.id === updatedDiary.id ? updatedDiary : d)));
  };

  const ensurePageExists = (index) => {
    const pages = [...currentDiary.pages];
    if (index < pages.length) return pages;
    const newPage = {
      id: `p${Date.now()}`,
      pageNumber: pages.length + 1,
      content: '',
      date: new Date().toISOString().split('T')[0]
    };
    pages.push(newPage);
    return pages;
  };

  const handleContentChange = (pageId, newContent) => {
    const updatedPages = currentDiary.pages.map(page =>
      page.id === pageId
        ? { ...page, content: newContent, date: new Date().toISOString().split('T')[0] }
        : page
    );
    saveDiary(updatedPages);
    setLastEditPosition(newContent.length);
  };

  const handlePageOverflow = (overflowText, direction = 'next') => {
    let pages = [...currentDiary.pages];
    if (direction === 'next') {
      // Trim current page to 18 lines
      const lines = pages[currentPageIndex].content.split(/\r?\n/).slice(0, 18);
      pages[currentPageIndex].content = lines.join('\n');
      // Ensure next page exists
      pages = ensurePageExists(currentPageIndex + 1);
      // Prepend overflow
      pages[currentPageIndex + 1].content = overflowText + '\n' + (pages[currentPageIndex + 1].content || '');
      saveDiary(pages);
      setCurrentPageIndex(currentPageIndex + 1);
      setLastEditPosition(overflowText.length);
    } else {
      // Move to previous page
      if (currentPageIndex === 0) return;
      const prevIdx = currentPageIndex - 1;
      pages[prevIdx].content += '\n' + pages[currentPageIndex].content;
      pages[currentPageIndex].content = '';
      saveDiary(pages);
      setCurrentPageIndex(prevIdx);
      setLastEditPosition(pages[prevIdx].content.length);
    }
  };

  const handleNextClick = () => handlePageOverflow('', 'next');
  const handlePrevClick = () => handlePageOverflow('', 'prev');

  const handleGoToPage = (e) => {
    e.preventDefault();
    const pageNum = parseInt(goToPageInput, 10);
    if (currentDiary && pageNum >= 1 && pageNum <= currentDiary.pages.length) {
      setCurrentPageIndex(pageNum - 1);
      setLastEditPosition(currentDiary.pages[pageNum - 1]?.content.length || 0);
    } else {
      alert(`Page number must be between 1 and ${currentDiary?.pages?.length || 1}`);
    }
    setGoToPageInput('');
  };

  if (!currentDiary) return <div className={styles.loading}>Loading diary...</div>;

  const currentPageData = currentDiary.pages[currentPageIndex] || { id: 'p0', pageNumber: 1, content: '', date: new Date().toISOString().split('T')[0] };

  return (
    <div className={styles.diaryViewContainer}>
      <div className={styles.diaryHeader}>
        <button onClick={() => navigate('/')} className={styles.controlButton} title="Home"><FaHome /></button>
        <button onClick={handlePrevClick} className={styles.controlButton} title="Previous Page"><FaArrowLeft /></button>
        <button onClick={handleNextClick} className={styles.controlButton} title="Next Page"><FaArrowRight /></button>
        <h2>{currentDiary.name}</h2>
        <form onSubmit={handleGoToPage} className={styles.goToPageForm}>
          <input
            type="number"
            min="1"
            max={currentDiary.pages.length}
            value={goToPageInput}
            onChange={e => setGoToPageInput(e.target.value)}
            placeholder="Page #"
            className={styles.goToPageInput}
          />
          <button type="submit" className={styles.controlButtonSmall}>Go</button>
        </form>
        <button onClick={() => alert('Saved')} className={`${styles.controlButton} ${styles.saveButton}`} title="Save"><FaSave /></button>
      </div>
      <div className={styles.pageContainer}>
        <Page
          key={currentPageData.id}
          pageData={currentPageData}
          onContentChange={handleContentChange}
          onPageFull={handlePageOverflow}
          initialFocusPosition={lastEditPosition}
          isCurrentPageFocused={true}
        />
      </div>
      <div className={styles.pageIndicator}>
        Page {currentPageData.pageNumber} of {currentDiary.pages.length}
      </div>
    </div>
  );
};

export default DiaryView;