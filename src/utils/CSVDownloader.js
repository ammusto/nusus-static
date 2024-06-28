import React from 'react';

const CSVDownloader = ({ texts, authors, buttonText = 'Download All Metadata' }) => {
    const downloadAllTextsAsCSV = () => {
      if (!texts.length || !authors) return;
  
      // Add the BOM to handle UTF-8
      const BOM = '\uFEFF';
  
      // Create CSV header
      const headers = [
        'text_id', 'title_tl', 'title_ar', 'author', 'author_ar', 'author_date',
        ...Object.keys(texts[0]).filter(key => key !== 'meta' && key !== 'au_id_id' && !['text_id', 'title_tl', 'title_ar'].includes(key))
      ];
  
      // Create CSV content
      const csvContent = texts.map(text => {
        const author = authors[text.au_id_id] || {};
        return [
          text.text_id,
          text.title_tl,
          text.title_ar,
          author.au_tl || '',
          author.au_ar || '',
          author.date || '',
          ...headers.slice(6).map(key => text[key] || '')
        ].map(value => `"${String(value).replace(/"/g, '""')}"`)
         .join(',');
      });
  
      // Combine BOM, headers, and CSV content
      const fullContent = BOM + [headers.join(','), ...csvContent].join('\n');
  
      // Create Blob with UTF-8 encoding
      const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });
      
      // Create download link
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'nusus_metadata.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
  
    return (
      <button className="text-button" onClick={downloadAllTextsAsCSV}>
        {buttonText}
      </button>
    );
  };
export default CSVDownloader;