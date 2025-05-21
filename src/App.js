// src/App.js
import React, { useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeContext, ThemeProvider } from './contexts/ThemeContext';
import NavigationBar from './components/NavigationBar/NavigationBar';
import HomePage from './components/HomePage/HomePage';
import DiaryView from './components/DiaryView/DiaryView';
import AccountPage from './components/AccountPage/AccountPage';
import AboutUsPage from './components/AboutUsPage/AboutUsPage';
import ContactUsPage from './components/ContactUsPage/ContactUsPage';
import SettingsPage from './components/SettingsPage/SettingsPage';

const LOCAL_STORAGE_KEY = 'aestheticDiaries';

// Mock data for diaries (remains as a fallback or for first-time use)
const MOCK_DIARIES = [
  { id: '1', name: 'My First Diary', lastEntryDate: '2025-05-10', pages: [{id: 'p1', pageNumber: 1, content: "This is the first page.\nSome more thoughts here.", date: '2025-05-10'}, {id: 'p2', pageNumber: 2, content: "Second page adventures!", date: '2025-05-11'}] },
  { id: '2', name: 'Travel Journal', lastEntryDate: '2025-04-22', pages: [{id: 'p1', pageNumber: 1, content: "Exploring new places.", date: '2025-04-20'}] },
  { id: '3', name: 'Dream Log', lastEntryDate: '2025-05-12', pages: [{id: 'p1', pageNumber: 1, content: "Last night's dream was peculiar.", date: '2025-05-12'}] },
];


function AppContent() {
  const { theme } = useContext(ThemeContext);

  // Load diaries from localStorage or use MOCK_DIARIES if none found
  const [diaries, setDiaries] = useState(() => {
    try {
      const storedDiaries = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedDiaries) {
        const parsedDiaries = JSON.parse(storedDiaries);
        // Basic validation: ensure it's an array.
        // You might want more thorough validation if the structure could be corrupted.
        if (Array.isArray(parsedDiaries)) {
          // Further validation to ensure essential properties exist
          const isValidStructure = parsedDiaries.every(diary =>
            typeof diary.id === 'string' &&
            typeof diary.name === 'string' &&
            Array.isArray(diary.pages) &&
            diary.pages.every(page =>
              typeof page.id === 'string' &&
              (typeof page.content === 'string' || page.content === null || page.content === '') && // Allow null or empty string for content
              typeof page.date === 'string' // Assuming date is stored as string
            )
          );
          if (isValidStructure) {
            return parsedDiaries;
          } else {
            console.warn("Stored diaries have an invalid structure. Falling back to mock data.");
          }
        } else {
           console.warn("Stored diaries is not an array. Falling back to mock data.");
        }
      }
    } catch (error) {
      console.error("Error loading diaries from localStorage:", error);
      // Fallback to mock data if loading or parsing fails
    }
    // Fallback to mock data if nothing in localStorage or if data is invalid
    console.log("Initializing with MOCK_DIARIES");
    return MOCK_DIARIES;
  });

  const [, setActiveDiary] = useState(null); // Original setActiveDiary, kept if needed by HomePage

  useEffect(() => {
    document.body.className = `${theme}-theme`;
  }, [theme]);

  // Save diaries to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(diaries));
      console.log("Diaries saved to localStorage:", diaries);
    } catch (error) {
      console.error("Error saving diaries to localStorage:", error);
    }
  }, [diaries]);

  const handleCreateNewDiary = () => {
    const newDiaryName = prompt("Enter the name for your new diary:");
    if (newDiaryName) {
      const newDiary = {
        id: Date.now().toString(), // Simple unique ID
        name: newDiaryName,
        lastEntryDate: new Date().toISOString().split('T')[0],
        pages: [{ id: `p${Date.now()}`, pageNumber: 1, content: `Welcome to ${newDiaryName}!\nStart writing your thoughts.`, date: new Date().toISOString().split('T')[0] }]
      };
      setDiaries(prevDiaries => [...prevDiaries, newDiary]);
    }
  };

  const handleDeleteDiary = (diaryIdToDelete) => {
    if (window.confirm("Are you sure you want to delete this diary? This action cannot be undone.")) {
      setDiaries(prevDiaries => prevDiaries.filter(diary => diary.id !== diaryIdToDelete));
    }
  };

  // The console.log for component availability is part of your original code
  console.log({
    NavigationBar,
    HomePage,
    DiaryView,
    AccountPage,
    AboutUsPage,
    ContactUsPage,
    SettingsPage,
    ThemeContext,
    ThemeProvider
  });

  return (
    <Router>
      <NavigationBar diaries={diaries} />
      <div style={{ paddingTop: '70px' }}> {/* Offset for fixed navbar */}
        <Routes>
          <Route path="/" element={<HomePage diaries={diaries} onCreateNewDiary={handleCreateNewDiary} setActiveDiary={setActiveDiary}/>} />
          <Route path="/diary/:diaryId" element={<DiaryView diaries={diaries} setDiaries={setDiaries} />} />
          <Route path="/account" element={<AccountPage diaries={diaries} onDeleteDiary={handleDeleteDiary} />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/contact" element={<ContactUsPage />} />
          <Route path="/settings" element={<SettingsPage diaries={diaries} setDiaries={setDiaries} />} />
          {/* Add other routes here: connect-all, connect-single etc. */}
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;