import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { loadTexts, loadAuthors } from '../../services/metadataLoader';
import FilterDropdown from './FilterDropdown';
import TEIDownloader  from '../../utils/TEIDownloader'
import './Metadata.css';

const MetadataBrowser = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [texts, setTexts] = useState([]);
  const [authors, setAuthors] = useState({});
  const [sortColumn, setSortColumn] = useState('text_id');
  const [sortDirection, setSortDirection] = useState('asc');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [authorOptions, setAuthorOptions] = useState([]);
  const [genreOptions, setGenreOptions] = useState([]);
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);


  useEffect(() => {
    const fetchData = async () => {
      const textsData = await loadTexts();
      const authorsData = await loadAuthors();
      setTexts(textsData);
      setAuthors(authorsData.reduce((acc, author) => {
        acc[author.au_id] = author;
        return acc;
      }, {}));

      setAuthorOptions([...new Set(authorsData.map(author => author.au_tl))]);
      setGenreOptions([...new Set(textsData.map(text => text.genre_id))]);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const readURLParams = () => {
      const params = new URLSearchParams(location.search);
      return {
        searchTerm: params.get('search') || '',
        sortColumn: params.get('sort') || 'text_id',
        sortDirection: params.get('direction') || 'asc',
        itemsPerPage: Number(params.get('itemsPerPage')) || 10,
        currentPage: Number(params.get('page')) || 1,
      };
    };
  
    const urlParams = readURLParams();
    setSearchTerm(urlParams.searchTerm);
    setSortColumn(urlParams.sortColumn);
    setSortDirection(urlParams.sortDirection);
    setItemsPerPage(urlParams.itemsPerPage);
    setCurrentPage(urlParams.currentPage);
  
    const savedState = sessionStorage.getItem('metadataBrowserState');
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      setSelectedAuthors(parsedState.selectedAuthors || []);
      setSelectedGenres(parsedState.selectedGenres || []);
    }
  }, [location.search]);

  useEffect(() => {
    const stateToSave = {
      searchTerm,
      selectedAuthors,
      selectedGenres,
      sortColumn,
      sortDirection,
      itemsPerPage,
      currentPage
    };
    sessionStorage.setItem('metadataBrowserState', JSON.stringify(stateToSave));
  }, [searchTerm, selectedAuthors, selectedGenres, sortColumn, sortDirection, itemsPerPage, currentPage]);

  const filteredTexts = texts.filter(text =>
    (selectedAuthors.length === 0 || selectedAuthors.includes(authors[text.au_id_id]?.au_tl)) &&
    (selectedGenres.length === 0 || selectedGenres.includes(text.genre_id)) &&
    (searchTerm === '' ||
      text.genre_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      text.title_tl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      text.title_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      authors[text.au_id_id]?.au_tl.toLowerCase().includes(searchTerm.toLowerCase()) ||
      authors[text.au_id_id]?.au_sh.toLowerCase().includes(searchTerm.toLowerCase()) ||
      authors[text.au_id_id]?.sh_ar.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const sortedTexts = [...filteredTexts].sort((a, b) => {
    if (sortColumn === 'date') {
      const dateA = authors[a.au_id_id]?.date || '';
      const dateB = authors[b.au_id_id]?.date || '';
      if (dateA < dateB) return sortDirection === 'asc' ? -1 : 1;
      if (dateA > dateB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    } if (sortColumn === 'text_id') {
      const idA = parseInt(a[sortColumn]);
      const idB = parseInt(b[sortColumn]);
      return sortDirection === 'asc' ? idA - idB : idB - idA;
    } else {
      if (a[sortColumn] < b[sortColumn]) return sortDirection === 'asc' ? -1 : 1;
      if (a[sortColumn] > b[sortColumn]) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    }
  });

  const handleSort = (column) => {
    const newDirection = column === sortColumn && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortColumn(column);
    setSortDirection(newDirection);
    updateURL({ sort: column, direction: newDirection });
  };

  const handleSearchChange = (event) => {
    const newSearchTerm = event.target.value;
    setSearchTerm(newSearchTerm);
    setCurrentPage(1);
    updateURL({ search: newSearchTerm, page: 1 });
  };

  const handleResetFilters = () => {
    setSelectedAuthors([]);
    setSelectedGenres([]);
    updateURL({});
  };

  const handleItemsPerPageChange = (event) => {
    const newItemsPerPage = Number(event.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    updateURL({ itemsPerPage: newItemsPerPage, page: 1 });
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    updateURL({ page: newPage });
  };

  const updateURL = (params) => {
    const searchParams = new URLSearchParams(location.search);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.set(key, value);
      } else {
        searchParams.delete(key);
      }
    });
    navigate(`/metadata?${searchParams.toString()}`, { replace: true });
  };


  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedTexts.slice(indexOfFirstItem, indexOfLastItem);

  const renderPagination = () => {
    const pageCount = Math.ceil(sortedTexts.length / itemsPerPage);
    if (pageCount <= 1) return null;

    const maxVisibleButtons = 3;
    let startPage, endPage;

    if (pageCount <= maxVisibleButtons) {
      startPage = 1;
      endPage = pageCount;
    } else {
      if (currentPage <= Math.floor(maxVisibleButtons / 2) + 1) {
        startPage = 1;
        endPage = maxVisibleButtons;
      } else if (currentPage + Math.floor(maxVisibleButtons / 2) >= pageCount) {
        startPage = pageCount - maxVisibleButtons + 1;
        endPage = pageCount;
      } else {
        startPage = currentPage - Math.floor(maxVisibleButtons / 2);
        endPage = currentPage + Math.floor(maxVisibleButtons / 2);
      }
    }

    const pageButtons = [];
    for (let i = startPage; i <= endPage; i++) {
      pageButtons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          disabled={i === currentPage}
        >
          {i}
        </button>
      );
    }

    return (
      <div className='pagination flex'>
        <div className='pagination-left'>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
        </div>
        <div className='pagination-center'>
          {startPage > 1 && (
            <>
              <button onClick={() => handlePageChange(1)}>1</button>
              <span>...</span>
            </>
          )}
          {pageButtons}
          {endPage < pageCount && (
            <>
              <span>...</span>
              <button onClick={() => handlePageChange(pageCount)}>{pageCount}</button>
            </>
          )}
        </div>
        <div className='pagination-right'>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pageCount}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className='main'>
      <div className='search-form'>
        <input
          type="text"
          placeholder=""
          value={searchTerm}
          onChange={handleSearchChange}
          className='search-form-input'
        />
      </div>
      <div className='filter-container flex'>
        <FilterDropdown
          label="Authors"
          options={authorOptions}
          selectedOptions={selectedAuthors}
          onChange={setSelectedAuthors}
        />
        <FilterDropdown
          label="Genres"
          options={genreOptions}
          selectedOptions={selectedGenres}
          onChange={setSelectedGenres}
        />
      </div>

      <div className='meta-show-items'>
      <button className="text-button" onClick={() => handleResetFilters()}>Reset Filters</button>-

        Show
        <select value={itemsPerPage} onChange={handleItemsPerPageChange}>
          <option value={10}>10</option>
          <option value={15}>15</option>
          <option value={25}>25</option>
        </select>
        items per page
      </div>
      <table className='metadata-table'>
        <thead>
          <tr>
            <th onClick={() => handleSort('title_tl')}>Title⇅</th>
            <th onClick={() => handleSort('au_id_id')}>Author⇅</th>
            <th onClick={() => handleSort('date')}>Death⇅</th>
            <th onClick={() => handleSort('genre_id')}>Genre⇅</th>
            <th onClick={() => handleSort('source')}>Source⇅</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((text) => (
            <tr key={text.text_id}>
              <td>
                <ul>
                  <li><Link to={`/text/${text.text_id}`}>{text.title_tl}</Link></li>
                  <li><Link to={`/text/${text.text_id}`}>{text.title_ar}</Link></li>
                </ul>
              </td>
              <td>
                <ul className="author-full">
                  <li><Link to={`/author/${text.au_id_id}`}>{authors[text.au_id_id]?.au_tl}</Link></li>
                  <li><Link to={`/author/${text.au_id_id}`}>{authors[text.au_id_id]?.au_ar}</Link></li>
                </ul>
                <ul className="author-short">
                  <li><Link to={`/author/${text.au_id_id}`}>{authors[text.au_id_id]?.au_sh}</Link></li>
                  <li><Link to={`/author/${text.au_id_id}`}>{authors[text.au_id_id]?.sh_ar}</Link></li>
                </ul>
              </td>
              <td>{authors[text.au_id_id]?.date}</td>
              <td>
                <ul>
                  <li>{text.genre_id}</li>
                  <li>{text.style}</li>
                </ul>
              </td>
              <td>{text.source}</td>
              <td>
                <TEIDownloader textId={text.text_id} titleTl={text.title_tl} linkText='💾' img='True' />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {renderPagination()}
    </div>
  );
};

export default MetadataBrowser;