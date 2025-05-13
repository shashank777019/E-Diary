//NavigationBar.js
import React, { useState, useContext, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
// import { useNavigate } from 'react-router-dom'; // Uncomment if you need to use useNavigate in the future
import { ThemeContext } from '../../contexts/ThemeContext';
import styles from './NavigationBar.module.css';
// You might want to use an icon library like react-icons
// npm install react-icons
import { FaBars, FaTimes, FaMoon, FaSun, FaShareAlt, FaUser, FaCog, FaInfoCircle, FaEnvelope } from 'react-icons/fa';

const NavigationBar = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navRef = useRef(null); // Uncomment if you need to use navRef in the future

  const toggleNav = () => setIsNavOpen(!isNavOpen);

  const handleConnectAll = () => {
    alert("Connect all diaries clicked. Backend logic needed for sharing.");
    setIsNavOpen(false);
  }

  // Close nav if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setIsNavOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className={`${styles.navbar} ${theme === 'dark' ? styles.dark : ''}`} ref={navRef}>
      <div className={styles.navbarBrand}>
        <Link to="/" className={styles.brandName}>Aesthetic Diary</Link>
      </div>
      <div className={styles.navToggle} onClick={toggleNav}>
        {isNavOpen ? <FaTimes /> : <FaBars />}
      </div>
      <div className={`${styles.navMenu} ${isNavOpen ? styles.navMenuActive : ''}`}>
        <Link to="/account" className={styles.navItem} onClick={() => setIsNavOpen(false)}>
          <FaUser className={styles.navIcon} /> Account
        </Link>

        <div className={styles.navItem} onClick={handleConnectAll}>
          <FaShareAlt className={styles.navIcon} /> Connect all diaries
        </div>

        <div className={styles.navItem} onClick={() => { toggleTheme(); setIsNavOpen(false); }}>
          {theme === 'light' ? <FaMoon className={styles.navIcon} /> : <FaSun className={styles.navIcon} />}
          Select Mode ({theme === 'light' ? 'Dark' : 'Light'})
        </div>

        <Link to="/settings" className={styles.navItem} onClick={() => setIsNavOpen(false)}>
          <FaCog className={styles.navIcon} /> Settings
        </Link>
        <Link to="/about" className={styles.navItem} onClick={() => setIsNavOpen(false)}>
          <FaInfoCircle className={styles.navIcon} /> About Us
        </Link>
        <Link to="/contact" className={styles.navItem} onClick={() => setIsNavOpen(false)}>
          <FaEnvelope className={styles.navIcon} /> Contact Us
        </Link>
      </div>
    </nav>
  );
};

export default NavigationBar;