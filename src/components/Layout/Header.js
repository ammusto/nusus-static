import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Header = () => {
  const navigate = useNavigate();

  const handleSearchClick = () => {
    sessionStorage.removeItem('searchPageState');
    navigate('/search');
  };

  return (
    <header>
      <div className="header-container">
        <div className="header-text">nuṣūṣ</div>
        <nav>
          <ul className='flex'>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/metadata">Metadata Browser</Link></li>
            <li><a href="#" onClick={handleSearchClick}>Search</a></li>
            <li><Link to="/about">About</Link></li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;