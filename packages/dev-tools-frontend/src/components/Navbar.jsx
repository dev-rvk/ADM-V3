// Navbar.js

import React from 'react';

const Navbar = ({ title }) => {
  return (
    <nav className="navbar navbar-light bg-light">
      <div className="container-fluid">
        <span className="navbar-brand mb-0 h1">{title}</span>
      </div>
    </nav>
  );
};

export default Navbar;