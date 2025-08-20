import React from 'react';
import { formatEther } from "ethers";

const LastDraw = ({ lastDraw }) => {
    if (!lastDraw) {
        return (
            <div className="card last-draw-card">
                <h2>Último Sorteio</h2>
                <p>Ainda não houve sorteios.</p>
            </div>
        );
    }

    return (
        <div className="card last-draw-card">
            <h2>Último Sorteio (#{lastDraw.id.toString()})</h2>
            <div className="draw-details">
                <div className="detail-item">
                    <span>Número </span>
                    <strong className="winning-number">{lastDraw.winningNumber.toString().padStart(2, '0')}</strong>
                </div>
                <div className="detail-item">
                    <span>Animal </span>
                    <strong>{lastDraw.winningAnimal}</strong>
                </div>
                <div className="detail-item">
                    <span>Prêmio Total </span>
                    <strong>{formatEther(lastDraw.totalPot)} MON</strong>
                </div>
                <div className="detail-item">
                    <span>{new Date(Number(lastDraw.timestamp) * 1000).toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
};

export default LastDraw;