import React from 'react';
import { useLanguage } from '../App.jsx';

const MyBets = ({ playerBets }) => {
  const { t } = useLanguage();

  const sortedNumbers = Array.from(playerBets.numbers).sort((a, b) => a - b);
  const sortedAnimals = Array.from(playerBets.animals).sort();

  const hasBets = sortedNumbers.length > 0 || sortedAnimals.length > 0;

  if (!hasBets) {
    return null;
  }

  return (
    <div className="card my-bets-card">
      <h3>{t("my_bets.title")}</h3>
      
      {sortedNumbers.length > 0 && (
        <div className="bet-category">
          <h4>{t("my_bets.numbers")}</h4>
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
          <h4>{t("my_bets.animals")}</h4>
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