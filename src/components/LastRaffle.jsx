import React from 'react';
import { formatEther } from "ethers";

const LastRaffle = ({ lastRaffle }) => {
    if (!lastRaffle) {
        return (
            <div className="card last-raffle-card">
                <h2>Last Raffle</h2>
                <p>No raffles have occurred yet.</p>
            </div>
        );
    }

    return (
        <div className="card last-raffle-card">
            <h2>Last Raffle (#{lastRaffle.id.toString()})</h2>
            <div className="raffle-details">
                <div className="detail-item">
                    <span>Number </span>
                    <strong className="winning-number">{lastRaffle.winningNumber.toString().padStart(2, '0')}</strong>
                </div>
                <div className="detail-item">
                    <span>Animal </span>
                    <strong>{lastRaffle.winningAnimal}</strong>
                </div>
                <div className="detail-item">
                    <span>Total Prize </span>
                    <strong>
                    {new Intl.NumberFormat("en-US", { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: 2 
                    }).format(formatEther(lastRaffle.totalPot))} MON
                    </strong>
                </div>
                <div className="detail-item">
                    <span>{new Date(Number(lastRaffle.timestamp) * 1000).toLocaleString('en-US')}</span>
                </div>
            </div>
        </div>
    );
};

export default LastRaffle;
