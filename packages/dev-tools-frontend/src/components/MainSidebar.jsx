// src/components/MainSidebar.js
import React from 'react';
import { Nav } from 'react-bootstrap';
import { Link } from 'react-router-dom';

function MainSidebar() {
  return (
    <div className="sidebar">
      <Nav className="flex-column">
        <Nav.Link as={Link} to="/decompiler">Decompiler</Nav.Link>
        <Nav.Link as={Link} to="/jadxgui">JadxGUI</Nav.Link>
        <Nav.Link as={Link} to="/shellcode">Shellcodes</Nav.Link>
      </Nav>
    </div>
  );
}

export default MainSidebar;
