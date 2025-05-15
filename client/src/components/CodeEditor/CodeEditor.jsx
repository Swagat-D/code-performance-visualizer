import React from 'react';
import Editor from '@monaco-editor/react';
import './CodeEditor.css';

const CodeEditor = ({ code, onChange, language, readOnly = false }) => {
  // Map our language IDs to Monaco's language IDs
  const monacoLanguageMap = {
    javascript: 'javascript',
    python: 'python',
    cpp: 'cpp',
    java: 'java'
  };
  
  // Get the Monaco language ID, fallback to the original if not in our map
  const monacoLanguage = monacoLanguageMap[language] || language;
  
  // Editor options
  const editorOptions = {
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    readOnly,
    automaticLayout: true,
    fontFamily: "'Fira Code', 'Consolas', 'Monaco', monospace",
    fontSize: 14,
    lineNumbers: 'on',
    scrollbar: {
      vertical: 'auto',
      horizontal: 'auto',
      useShadows: false,
      verticalHasArrows: false,
      horizontalHasArrows: false,
    },
    lineNumbersMinChars: 3,
    folding: true,
    glyphMargin: true,
    renderIndentGuides: true,
    wordWrap: 'on',
  };

  return (
    <div className="code-editor">
      <Editor
        height="350px"
        defaultLanguage="javascript"
        language={monacoLanguage}
        value={code}
        onChange={onChange}
        options={editorOptions}
        className="monaco-editor-container"
        theme="vs-dark"
      />
    </div>
  );
};

export default CodeEditor;