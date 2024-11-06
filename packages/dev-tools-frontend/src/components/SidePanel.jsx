// src/components/SidePanel.js

import React from 'react';

const SidePanel = ({ shellcodes, onShellcodeClick }) => {
  return (
    <div className="sidepanel">
      <h2>Shellcodes</h2>
      <ul className="list-group">
        {shellcodes.map((shellcode, index) => (
          <li
            key={index}
            className="list-group-item"
            onClick={() => onShellcodeClick(shellcode)}
            style={{ cursor: 'pointer' }}
          >
            {shellcode}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SidePanel;
