import React from 'react';

const monadLogoUrl = '/images/monad.svg';
const pythLogoUrl = '/images/pyth.svg';
const xLogoUrl = 'https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/x-social-media-white-icon.svg';
const XLink= 'https://x.com/futurotwitter:P';
const metadataImageUrl = '/metadata.jpg';

const Footer = () => {
    return (
        <footer className="footer-container">
            <div className="footer-background-image">
                <img src={metadataImageUrl} alt="Metadata Background" />
            </div>
            <div className="footer-content">
                <div className="powered-by-section">
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
                </div>
                <div className="social-link">
                    <a href={XLink} target="_blank" rel="noopener noreferrer" style={{ display: 'none' }}>
                        <img src={xLogoUrl} alt="X Logo" />
                    </a>
                    <a href="https://entropy-explorer.pyth.network/?chain=monad-testnet&search=0x84efFC21412947c12B4fa37016cD5d535b5c9CB0" target="_blank" rel="noopener noreferrer">
                        <img src="/images/pyth-network.svg" alt="Pyth Network Entropy Explorer" />
                    </a>
                    <a href="https://github.com/0xGusta/JDBmonad" target="_blank" rel="noopener noreferrer">
                        <img src="/images/github-mark-white.svg" alt="GitHub Logo" />
                    </a>
                    <a href="https://testnet.monadexplorer.com/address/0x84efFC21412947c12B4fa37016cD5d535b5c9CB0?tab=Contract" target="_blank" rel="noopener noreferrer">
                        <img src="/images/monvision.svg" alt="Monvision Logo" />
                    </a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
