// src/components/SettingsPage/SettingsPage.js
import React, { useRef } from 'react'; // Added useRef
import styles from './SettingsPage.module.css';
import { FaDownload, FaUpload } from 'react-icons/fa'; // Import icons

const SettingsPage = ({ diaries, setDiaries }) => { // Accept diaries and setDiaries as props
  const fileInputRef = useRef(null); // Ref for the file input

  const handleExportAllDiaries = () => {
    if (!diaries || diaries.length === 0) {
      alert("There are no diaries to export.");
      return;
    }
    try {
      const dataToExport = {
        diaries: diaries,
        exportDate: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(dataToExport, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      const date = new Date().toISOString().split('T')[0];
      link.download = `aesthetic_diaries_export_${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);
      alert("Diaries export started successfully!");
    } catch (error) {
      console.error("Error exporting diaries:", error);
      alert("An error occurred while exporting your diaries. Please try again.");
    }
  };

  const handleImportDiaries = (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target.result);
        if (importedData && Array.isArray(importedData.diaries)) {
          // Basic validation: You might want to add more robust validation here
          // to ensure the structure of each diary and its pages is correct.
          const newDiaries = [...diaries];
          let importedCount = 0;

          importedData.diaries.forEach(importedDiary => {
            // Simple ID check to prevent duplicates, you might want a more robust merge strategy
            if (!newDiaries.find(d => d.id === importedDiary.id)) {
              newDiaries.push(importedDiary);
              importedCount++;
            } else {
              // Optionally, offer to overwrite or skip if diary ID already exists
              console.warn(`Diary with ID ${importedDiary.id} already exists. Skipping.`);
            }
          });

          setDiaries(newDiaries);
          alert(`${importedCount} diaries imported successfully! ${importedData.diaries.length - importedCount} diaries were skipped (possibly duplicates).`);
        } else {
          alert("Invalid file format. The file should contain a 'diaries' array.");
        }
      } catch (error) {
        console.error("Error importing diaries:", error);
        alert("An error occurred while importing diaries. Make sure the file is a valid JSON export.");
      } finally {
        // Reset file input to allow importing the same file again if needed
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsText(file);
  };

  const triggerImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };


  return (
    <div className={styles.container}>
      <h1>Settings</h1>
      <p>Adjust your preferences and manage your data here.</p>

      <section className={styles.section}>
        <h2>Data Management</h2>
        <button className={styles.actionButton} onClick={handleExportAllDiaries}>
          <FaDownload /> Export All Diaries
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }} // Hide the default file input
          onChange={handleImportDiaries}
          accept=".json" // Accept only JSON files
        />
        <button className={styles.actionButton} onClick={triggerImportClick}>
          <FaUpload /> Import Diaries
        </button>
      </section>

      {/* You can add more settings sections here, e.g., for theme, notifications, etc. */}
      <section className={styles.section}>
        <h2>Appearance</h2>
        <p>Theme settings (light/dark mode) are available in the navigation bar.</p>
        {/* Add other appearance settings if needed */}
      </section>
    </div>
  );
};

export default SettingsPage;