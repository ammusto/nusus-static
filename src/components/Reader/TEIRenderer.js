import React from 'react';

const TEIRenderer = ({ pageContents, currentPageIndex, pageNumbers, highlightWords }) => {
  const renderPage = (pageIndex) => {
    const pageNumber = pageNumbers[pageIndex];
    const pageText = pageContents[pageNumber] || '';
    return highlightText(pageText, highlightWords);
  };

  const highlightText = (text, words) => {
    if (!words.length) return text;
    const regex = new RegExp(`(${words.join('|')})`, 'gi');
    return text.replace(regex, "<span class='highlight'>$1</span>");
  };

  return (
    <div className="tei-content">
      <div className="page-text" dangerouslySetInnerHTML={{ __html: renderPage(currentPageIndex) }} />
    </div>
  );
};

export default TEIRenderer;