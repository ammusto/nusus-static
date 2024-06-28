import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import HomePage from './components/Home/HomePage';
import AboutPage from './components/About/About';
import MetadataBrowser from './components/MetadataBrowser/MetadataBrowser';
import TextPage from './components/TextPage/TextPage';
import AuthorPage from './components/AuthorPage/AuthorPage';
import SearchPage from './components/Search/SearchPage';
import Reader from './components/Reader/Reader';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/metadata" element={<MetadataBrowser />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/text/:textId" element={<TextPage />} />
          <Route path="/author/:authorId" element={<AuthorPage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/reader/:textId/:pageNumber?" element={<Reader />} />
        </Routes>
      </Layout>
    </Router>
  );
}
export default App;