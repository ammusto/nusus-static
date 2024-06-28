import React, { useState, useEffect } from 'react';
import { loadTexts, loadAuthors } from '../../services/metadataLoader';
import { useLocation, useNavigate } from 'react-router-dom';
import { performSearch } from '../../services/searchService';
import FilterDropdown from '../MetadataBrowser/FilterDropdown';
import Results from './Results';
import ReactSlider from 'react-slider';
import './DateRangeSlider.css';
import './Search.css';

const ITEMS_PER_PAGE = 20;

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [texts, setTexts] = useState([]);
  const [authors, setAuthors] = useState({});
  const [genres, setGenres] = useState([]);
  const [allTexts, setAllTexts] = useState([]);
  const [filteredTexts, setFilteredTexts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [query, setQuery] = useState('');
  const [selectedTexts, setSelectedTexts] = useState([]);
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasSearched, setHasSearched] = useState(false);
  const [authorOptions, setAuthorOptions] = useState([]);
  const [genreOptions, setGenreOptions] = useState([]);
  const [dateRange, setDateRange] = useState([0, 0]);
  const [minDate, setMinDate] = useState(0);
  const [maxDate, setMaxDate] = useState(0);

  const resetSearch = () => {
    setQuery('');
    setSearchQuery('');
    setSelectedTexts([]);
    setSelectedAuthors([]);
    setSelectedGenres([]);
    setSearchResults([]);
    setCurrentPage(1);
    setHasSearched(false);
    sessionStorage.removeItem('searchPageState');
    navigate('/search', { replace: true });
  };

  useEffect(() => {
    const savedState = sessionStorage.getItem('searchPageState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        setQuery(parsedState.query || '');
        setSearchQuery(parsedState.searchQuery || '');
        setSelectedAuthors(Array.isArray(parsedState.selectedAuthors) ? parsedState.selectedAuthors : []);
        setSelectedGenres(Array.isArray(parsedState.selectedGenres) ? parsedState.selectedGenres : []);
        setSelectedTexts(Array.isArray(parsedState.selectedTexts) ? parsedState.selectedTexts : []);
        setSearchResults(Array.isArray(parsedState.searchResults) ? parsedState.searchResults : []);
        setCurrentPage(parsedState.currentPage || 1);
        setHasSearched(!!parsedState.hasSearched);
      } catch (error) {
        console.error("Error parsing saved state:", error);
      }
    } else {
      resetSearch();
    }
  }, []);

  useEffect(() => {
    if (hasSearched) {
      const stateToSave = {
        query,
        searchQuery,
        selectedAuthors,
        selectedGenres,
        selectedTexts,
        searchResults,
        currentPage,
        hasSearched
      };
      sessionStorage.setItem('searchPageState', JSON.stringify(stateToSave));
    }
  }, [query, searchQuery, selectedAuthors, selectedGenres, selectedTexts, searchResults, currentPage, hasSearched]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const textsData = await loadTexts() || [];
        const authorsData = await loadAuthors() || [];
        const dates = authorsData
          .map(author => author.date)
          .filter(date => date !== "-" && !isNaN(parseInt(date)))
          .map(date => parseInt(date));
        const minDate = Math.min(...dates);
        const maxDate = Math.max(...dates);
        setMinDate(minDate);
        setMaxDate(maxDate);
        setDateRange([minDate, maxDate]);
        setTexts(textsData);
        setAllTexts(textsData);
        setFilteredTexts(textsData);
        setAuthors(authorsData.reduce((acc, author) => {
          if (author && author.au_id) {
            acc[author.au_id] = author;
          }
          return acc;
        }, {}));
        setAuthorOptions(authorsData.filter(author => author && author.au_id && author.sh_ar && author.au_ar).map(author => ({ value: author.au_id, label: author.sh_ar })));
        setGenreOptions([...new Set(textsData.filter(text => text && text.genre_id).map(text => text.genre_id))].map(genre => ({ value: genre, label: genre })));
        setGenres([...new Set(textsData.filter(text => text && text.genre_id).map(text => text.genre_id))]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const results = await performSearch(query, selectedTexts, selectedAuthors, selectedGenres);
      setSearchResults(Array.isArray(results) ? results : []);
      setSearchQuery(query);
    } catch (error) {
      console.error("Error performing search:", error);
      setSearchResults([]);
    } finally {
      setCurrentPage(1);
      setHasSearched(true);
      setIsLoading(false);
      navigate(`/search?q=${encodeURIComponent(query)}`, { replace: true });
    }
  };

  useEffect(() => {
    const filtered = allTexts.filter(text => {
      const author = authors[text.au_id_id];
      const authorDate = author ? parseInt(author.date) : null;
      return (
        (selectedAuthors.length === 0 || selectedAuthors.includes(text.au_id_id)) &&
        (selectedGenres.length === 0 || selectedGenres.includes(text.genre_id)) &&
        (authorDate === null || isNaN(authorDate) || (authorDate >= dateRange[0] && authorDate <= dateRange[1]))
      );
    });
    setFilteredTexts(filtered);
  }, [selectedAuthors, selectedGenres, dateRange, allTexts, authors]);

  const handleTextToggle = (textId) => {
    setSelectedTexts(prev =>
      prev.includes(textId) ? prev.filter(id => id !== textId) : [...prev, textId]
    );
  };

  const pageCount = Math.max(1, Math.ceil((searchResults || []).length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentResults = (searchResults || []).slice(startIndex, endIndex);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pageCount) {
      setCurrentPage(newPage);
      navigate(`/search?q=${encodeURIComponent(query)}&page=${newPage}`, { replace: true });
    }
  };

  const handleDateRangeChange = (newRange) => {
    setDateRange(newRange);
  };

  if (isLoading) {
    return <div className='container'>
      <div className='main center'>
        <p>Loading...</p>
      </div></div>;
  }

  return (
    <div className='container'>
      <div className='main'>
        <div className='search-form search-page-container flex'>
          <form onSubmit={handleSearch}>
            <div className='filter-top'>
              <input
                className='search-form-input'
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder=""
              />
            </div>
            <div className="filter-middle flex">

              <div className='filter-left'>

                <div className='filter-container flex'>
                  {authorOptions.length > 0 && (
                    <FilterDropdown
                      label="Authors"
                      options={authorOptions}
                      selectedOptions={selectedAuthors}
                      onChange={setSelectedAuthors}
                    />
                  )}
                  {genreOptions.length > 0 && (
                    <FilterDropdown
                      label="Genres"
                      options={genreOptions}
                      selectedOptions={selectedGenres}
                      onChange={setSelectedGenres}
                    />
                  )}
                  <div className="date-slider-container">
                    <ReactSlider
                      className="horizontal-slider"
                      thumbClassName="thumb"
                      trackClassName="track"
                      defaultValue={[minDate, maxDate]}
                      ariaLabel={['Lower thumb', 'Upper thumb']}
                      ariaValuetext={state => `Thumb value ${state.valueNow}`}
                      renderThumb={(props, state) => <div {...props}>{state.valueNow}</div>}
                      pearling
                      minDistance={10}
                      min={minDate}
                      max={maxDate}
                      onChange={handleDateRangeChange}
                    />
<label>Death Date</label>
                  </div>
                </div>
              </div>
              <div className="filter-right">
                <div className="text-filter-list">
                  {filteredTexts.map(text => (
                    <label key={text.text_id}>
                      <input
                        type="checkbox"
                        checked={selectedTexts.includes(text.text_id)}
                        onChange={() => handleTextToggle(text.text_id)}
                      />
                      {text.title_ar} - {authors[text.au_id_id]?.sh_ar} ({authors[text.au_id_id]?.date})
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className='flex search-button-container'>
              <button type="submit" className='search-button'>Search</button>
              <button type="button" className='search-button' onClick={resetSearch}>Reset Search</button>
            </div>
          </form>
        </div>
        {
          hasSearched && (
            <Results
              hasSearched={hasSearched}
              query={searchQuery}
              texts={texts}
              searchResults={searchResults}
              currentResults={currentResults}
              pageCount={pageCount}
              startIndex={startIndex}
              endIndex={endIndex}
              currentPage={currentPage}
              handlePageChange={handlePageChange}
            />
          )
        }
      </div >
    </div >
  );
};

export default SearchPage;