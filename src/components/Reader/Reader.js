import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { loadTexts } from '../../services/metadataLoader';
import { Link } from 'react-router-dom';

import TEIRenderer from './TEIRenderer';
import './Reader.css';

const INITIAL_LOAD = 50;
const LOAD_THRESHOLD = 10;

const Reader = () => {
  const { textId, pageNumber } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [text, setText] = useState(null);
  const [teiContent, setTeiContent] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [pageNumbers, setPageNumbers] = useState([]);
  const [loadedPageIndices, setLoadedPageIndices] = useState([]);
  const [highlightWords, setHighlightWords] = useState([]);
  const [processedPages, setProcessedPages] = useState({});

  useEffect(() => {
    const fetchText = async () => {
      const texts = await loadTexts();
      const foundText = texts.find(t => t.text_id === textId);
      setText(foundText);
    };
    fetchText();

    const searchParams = new URLSearchParams(location.search);
    const highlight = searchParams.get('highlight');
    if (highlight) {
      setHighlightWords(highlight.split(','));
    }
  }, [textId, location.search]);

  useEffect(() => {
    const fetchTEIContent = async () => {
      try {
        const response = await fetch(`/texts/tei/${textId}.xml`);
        const xmlText = await response.text();
        setTeiContent(xmlText);

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        const pageElements = Array.from(xmlDoc.getElementsByTagName('pb'));

        const newPageNumbers = pageElements.map(pb => pb.getAttribute('n'));
        setPageNumbers(newPageNumbers);

        const targetIndex = newPageNumbers.indexOf(pageNumber) !== -1 ? newPageNumbers.indexOf(pageNumber) : 0;
        setCurrentPageIndex(targetIndex);

        const startIndex = Math.max(0, targetIndex - Math.floor(INITIAL_LOAD / 2));
        const endIndex = Math.min(pageElements.length - 1, startIndex + INITIAL_LOAD - 1);
        setLoadedPageIndices(Array.from({ length: endIndex - startIndex + 1 }, (_, i) => startIndex + i));

      } catch (error) {
        console.error('Error fetching TEI content:', error);
      }
    };
    if (text) {
      fetchTEIContent();
    }
  }, [text, textId, pageNumber]);

  const processedTEIContent = useMemo(() => {
    if (!teiContent) return {};

    const bodyContent = teiContent.match(/<body>([\s\S]*?)<\/body>/)?.[1] || '';
    const pageRegex = /<pb n="(\d+)" \/>([\s\S]*?)(?=<pb n="\d+" \/>|$)/g;
    const pages = {};
    let match;

    while ((match = pageRegex.exec(bodyContent)) !== null) {
      const pageText = match[2]
        .replace(/<div[^>]*>|<\/div>/g, '') 
        .replace(/<head>/g, '<h3>')         
        .replace(/<\/head>/g, '</h3>');   

      pages[match[1]] = pageText;
    }

    return pages;
  }, [teiContent]);

  useEffect(() => {
    setProcessedPages(processedTEIContent);
  }, [processedTEIContent]);
  
  const loadMorePages = useCallback((direction) => {
    setLoadedPageIndices(prevIndices => {
      const newIndices = [...prevIndices];
      if (direction === 'forward' && newIndices[newIndices.length - 1] < pageNumbers.length - 1) {
        const startLoad = newIndices[newIndices.length - 1] + 1;
        const endLoad = Math.min(pageNumbers.length - 1, startLoad + INITIAL_LOAD - 1);
        for (let i = startLoad; i <= endLoad; i++) {
          newIndices.push(i);
        }
      } else if (direction === 'backward' && newIndices[0] > 0) {
        const endLoad = newIndices[0] - 1;
        const startLoad = Math.max(0, endLoad - INITIAL_LOAD + 1);
        for (let i = endLoad; i >= startLoad; i--) {
          newIndices.unshift(i);
        }
      }
      return newIndices;
    });
  }, [pageNumbers.length]);

  const handlePageChange = (newPageIndex) => {
    if (newPageIndex < 0 || newPageIndex >= pageNumbers.length) return;

    setCurrentPageIndex(newPageIndex);
    navigate(`/reader/${textId}/${pageNumbers[newPageIndex]}${location.search}`);

    if (newPageIndex <= loadedPageIndices[LOAD_THRESHOLD - 1]) {
      loadMorePages('backward');
    } else if (newPageIndex >= loadedPageIndices[loadedPageIndices.length - LOAD_THRESHOLD]) {
      loadMorePages('forward');
    }
  };

  if (!text || !teiContent) {
    return <div>Loading...</div>;
  }

  const displayPgRng = () => {
    if (text.pg_rng.includes('-')) {
      return text.pg_rng.split('-')[1];
    }
    return text.pg_rng;
  };

  return (
    <div className="container">
      <div className='main'>
        <div className='text-content reader-content'>
          <Link
            className='preview-link'
            to={`/text/${textId}`}
          ><h2>{text.title_ar}</h2>
          </Link>

          <div className="pagination flex">
            <div className='pagination-left'>
              <button
                className='reader-button'
                onClick={() => handlePageChange(currentPageIndex - 1)} disabled={currentPageIndex === 0}>
                Previous Page
              </button>
            </div>
            <div className='pagination-center'>
            </div>
            <div className='pagination-right'>
              <button
                className='reader-button'
                onClick={() => handlePageChange(currentPageIndex + 1)} disabled={currentPageIndex === pageNumbers.length - 1}>
                Next Page
              </button>
            </div>
          </div>
          <TEIRenderer
            pageContents={processedPages}
            currentPageIndex={currentPageIndex}
            pageNumbers={pageNumbers}
            highlightWords={highlightWords}
          />
          <div className="pagination flex">
            <div className='pagination-left'>
              <button
                className='reader-button'
                onClick={() => handlePageChange(currentPageIndex - 1)} disabled={currentPageIndex === 0}>
                Previous Page
              </button>
            </div>
            <div className='pagination-center'>
              <span>Page {pageNumbers[currentPageIndex]} of {displayPgRng()} </span>
            </div>
            <div className='pagination-right'>
              <button
                className='reader-button'
                onClick={() => handlePageChange(currentPageIndex + 1)} disabled={currentPageIndex === pageNumbers.length - 1}>
                Next Page
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reader;