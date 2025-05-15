import React from 'react';
import './LanguageSelector.css';

const LanguageSelector = ({ language, supportedLanguages, onChange }) => {
  // Default languages in case the API doesn't return any
  const defaultLanguages = [
    { id: 'javascript', name: 'JavaScript', version: 'ES2021' },
    { id: 'python', name: 'Python', version: '3.9' }
  ];
  
  // Use supported languages if available, otherwise fallback to defaults
  const languages = supportedLanguages.length > 0 ? supportedLanguages : defaultLanguages;
  
  return (
    <div className="language-selector">
      <label htmlFor="language-select">Programming Language:</label>
      <select
        id="language-select"
        value={language}
        onChange={(e) => onChange(e.target.value)}
        className="language-select"
      >
        {languages.map((lang) => (
          <option key={lang.id} value={lang.id}>
            {lang.name} {lang.version ? `(${lang.version})` : ''}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSelector;