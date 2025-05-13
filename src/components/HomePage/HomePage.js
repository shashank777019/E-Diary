//HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './HomePage.module.css';
import { FaPlusCircle, FaBookOpen } from 'react-icons/fa'; // Using react-icons

const DiaryCard = ({ diary, onSelectDiary }) => {
  return (
    <Link to={`/diary/${diary.id}`} className={styles.diaryCard} onClick={() => onSelectDiary(diary)}>
      <FaBookOpen className={styles.diaryIcon} />
      <h3 className={styles.diaryName}>{diary.name}</h3>
      <p className={styles.diaryDate}>Last entry: {diary.lastEntryDate || 'N/A'}</p>
    </Link>
  );
};

const HomePage = ({ diaries, onCreateNewDiary, setActiveDiary }) => {
  return (
    <div className={styles.homePageContainer}>
      <div className={styles.header}>
        <h1>Your Diaries</h1>
        <button className={styles.createNewButton} onClick={onCreateNewDiary}>
          <FaPlusCircle className={styles.plusIcon} /> Create New Diary
        </button>
      </div>
      <div className={styles.diariesGrid}>
        {diaries && diaries.length > 0 ? (
          diaries.map(diary => (
            <DiaryCard key={diary.id} diary={diary} onSelectDiary={setActiveDiary} />
          ))
        ) : (
          <p className={styles.noDiariesText}>No diaries yet. Create one to get started!</p>
        )}
      </div>
    </div>
  );
};

export default HomePage;