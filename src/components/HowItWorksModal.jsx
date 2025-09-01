import React from 'react';
import App, { LanguageContext, useLanguage } from '../App.jsx';


const HowItWorksModal = ({ isOpen, onClose }) => {
    const language = useLanguage();
    const { t } = useLanguage();


    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content how-it-works-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{t("modal.how_it_works.title")}</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="modal-body">
                    <p dangerouslySetInnerHTML={{ __html: t("modal.how_it_works.p1") }} />

                    <div className="step">
                        <h3>{t("modal.how_it_works.step1.title")}</h3>
                        <p dangerouslySetInnerHTML={{ __html: t("modal.how_it_works.step1.p1") }} />
                    </div>

                    <div className="step">
                        <h3>{t("modal.how_it_works.step2.title")}</h3>
                        <p dangerouslySetInnerHTML={{ __html: t("modal.how_it_works.step2.p1") }} />
                        <ul>
                            <li>{t("modal.how_it_works.step2.li1")}</li>
                            <li>{t("modal.how_it_works.step2.li2")}</li>
                            <li>{t("modal.how_it_works.step2.li3")}</li>
                        </ul>
                        <div className="logo-container">
                            <img src="/images/pyth.svg" alt="Pyth Network Logo" />
                        </div>
                    </div>

                    <div className="step">
                        <h3>{t("modal.how_it_works.step3.title")}</h3>
                        <p dangerouslySetInnerHTML={{ __html: t("modal.how_it_works.step3.p1") }} />
                        <div className="code-block-explanation">
                            <span>{t("modal.how_it_works.step3.code")}</span>
                        </div>
                        <p dangerouslySetInnerHTML={{ __html: t("modal.how_it_works.step3.p2") }} />
                    </div>

                    <div className="step">
                        <h3>{t("modal.how_it_works.step4.title")}</h3>
                        <p dangerouslySetInnerHTML={{ __html: t("modal.how_it_works.step4.p1") }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HowItWorksModal;