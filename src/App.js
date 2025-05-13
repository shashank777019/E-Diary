//App.js
import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeContext, ThemeProvider } from './contexts/ThemeContext';
import NavigationBar from './components/NavigationBar/NavigationBar';
import HomePage from './components/HomePage/HomePage';
import DiaryView from './components/DiaryView/DiaryView';
// Import placeholder pages
import AccountPage from './components/AccountPage/AccountPage';
import AboutUsPage from './components/AboutUsPage/AboutUsPage';
import ContactUsPage from './components/ContactUsPage/ContactUsPage';
import SettingsPage from './components/SettingsPage/SettingsPage';

// Mock data for diaries (replace with API data later)
const MOCK_DIARIES = [
  { id: '1', name: 'My First Diary', lastEntryDate: '2025-05-10', pages: [{id: 'p1', pageNumber: 1, content: "This is the first page.\nSome more thoughts here.", date: '2025-05-10'}, {id: 'p2', pageNumber: 2, content: "Second page adventures!", date: '2025-05-11'}] },
  { id: '2', name: 'Travel Journal', lastEntryDate: '2025-04-22', pages: [{id: 'p1', pageNumber: 1, content: "Exploring new places.", date: '2025-04-20'}] },
  { id: '3', name: 'Dream Log', lastEntryDate: '2025-05-12', pages: [{id: 'p1', pageNumber: 1, content: "Last night's dream was peculiar.", date: '2025-05-12'}] },
];


function AppContent() {
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

  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    document.body.className = `${theme}-theme`;
  }, [theme]);

  // For now, we pass mock diaries. Later, this could come from a DiaryContext.
  const [diaries, setDiaries] = React.useState(MOCK_DIARIES);
  const [, setActiveDiary] = React.useState(null);
  // _activeDiary is assigned but never used. 
  // If you don't need it, you can remove the following line:
  // const [, setActiveDiary] = React.useState(null);

  // If you want to keep setActiveDiary for passing to children, 
  // you can ignore the unused variable warning or prefix with _:
  // const [_activeDiary, setActiveDiary] = React.useState(null);
  const handleCreateNewDiary = () => {
    const newDiaryName = prompt("Enter the name for your new diary:");
    if (newDiaryName) {
      const newDiary = {
        id: Date.now().toString(), // Simple unique ID
        name: newDiaryName,
        lastEntryDate: new Date().toISOString().split('T')[0],
        pages: [{ id: 'p1', pageNumber: 1, content: `Welcome to ${newDiaryName}!\nStart writing your thoughts.`, date: new Date().toISOString().split('T')[0] }]
      };
      setDiaries(prevDiaries => [...prevDiaries, newDiary]);
      // Optionally, navigate to the new diary
      // setActiveDiary(newDiary); // or use react-router to navigate
    }
  };

  return (
    <Router>
      <NavigationBar diaries={diaries} />
      <div style={{ paddingTop: '70px' }}> {/* Offset for fixed navbar */}
        <Routes>
          <Route path="/" element={<HomePage diaries={diaries} onCreateNewDiary={handleCreateNewDiary} setActiveDiary={setActiveDiary}/>} />
          <Route path="/diary/:diaryId" element={<DiaryView diaries={diaries} setDiaries={setDiaries} />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/about" element={<AboutUsPage />} />
          <Route path="/contact" element={<ContactUsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
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
// Note: This is a simplified version. In a real-world application, you would want to handle errors, loading states, and possibly use a state management library for better state handling across components.