import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAuthorById, getTextsByAuthorId } from '../../services/metadataLoader';

const AuthorPage = () => {
  const { authorId } = useParams();
  const [author, setAuthor] = useState(null);
  const [texts, setTexts] = useState([]);

  useEffect(() => {
    const fetchAuthorAndTexts = async () => {
      const authorData = await getAuthorById(authorId);
      setAuthor(authorData);
      const textsData = await getTextsByAuthorId(authorId);
      setTexts(textsData);
    };
    fetchAuthorAndTexts();
  }, [authorId]);

  const labelMap = [
    { key: 'bio', label: 'Biography' },
    { key: 'cit', label: 'Citation' }
  ];

  if (!author) return <div>Loading...</div>;

  return (
    <div className="container">
      <div className='main'>
        <div className='text-content'>
          <h2>
            <ul>
              <li>{author.au_tl} (d. {author.date})</li>
              <li>{author.au_ar}</li>
            </ul>
          </h2>
          <table className='individual-meta'>
            <tbody>
              <tr>
                <td>
                  Texts in Corpus
                </td>
                <td>
                  <ul>
                    {texts.map(text => (
                      <li key={text.text_id}>
                        <Link to={`/text/${text.text_id}`}>{text.title_tl}</Link>
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
              {labelMap.map(({ key, label }) => (
                author[key] && (
                  <tr key={key}>
                    <td>{label}</td>
                    <td>
                      {key === 'bio' ? (
                        <div dangerouslySetInnerHTML={{ __html: author[key] }} />
                      ) : (
                        author[key]
                      )}
                    </td>
                  </tr>
                )
              ))}

            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
};

export default AuthorPage;
