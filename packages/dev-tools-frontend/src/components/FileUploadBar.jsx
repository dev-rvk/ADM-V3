import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css'; 

function FileUploadBar({ selectedFile, handleFileChange, handleFileUpload, handleSubmit }) {
  return (
    <div className="container d-flex justify-content-center my-3 mt-5">
      <div className="col-md-6 col-lg-6"> 
        <div className="input-group mb-3">
          <input
            type="text"
            className="form-control"
            placeholder="No file chosen"
            aria-label="File input"
            aria-describedby="fileInputAddon"
            value={selectedFile ? selectedFile.name : ''}
            readOnly
          />
          <input
            type="file"
            id="fileInput"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button className="btn btn-dark" type="button" id="fileInputAddon" onClick={handleFileUpload}>
            Upload File
          </button>
          <button className="btn btn-success" type="button" onClick={handleSubmit}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

export default FileUploadBar;
