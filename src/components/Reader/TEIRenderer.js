import React from 'react';
import { DOMParser } from 'xmldom';

const TEIRenderer = ({ content, currentPageIndex, highlightWords }) => {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(content, 'text/xml');

  const highlightText = (text) => {
    if (!highlightWords.length) return text;

    const regex = new RegExp(`(${highlightWords.join('|')})`, 'gi');
    return text.split(regex).map((part, index) =>
      regex.test(part) ? <span className='highlight' key={index}>{part}</span> : part
    );
  };

  const renderElement = (element) => {
    switch (element.nodeName) {
      case 'p':
        return <p key={Math.random()}>{Array.from(element.childNodes).map(renderElement)}</p>;
      case 'head':
        return <h3 key={Math.random()}>{Array.from(element.childNodes).map(renderElement)}</h3>;
      case 'hi':
        return <em key={Math.random()}>{Array.from(element.childNodes).map(renderElement)}</em>;
      case '#text':
        return highlightText(element.nodeValue);
      default:
        return Array.from(element.childNodes).map(renderElement);
    }
  };

  const body = xmlDoc.getElementsByTagName('body')[0];
  const pageElements = Array.from(body.getElementsByTagName('pb'));
  const currentPageElement = pageElements[currentPageIndex];
  let contentToRender = [];

  if (currentPageElement) {

    let currentNode = currentPageElement.nextSibling;
    while (currentNode && currentNode.nodeName !== 'pb') {
      contentToRender.push(renderElement(currentNode));
      currentNode = currentNode.nextSibling;
    }
  }

  return (
    <div className="tei-content">
      <div className="page-text">
        {contentToRender}
      </div>
    </div>
  );
};

export default TEIRenderer;