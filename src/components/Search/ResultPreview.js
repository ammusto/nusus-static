import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';

const DESKTOP_CONTEXT_SIZE = 5;
const TABLET_CONTEXT_SIZE = 4;
const MOBILE_CONTEXT_SIZE = 2;

const ResultPreview = ({ pageId, position, textId, pageNum, query }) => {
  const [preview, setPreview] = useState({ pre: [], highlight: [], post: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [screenSize, setScreenSize] = useState('desktop');

  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth <= 468) {
        setScreenSize('mobile');
      } else if (window.innerWidth <= 768) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setPreview({ pre: [], highlight: [], post: [] });

    const controller = new AbortController();
    const signal = controller.signal;

    const fetchPreview = async () => {
      try {
        const response = await fetch(`/texts/data/${pageId}.json`, { signal });
        const pageData = await response.json();
        const tokens = pageData.tokens;
        
        const queryTokens = query.split(/\s+/);
        const highlightTokens = tokens.slice(position, position + queryTokens.length);
        const preTokens = tokens.slice(Math.max(0, position - DESKTOP_CONTEXT_SIZE), position);
        const postTokens = tokens.slice(position + queryTokens.length, position + queryTokens.length + DESKTOP_CONTEXT_SIZE);

        setPreview({
          pre: preTokens,
          highlight: highlightTokens,
          post: postTokens
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error fetching preview:', error);
          setPreview({ pre: [], highlight: ['Preview not available'], post: [] });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreview();

    return () => {
      controller.abort();
    };
  }, [pageId, position, query]);

  const displayPreview = useMemo(() => {
    let contextSize;
    switch (screenSize) {
      case 'mobile':
        contextSize = MOBILE_CONTEXT_SIZE;
        break;
      case 'tablet':
        contextSize = TABLET_CONTEXT_SIZE;
        break;
      default:
        contextSize = DESKTOP_CONTEXT_SIZE;
    }

    return {
      pre: preview.pre.slice(-contextSize).join(' '),
      highlight: preview.highlight.join(' '),
      post: preview.post.slice(0, contextSize).join(' ')
    };
  }, [preview, screenSize]);

  const addEllipsisPre = (text) => {
    return text ? `...${text}` : '';
  };

  const addEllipsisPost = (text) => {
    return text ? `${text}...` : '';
  };

  return (
    <div>
      <Link 
        className='preview-link' 
        to={`/reader/${textId}/${pageNum}?highlight=${encodeURIComponent(query)}`}
      >
        {isLoading ? (
          <div className='result-preview loading'>Loading preview...</div>
        ) : (
          <div className='result-preview'>
            <div className='preview-pre'>{screenSize !== 'desktop' ? addEllipsisPre(displayPreview.pre) : displayPreview.pre}</div>
            <div className='preview-highlight'>{displayPreview.highlight}</div>
            <div className='preview-post'>{screenSize !== 'desktop' ? addEllipsisPost(displayPreview.post) : displayPreview.post}</div>
          </div>
        )}
      </Link>
    </div>
  );
};

export default ResultPreview;