// src/App.js
import React, { useState, useEffect } from 'react';
import SidePanel from '../components/SidePanel';
import Prism from 'prismjs';
import 'prismjs/components/prism-c'; // Import C language component
import 'prismjs/themes/prism.css'; // Import Prism.js CSS for themes (adjust as needed)

function Shellcode() {
  const title = "SHELL"; // Replace with your app title
  const shellcodes = [
    "LinuxARMAdd79bytes",
    "LinuxARMchmode39bytes",
    "LinuxARMcreat39bytes",
    "LinuxARMexecve35bytes",
    "LinuxARMexecve34bytes"
  ]; // Replace with your shellcode names

  const [selectedShellcode, setSelectedShellcode] = useState(null);
  const [shellcodeTxtContent, setShellcodeTxtContent] = useState('');
  const [shellcodeCContent, setShellcodeCContent] = useState('');

  useEffect(() => {
    Prism.highlightAll(); // Highlight Prism.js syntax on initial load and updates
  }, [shellcodeCContent]); // Trigger highlight when .c content changes

  const handleShellcodeClick = (shellcode) => {
    setSelectedShellcode(shellcode);
    fetchShellcodeContent(shellcode);
  };

  const fetchShellcodeContent = (shellcode) => {
    const sanitizedFilename = shellcode
      .replace(/[^a-zA-Z0-9]/g, '_')  // Replace non-alphanumeric characters with underscores
      .replace(/_+/g, '_');  // Replace multiple underscores with a single underscore

    // Fetch .txt file
    fetch(`/shellcodes/${sanitizedFilename}.txt`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error fetching shellcode content: ${response.statusText}`);
        }
        return response.text();
      })
      .then(text => setShellcodeTxtContent(text))
      .catch(error => console.error(error));

    // Fetch .c file
    fetch(`/shellcodes/${sanitizedFilename}.cpp`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Error fetching shellcode content: ${response.statusText}`);
        }
        return response.text();
      })
      .then(text => setShellcodeCContent(text))
      .catch(error => console.error(error));
  };

  return (
    <div>
      <div className="container-fluid">
        <div className="row">
          <div className="col-md-3">
            <SidePanel shellcodes={shellcodes} onShellcodeClick={handleShellcodeClick} />
          </div>
          <div className="col-md-9 main-content">
            {selectedShellcode && (
              <div>
                <h2>{selectedShellcode}</h2>
                <div className="file-content">
                  <h3>.txt File:</h3>
                  <pre>{shellcodeTxtContent}</pre>
                </div>
                <div className="file-content">
                  <h3>.c File:</h3>
                  <pre className="language-c"><code>{shellcodeCContent}</code></pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Shellcode;
