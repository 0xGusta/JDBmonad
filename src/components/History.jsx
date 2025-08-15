import React from 'react';
import { formatEther } from "ethers";

const formatAddress = (address) => `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;

const History = ({ history }) => {
    if (!history || history.length === 0) {
        return <p>Ainda não há sorteios no histórico.</p>;
    }

    return (
        <div className="history-list">
            {history.map((draw) => (
                <div key={draw.id.toString()} className="history-item">
                    <h4>Sorteio #{draw.id.toString()} - {new Date(Number(draw.timestamp) * 1000).toLocaleString()}</h4>
                    <p>
                        <strong>Número Sorteado:</strong> {draw.winningNumber.toString().padStart(2, '0')} | 
                        <strong> Animal:</strong> {draw.winningAnimal} | 
                        <strong> Prêmio Total:</strong> {formatEther(draw.totalPot)} MON
                    </p>
                    <div className="winners-section">
                        <div className='histdiv'>
                            <strong>Ganhadores (Número):</strong>
                            <ul>
                                {draw.numberWinners.length > 0 ? draw.numberWinners.map((winner, index) => (
                                    <li key={`num-${index}`}>
                                        {formatAddress(winner.player)} - ganhou {formatEther(winner.amountWon)} MON
                                    </li>
                                )) : <li>Ninguém acertou o número. Acumulou...</li>}
                            </ul>
                        </div>
                        <div className='histdiv'>
                            <strong>Ganhadores (Animal):</strong>
                            <ul>
                                {draw.animalWinners.length > 0 ? draw.animalWinners.map((winner, index) => (
                                    <li key={`animal-${index}`}>
                                        {formatAddress(winner.player)} - ganhou {formatEther(winner.amountWon)} MON
                                    </li>
                                )) : <li>Ninguém acertou o animal. Acumulou...</li>}
                            </ul>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default History;