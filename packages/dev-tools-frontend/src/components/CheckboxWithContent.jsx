import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coy } from 'react-syntax-highlighter/dist/esm/styles/prism';

function CheckboxWithContent({ label, show, setShow, fileContent, additionalContent, language }) {
  return (
    <div className="mb-3">
      <div className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          id={`${label}Check`}
          checked={show}
          onChange={() => setShow(!show)}
        />
        <label className="form-check-label" htmlFor={`${label}Check`}>
          {label}
        </label>
      </div>
      {show && (
        <div className="border p-3 mt-2" style={{ maxHeight: '800px', overflowY: 'auto' }}>
          <h3>{label}</h3>
          <SyntaxHighlighter language={language} style={coy} showLineNumbers>
            {fileContent}
          </SyntaxHighlighter>
          {label === 'Ghidra' && additionalContent && (
            <>
              <h3>{label} - Header (.h)</h3>
              <SyntaxHighlighter language={language} style={coy} showLineNumbers>
                {additionalContent}
              </SyntaxHighlighter>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default CheckboxWithContent;
