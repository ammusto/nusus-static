import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => {
  return (
    <div className="container">
      <div className='main'>
        <div className='text-content'>
          <h2>A Corpus of Digitally Neglected Texts</h2>
          <p>Nuṣūṣ is a corpus of digitized Arabic texts designed to fill gaps in extant digital corpora. Originally a collection of early Sufi and Sufi-adjacent texts, nuṣūṣ has since expanded to include early works on <em>kalām</em>, <em>falsafa</em>, and Christian theology. Through this website, users can: browse text metadata, including author biographies; read these works online; and, most importantly, search the contents of texts in the corpus. Soon, the digitized versions of these texts will be made available to download for individuals to use for computational textual analysis or other interests.</p>
          <p>If you are interested in learning more or potentially contributing to this project, please <a href="mailto:nususcorpus@gmail.com"> contact us</a>!</p>

        </div>
        <div className="text-content">
          <h2>Corpus Details</h2>
          <p>We initially envisoned nuṣūṣ as a database for early Sufi texts not included in other digitized corpora, but the project has since expanded to include <em>falsafa</em>, <em>kalām</em>, and Christian theological works.</p>
          <p>To digitize these texts, we use <a href="https://www.escriptorium.uk/">eScriptorium,</a> a digital palaeography framework, which uses the <a href="https://kraken.re/master/index.html">kraken</a> OCR engine. For our project we use a kraken OCR model developped by the <a href="https://openiti.org/">OpenITI team</a>.</p>
          <p>Although the goal of nuṣūṣ is to digitize and make available new texts, we have decided to include some works that have already been digitized and are extant in other corpora. Our reasoning for this to consolidate Sufi, <em>falsafa</em>, <em>kalām</em>, and Christian theological texts in one corpus and to increase the utility of our database and its search functionality. Texts imported from other corpora are marked as such in nuṣūṣ.</p>
          <p>We have an internal list of new texts, but if you have any suggestions or recommendations for texts to be included, please <a href="mailto:nususcorpus@gmail.com"> contact us</a>.
          </p>

        </div>
        <div>
          <h2>Corpus Stats</h2>
          <ul className='corpus-stats'>
            <li><strong>Texts </strong>91</li>
            <li><strong>Authors </strong>34</li>
            <li><strong>Tokens </strong>1083050</li>
            <li><strong>Pages </strong>4707</li>
          </ul>
        </div>
      </div>
    </div>


  );
};

export default HomePage;