import React from 'react';

const downloadTEI = (textId, titleTl, linkText, img) => {
    const fileName = `nuṣūṣ${textId}_${titleTl}.xml`;
    const fileUrl = `/texts/tei/${textId}.xml`;

    fetch(fileUrl)
        .then(response => response.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(() => alert('Error downloading the file'));
};

const TEIDownloader = ({ textId, titleTl, linkText, img }) => {
    return (
        <button
            href="#"
            onClick={(e) => {
                e.preventDefault();
                downloadTEI(textId, titleTl, linkText, img);
            }}
            className={img ? 'text-button img-download-link' : 'text-button'}
        >
            {linkText}
        </button>
    );
};

export default TEIDownloader;
