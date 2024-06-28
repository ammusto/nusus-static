import React from 'react';
import ResultPreview from './ResultPreview';
import { Link } from 'react-router-dom';

const Results = ({
    texts,
    searchResults,
    currentResults,
    pageCount,
    startIndex,
    endIndex,
    currentPage,
    handlePageChange,
    query,
    hasSearched
}) => {

    const renderResults = () => {
        if (searchResults.length === 0 && hasSearched) {
            return <div className='text-content center'><p>No results found.</p></div>;
        }

        return (
            <>
                <p>Showing results {startIndex + 1} - {Math.min(endIndex, searchResults.length)} of {searchResults.length}</p>
                <table className='results-table'>
                    <thead>
                        <tr>
                            <th>Page</th>
                            <th>Preview</th>
                            <th>Text</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentResults.map((result, index) => renderResultRow(result, index))}
                    </tbody>
                </table>
                {renderPagination()}
            </>
        );
    };

    const renderResultRow = (result, index) => {
        const [textId, pageId, position, pageNum] = result.split('#');
        const text = texts.find(t => t.text_id === textId);

        return (
            <tr key={index}>
                <td>{pageNum}</td>
                <td>
                    <ResultPreview
                        query={query}
                        pageId={pageId}
                        textId={textId}
                        pageNum={pageNum}
                        position={parseInt(position)}
                        currentPage={currentPage}
                    />
                </td>
                <td>{text ? <Link className='preview-link' to={`/text/${textId}/`}>{text.title_ar}</Link> : `Result: ${result}`}</td>
            </tr>
        );
    };

    const renderPagination = () => {
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
            <div className="pagination flex">
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
        <div>
            {renderResults()}
        </div>
    );
};

export default Results;