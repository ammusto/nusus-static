import { loadTexts, loadAuthors } from './metadataLoader';

let topTermsCache = null;
let ngramIndicesCache = {
  bigram: null,
  trigram: null,
  fourgram: null
};

const loadMasterIndex = async () => {
  try {
    const masterIndexResponse = await fetch('/indices/master_index.txt');

    if (!masterIndexResponse.ok) {
      throw new Error('Network response was not ok');
    }

    const masterIndexText = await masterIndexResponse.text();

    if (!masterIndexText) {
      throw new Error('Failed to load master index');
    }

    const masterIndex = masterIndexText.split('\n').reduce((acc, line) => {
      if (line.trim() === '') return acc;
      const [index, range] = line.split('#');
      if (!range) {
        console.warn(`Invalid line in master index: ${line}`);
        return acc;
      }
      const [first, last] = range.split(',').map(part => part.trim());
      acc[index] = { first, last };
      return acc;
    }, {});

    return { masterIndex };
  } catch (error) {
    console.error('Error in loadMasterIndex:', error);
    return { masterIndex: {} };
  }
};

const loadTokenIndex = async (indexNumber) => {
  const response = await fetch(`/indices/token_index${indexNumber}.json`);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return await response.json();
};

const findIndexNumber = (token, masterIndex) => {
  for (const [index, range] of Object.entries(masterIndex)) {
    if (token >= range.first && token <= range.last) {
      return index;
    }
  }
  return null;
};

const searchToken = async (token, masterIndex) => {
  const indexNumber = findIndexNumber(token, masterIndex);
  if (!indexNumber) return [];

  const tokenIndex = await loadTokenIndex(indexNumber);
  return tokenIndex[token] || [];
};

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const searchWildcard = async (pattern, masterIndex) => {
  const regexPattern = '^' + pattern.split('').map(char => {
    if (char === '*') return '.*';
    if (char === '?' || char === '؟') return '.';
    return escapeRegExp(char);
  }).join('') + '$';
  const regex = new RegExp(regexPattern);
  let results = [];

  for (const [index, range] of Object.entries(masterIndex)) {
    const tokenIndex = await loadTokenIndex(index);
    for (const [token, pages] of Object.entries(tokenIndex)) {
      if (regex.test(token)) {
        results = results.concat(pages);
      }
    }
  }

  return results;
};

const loadTopTerms = async () => {
  if (topTermsCache) return topTermsCache;
  const response = await fetch('/ngrams/top_terms.txt');
  const content = await response.text();
  topTermsCache = new Set(content.split('\n').map(term => term.trim()));
  return topTermsCache;
};

const loadNGramIndex = async (type) => {
  if (ngramIndicesCache[type]) return ngramIndicesCache[type];
  try {
    const response = await fetch(`/ngrams/${type}_index.txt`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const content = await response.text();
    if (!content) {
      throw new Error('Empty content received');
    }

    ngramIndicesCache[type] = content.split('\n').reduce((acc, line) => {
      if (!line.trim()) return acc; 
      const parts = line.split('#');
      if (parts.length !== 2) {
        console.warn(`Invalid line in ${type}_index.txt`)
        return acc;
      }
      const [file, range] = parts;
      const [start, end] = range.split(',');
      if (!start || !end) {
        console.warn(`Invalid range in ${type}_index.txt:`, range);
        return acc;
      }
      acc[file] = { start: start.trim(), end: end.trim() };
      return acc;
    }, {});

    return ngramIndicesCache[type];
  } catch (error) {
    console.error(`Error loading ${type}_index.txt:`, error);
    return {};
  }
};

const searchNGram = async (ngram, type) => {
  try {
    const index = await loadNGramIndex(type);
    if (Object.keys(index).length === 0) {
      console.warn(`No index loaded for ${type}`);
      return [];
    }

    const ngramRegex = new RegExp('^' + ngram.split(/\s+/).map(token => 
      token.split('').map(char => {
        if (char === '*') return '.*';
        if (char === '?' || char === '؟') return '.';
        return escapeRegExp(char);
      }).join('')
    ).join('\\s+') + '$');

    let results = [];
    for (const [file, range] of Object.entries(index)) {
      const response = await fetch(`/ngrams/${type}/${file}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const content = await response.text();
      const lines = content.split('\n');
      
      for (const line of lines) {
        const [candidateNgram, locations] = line.split('~');
        if (ngramRegex.test(candidateNgram)) {
          results = results.concat(locations.split(','));
        }
      }
    }

    return results;
  } catch (error) {
    console.error(`Error in searchNGram for ${ngram} (${type}):`, error);
    return [];
  }
};

const searchPhrase = async (phrase, masterIndex) => {
  const tokens = phrase.split(/\s+/);
  const topTerms = await loadTopTerms();

  if (tokens[0].startsWith('*') || tokens[0].startsWith('?') || tokens[0].startsWith('؟')) {
    console.error("Initial wildcards are not allowed in phrase searching");
    return [];
  }

  const hasTopTerm = tokens.some(token => {
    const baseToken = token.split(/[*?؟]/)[0];
    return topTerms.has(baseToken);
  });

  const hasWildcard = tokens.some(token =>
    token.includes('*') || token.includes('?') || token.includes('؟')
  );

  if (hasTopTerm && tokens.length <= 4) {
    const ngramType = ['', '', 'bigram', 'trigram', 'fourgram'][tokens.length];
    try {
      return await searchNGram(phrase, ngramType);
    } catch (error) {
      console.error('Error in n-gram search, falling back to token-by-token search:', error);
    }
  }

  const tokenResults = await Promise.all(tokens.map(token =>
    token.includes('*') || token.includes('?') || token.includes('؟')
      ? searchWildcard(token, masterIndex)
      : searchToken(token, masterIndex)
  ));

  const commonPages = tokenResults.reduce((acc, result, index) => {
    if (index === 0) return result;
    return acc.filter(page =>
      result.some(r => r.split('#')[0] === page.split('#')[0] && r.split('#')[1] === page.split('#')[1])
    );
  }, []);

  return commonPages.filter(page => {
    const [textId, pageId, firstPosition] = page.split('#');
    let currentPosition = parseInt(firstPosition);

    return tokens.every((token, index) => {
      const matchingResults = tokenResults[index].filter(r => {
        const [rTextId, rPageId, rPosition] = r.split('#');
        return rTextId === textId && rPageId === pageId && parseInt(rPosition) >= currentPosition;
      });

      for (const match of matchingResults) {
        const [, , matchPosition] = match.split('#');
        const positionDiff = parseInt(matchPosition) - currentPosition;

        if (token.includes('*') || token.includes('?') || token.includes('؟')) {
          if (positionDiff === 0) {
            currentPosition = parseInt(matchPosition) + 1;
            return true;
          }
        } else if (positionDiff === 0) {
          currentPosition++;
          return true;
        }
      }

      return false;
    });
  });
};

export const performSearch = async (query, selectedTexts = [], selectedAuthors = [], selectedGenres = [], selectedStyles = []) => {
  try {
    const { masterIndex } = await loadMasterIndex();
    const texts = await loadTexts();
    const authors = await loadAuthors();

    if (!Array.isArray(texts) || !Array.isArray(authors)) {
      console.error('Texts or authors data is not an array');
      return [];
    }

    let searchResults = [];
    if (query.includes(' ')) {
      searchResults = await searchPhrase(query, masterIndex) || [];
    } else if (query.includes('*') || query.includes('?') || query.includes('؟')) {
      searchResults = await searchWildcard(query, masterIndex) || [];
    } else {
      searchResults = await searchToken(query, masterIndex) || [];
    }

    const safeSelectedTexts = Array.isArray(selectedTexts) ? selectedTexts : [];
    const safeSelectedAuthors = Array.isArray(selectedAuthors) ? selectedAuthors : [];
    const safeSelectedGenres = Array.isArray(selectedGenres) ? selectedGenres : [];
    const safeSelectedStyles = Array.isArray(selectedStyles) ? selectedStyles : [];

    const filteredResults = searchResults.filter(result => {
      if (!result) return false;
      const [textId] = result.split('#');
      if (!textId) return false;

      const text = texts.find(t => t && t.text_id === textId);
      if (!text) {
        console.log(`No text metadata found for text ID: ${textId}`);
        return false;
      }

      const author = authors.find(a => a && a.au_id === text.au_id_id);
      if (!author) {
        console.log(`No author found for author ID: ${text.au_id_id}`);
        return false;
      }

      const isTextSelected = safeSelectedTexts.length === 0 || safeSelectedTexts.includes(textId);
      const isAuthorSelected = safeSelectedAuthors.length === 0 || safeSelectedAuthors.includes(author.au_tl);
      const isGenreSelected = safeSelectedGenres.length === 0 || safeSelectedGenres.includes(text.genre_id);
      const isStyleSelected = safeSelectedStyles.length === 0 || safeSelectedStyles.includes(text.style);

      return isTextSelected && isAuthorSelected && isGenreSelected && isStyleSelected;
    });

    const sortedResults = filteredResults.sort((a, b) => {
      if (!a || !b) return 0;
      const [textIdA, pageIdA] = a.split('#');
      const [textIdB, pageIdB] = b.split('#');
      if (textIdA !== textIdB) {
        return parseInt(textIdA) - parseInt(textIdB) || 0;
      }
      return parseInt(pageIdA) - parseInt(pageIdB) || 0;
    });

    return sortedResults;
  } catch (error) {
    console.error('Error in performSearch:', error);
    return [];
  }
};