// src/components/AccountPage/AccountPage.js
import React from 'react';
import styles from './AccountPage.module.css';
import { FaTrash, FaDownload, FaUserEdit, FaKey, FaExclamationTriangle } from 'react-icons/fa'; // Added more icons

const AccountPage = ({ diaries, onDeleteDiary }) => {

  const handleExportAllData = () => {
    if (!diaries || diaries.length === 0) {
      alert("There is no data to export.");
      return;
    }
    try {
      const dataToExport = {
        diaries: diaries,
        // You can add other user-specific data here if you have it
        // For example: userProfile: { name: "User", email: "user@example.com" },
        exportDate: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(dataToExport, null, 2); // null, 2 for pretty printing
      const blob = new Blob([jsonString], { type: 'application/json' });
      const href = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = href;
      const date = new Date().toISOString().split('T')[0];
      link.download = `aesthetic_diary_export_${date}.json`; // Filename for the download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href); // Clean up
      alert("Data export started successfully!");
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("An error occurred while exporting your data. Please try again.");
    }
  };

  return (
    <div className={styles.container}>
      <h1>Account Management</h1>

      <section className={styles.section}>
        <h2>My Diaries</h2>
        {diaries && diaries.length > 0 ? (
          <ul className={styles.diaryList}>
            {diaries.map(diary => (
              <li key={diary.id} className={styles.diaryItem}>
                <span>{diary.name}</span>
                <button
                  onClick={() => onDeleteDiary(diary.id)}
                  className={`${styles.actionButton} ${styles.deleteButton}`}
                  title={`Delete ${diary.name}`}
                >
                  <FaTrash /> Delete
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>You don't have any diaries yet.</p>
        )}
      </section>

      <section className={styles.section}>
        <h2>Account Actions</h2>
        <button className={styles.actionButton} onClick={() => alert("Change Password clicked (Not Implemented)")}>
          <FaKey /> Change Password
        </button>
        <button className={styles.actionButton} onClick={handleExportAllData}>
          <FaDownload /> Export All Data
        </button>
        <button className={`${styles.actionButton} ${styles.dangerButton}`} onClick={() => alert("Delete Account clicked (Not Implemented)")}>
          <FaExclamationTriangle /> Delete Account
        </button>
      </section>

      <section className={styles.section}>
          <h2>User Profile</h2>
          <p>Edit your profile information here.</p>
          <button className={styles.actionButton} onClick={() => alert("Edit Profile clicked (Not Implemented)")}>
            <FaUserEdit /> Edit Profile
          </button>
      </section>
    </div>
  );
};

export default AccountPage;