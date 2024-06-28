import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { loadTexts, getAuthorById } from '../../services/metadataLoader';
import TEIDownloader from '../../utils/TEIDownloader'
import { Link } from 'react-router-dom';

const TextPage = () => {
  const { textId } = useParams();
  const [text, setText] = useState(null);
  const [author, setAuthor] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const texts = await loadTexts();
      const foundText = texts.find(t => t.text_id === textId);
      setText(foundText);
      if (foundText) {
        const authorData = await getAuthorById(foundText.au_id_id);
        setAuthor(authorData);
      }
    };
    fetchData();
  }, [textId]);

  const labelMap = [
    { key: 'genre_id', label: 'Genre' },
    { key: 'style', label: 'Format' },
    { key: 'word_len', label: 'Tokens' },
    { key: 'perm', label: 'Permalink' },
    { key: 'pdf', label: 'PDF' },
    { key: 'pg_rng', label: 'Page Range' },
    { key: 'source', label: 'Source' },
    { key: 'permbib', label: 'Base Edition' },
    { key: 'contrib', label: 'Contributor' }
  ];

  const downloadTextAsCSV = () => {
    if (!text || !author) return;

    const BOM = '\uFEFF';

    const entries = Object.entries(text)
      .filter(([key]) => key !== "meta" && key !== "au_id_id" && key !== "style");

    const authorInfo = [
      ['author', author.au_tl],
      ['author_ar', author.au_ar],
      ['author_date', author.date]
    ];

    const combinedEntries = [
      ...entries.slice(0, 3),
      ...authorInfo,
      ...entries.slice(3)
    ];

    const csvContent = combinedEntries
      .map(([key, value]) => {
        const escapedValue = `"${String(value).replace(/"/g, '""')}"`;
        return `${key},${escapedValue}`;
      })
      .join('\n');

    const fullContent = BOM + csvContent;

    const blob = new Blob([fullContent], { type: 'text/csv;charset=utf-8;' });

    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `nusus${text.text_id}_${text.title_tl}_metadata.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!text) return (
    <div className="container">
      <div className='main'>
        <div className='text-content'>
          <div>Loading...</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container">
      <div className='main'>
        <div className='text-content'>
          <h2>
            <ul>
              <li>{text.title_tl}</li>
              <li>{text.title_ar}</li>
            </ul>
          </h2>
          <table className='individual-meta'>
            <tbody>
              <tr>
                <td>Author</td>
                <td>
                  <ul>
                    <li></li>
                    <li><Link to={`/author/${text.au_id_id}`}>{author ? author.au_tl : ''}</Link></li>
                    <li><Link to={`/author/${text.au_id_id}`}>{author ? author.au_ar : ''}</Link></li>
                  </ul>
                </td>
              </tr>
              {labelMap.map(({ key, label }) => (
                text[key] && (
                  <tr key={key}>
                    <td>{label}</td>
                    <td>
                      {key === 'perm' && text[key] !== '' ? (
                        <a href={text[key]}>Worldcat</a>
                      ) : key === 'pdf' && text[key] !== '' ? (
                        <a href={text[key]}>Available</a>
                      ) : key === 'permbib' ? (
                        <div dangerouslySetInnerHTML={{ __html: text[key] }} />
                      ) : (
                        text[key]
                      )}
                    </td>
                  </tr>
                )
              ))}
              <tr>
                <td>
                  Browse Text
                </td>
                <td>
                  <Link to={`/reader/${text.text_id}`}>nuṣūṣ Reader</Link>
                </td>
              </tr>
              <tr>
                <td>
                  Download Text
                </td>
                <td>
                  <TEIDownloader textId={text.text_id} titleTl={text.title_tl} linkText='TEI Encoded' />
                </td>
              </tr>
              <tr>
                <td>
                  Metadata
                </td>
                <td>
                  <button className="text-button" onClick={downloadTextAsCSV}>Download as CSV</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TextPage;