import React from 'react';
import { formatEther } from "ethers";

const LastDraw = ({ lastDraw }) => {
    if (!lastDraw) {
        return (
            <div className="card last-draw-card">
                <h2>Last draw</h2>
                <p>No draws have taken place yet.</p>
            </div>
        );
    }

    return (
        <div className="card last-draw-card">
            <h2>Last draw (#{lastDraw.id.toString()})</h2>
            <div className="draw-details">
                <div className="detail-item">
                    <span>Number </span>
                    <strong className="winning-number">{lastDraw.winningNumber.toString().padStart(2, '0')}</strong>
                </div>
                <div className="detail-item">
                    <span>Monanimal </span>
                    <strong>{lastDraw.winningAnimal}</strong>
                </div>
                <div className="detail-item">
                    <span>Total Prize </span>
                    <strong>
                    {new Intl.NumberFormat("en-US", { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                    }).format(formatEther(lastDraw.totalPot))} MON
                    </strong>
                </div>
                <div className="detail-item">
                    <span>{new Date(Number(lastDraw.timestamp) * 1000).toLocaleString('en-US')}</span> {/* para a data em formato ingles é 'en-US' */}
                </div>
            </div>
        </div>
    );
};

export default LastDraw;