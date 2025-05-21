// src/components/AboutUsPage/AboutUsPage.js
import React from 'react';
import styles from './AboutUsPage.module.css';
import { FaLinkedin, FaGithub, FaInfoCircle, FaUserCircle, FaExclamationTriangle } from 'react-icons/fa';

const AboutUsPage = () => {
  return (
    <div className={styles.container}>
      <h1 className={styles.header}><FaInfoCircle className={styles.headerIcon}/> About Us</h1>
      <p className={styles.introText}>
        This Aesthetic Diary & Notebook application is designed to provide a beautiful and personal space for your thoughts, dreams, and daily reflections.
      </p>
      
      <div className={styles.developerSection}>
        <FaUserCircle className={styles.developerIcon} />
        <h2 className={styles.developerName}>Developed by: <strong>Shashank</strong></h2>
        <p className={styles.developerBio}>
          A passionate developer creating tools that inspire creativity and organization. 
          Connect with me on:
        </p>
        <div className={styles.socialLinks}>
          <a 
            href="https://www.linkedin.com/in/shashankbhaskar3303/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.socialLink}
            aria-label="Shashank's LinkedIn Profile"
          >
            <FaLinkedin className={styles.socialIcon} /> LinkedIn
          </a>
          <a 
            href="https://github.com/shashank777019" 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.socialLink}
            aria-label="Shashank's GitHub Profile"
          >
            <FaGithub className={styles.socialIcon} /> GitHub
          </a>
        </div>
      </div>

      <div className={styles.appInfoSection}>
        <h3>Our Mission</h3>
        <p>To provide a simple, elegant, and customizable digital diary experience that users will love.</p>
        <h3>Features</h3>
        <ul>
          <li>Create and manage multiple diaries</li>
          <li>Aesthetic and customizable page view</li>
          <li>Light and Dark mode themes</li>
          <li>Easy navigation and page management</li>
          {/* Add more features as they are developed */}
        </ul>
      </div>

      <div className={styles.statusSection}>
        <FaExclamationTriangle className={styles.statusIcon} />
        <h3 className={styles.statusTitle}>Project Status</h3>
        <p className={styles.statusText}>
          Please note that this Aesthetic Diary & Notebook is currently an <strong>incomplete project</strong> and is actively under development. 
          New features are being added, and existing ones are being refined. Your patience and understanding are appreciated as this application evolves.
        </p>
      </div>

    </div>
  );
};

export default AboutUsPage;
