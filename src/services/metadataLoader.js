import Papa from 'papaparse';

export const loadTexts = async () => {
  const response = await fetch('/meta/texts.csv');
  const csv = await response.text();
  const { data, meta } = Papa.parse(csv, { header: true });
  if (meta && meta.aborted) {
    throw new Error('CSV parsing aborted.');
  }
  const filteredData = data.filter(row => (
    Object.values(row).some(value => value !== undefined && value.trim() !== '')
  ));
  return filteredData;
};

export const loadAuthors = async () => {
  const response = await fetch('/meta/authors.csv');
  const csv = await response.text();
  const { data, meta } = Papa.parse(csv, { header: true });
  if (meta && meta.aborted) {
    throw new Error('CSV parsing aborted.');
  }
  const filteredData = data.filter(row => (
    Object.values(row).some(value => value !== undefined && value.trim() !== '')
  ));
  return filteredData;
};

export const getAuthorById = async (authorId) => {
  const authors = await loadAuthors();
  return authors.find(author => author.au_id === authorId);
};

export const getTextsByAuthorId = async (authorId) => {
  const texts = await loadTexts();
  return texts.filter(text => text.au_id_id === authorId);
};
