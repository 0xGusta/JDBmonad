import React from 'react';

const monadLogoUrl = '/images/monad.svg';
const pythLogoUrl = '/images/pyth.svg';
const xLogoUrl = 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/x-social-media-white-icon.svg';
const yourProjectXLink = 'https://x.com/futurotwitter:P';

const Footer = () => {
    return (
        <footer className="footer-container">
            <div className="powered-by">
                <span>Powered by</span>
                <div className="logos">
                    <a href="https://www.monad.xyz/" target="_blank" rel="noopener noreferrer">
                        <img src={monadLogoUrl} alt="Monad Logo" className="logo monad-logo" />
                    </a> & 
                    <a href="https://pyth.network/" target="_blank" rel="noopener noreferrer">
                        <img src={pythLogoUrl} alt="Pyth Network Logo" className="logo pyth-logo" />
                    </a>
                </div>
            </div>
            <div className="social-link">
                <a href={yourProjectXLink} target="_blank" rel="noopener noreferrer">
                    <img src={xLogoUrl} alt="X Logo" />
                </a>
            </div>
        </footer>
    );
};

export default Footer;
