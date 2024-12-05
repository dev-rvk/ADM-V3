import { useState } from 'react';
import axios from 'axios';
import FileUploadBar from '../components/FileUploadBar';
import CheckboxWithContent from '../components/CheckboxWithContent';
import {config} from 'config';

const BACKEND_URL = `${config.DEV_TOOLS_BACKEND_URL}/decompile_so`;

function Decompiler() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [showAngr, setShowAngr] = useState(false);
  const [showGhidra, setShowGhidra] = useState(false);
  const [fileContentC, setFileContentC] = useState(''); 
  const [fileContentH, setFileContentH] = useState('');
  const [angrContent, setAngrContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    setSelectedFile(file);
    console.log(selectedFile);
  };

  const handleFileRequest = async () => {
    let checkbox = [];

    if (showGhidra) {
      checkbox.push("ghidra");
    }

    if (showAngr) {
      checkbox.push("angr");
    }

    setLoading(true); // Set loading state to true

    try {
      const formData = new FormData();
      formData.append('sofile', selectedFile);
      formData.append('selections', JSON.stringify(checkbox));
      console.log("Form Data:");
      for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
      }
      

      const response = await axios.post(BACKEND_URL, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const files = response.data.files;
      console.log(files);

      for (const file of files) {
        const fileResponse = await axios.get(file.url);
        if (file.filename === 'out_ghidra.c') {
          setFileContentC(prev => prev + '\n' + fileResponse.data);
        } else if (file.filename === 'out_ghidra.h') {
          setFileContentH(prev => prev + '\n' + fileResponse.data);
        } else if (file.filename === 'out_angr.c') {
          setAngrContent(prev => prev + '\n' + fileResponse.data);
        }
      }      

    } catch (error) {
      console.error('Error fetching file:', error);
    } finally {
      setLoading(false); // Set loading state to false
    }
  };

  const handleFileUpload = () => {
    document.getElementById('fileInput').click();
  };

  const handleSubmit = () => {
    if (selectedFile) {
      handleFileRequest();
    } else {
      console.log("No File Selected");
    }
  };

  return (
    <div>
      <div className="container mt-4">
        <h3>DECOMPILER</h3>
        <FileUploadBar
          selectedFile={selectedFile}
          handleFileRequest={handleFileRequest}
          handleFileUpload={handleFileUpload}
          handleFileChange={handleFileChange}
          handleSubmit={handleSubmit}
        />
        <div className="row">
          <div className="col-md-6">
            <CheckboxWithContent
              label="Angr"
              show={showAngr}
              setShow={setShowAngr}
              fileContent={loading ? "Loading..." : angrContent}
              language="c" 
            />
          </div>
          <div className="col-md-6">
            <CheckboxWithContent
              label="Ghidra"
              show={showGhidra}
              setShow={setShowGhidra}
              fileContent={loading ? "Loading..." : fileContentC}
              additionalContent={loading ? "Loading..." : fileContentH} // Pass .h content
              language="c" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Decompiler;
