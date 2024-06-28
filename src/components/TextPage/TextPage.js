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

  if (!text) return

  <div className="container">
    <div className='main'>
      <div className='text-content'>
        <div>Loading...</div>
      </div>
    </div>
  </div>;

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
                  Download
                </td>
                <td>
                <TEIDownloader textId={text.text_id} titleTl={text.title_tl} linkText='TEI Encoded'/>
                </td>
              </tr>
              <tr>
                <td>
                  Browse Text
                </td>
                <td>
                <Link to={`/reader/${text.text_id}`}>nuṣūṣ Reader</Link>
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
