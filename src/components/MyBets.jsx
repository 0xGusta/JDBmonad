import React from 'react';

const MyBets = ({ playerBets }) => {

    const sortedNumbers = Array.from(playerBets.numbers).sort((a, b) => a - b);
    const sortedAnimals = Array.from(playerBets.animals).sort();

    const hasBets = sortedNumbers.length > 0 || sortedAnimals.length > 0;

    if (!hasBets) {
        return null;
    }

    return (
        <div className="card my-bets-card">
            <h3>My Bets This Round</h3>
            
            {sortedNumbers.length > 0 && (
                <div className="bet-category">
                    <h4>Numbers:</h4>
                    <ul className="bets-list">
                        {sortedNumbers.map(num => (
                            <li key={num} className="bet-item number">
                                {String(num).padStart(2, '0')}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {sortedAnimals.length > 0 && (
                <div className="bet-category">
                    <h4>Animals:</h4>
                    <ul className="bets-list">
                        {sortedAnimals.map(animal => (
                            <li key={animal} className="bet-item animal">
                                {animal}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default MyBets;