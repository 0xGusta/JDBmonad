import React, { useEffect, useState } from 'react';
import { formatEther } from "ethers";
import { useLanguage } from '../App.jsx';

const Accordion = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="accordion">
            <button className="accordion-header" onClick={() => setIsOpen(!isOpen)}>
                <span>{title}</span>
                <span>{isOpen ? '−' : '+'}</span>
            </button>
            {isOpen && <div className="accordion-content">{children}</div>}
        </div>
    );
};

const formatAddress = (address) => `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;

async function fetchUsername(wallet) {
  try {
    const res = await fetch(`https://www.monadclip.fun/api/check-wallet?wallet=${wallet}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.hasUsername ? data.user.username : null;
  } catch (err) {
    console.error("Error fetching username:", err);
    return null;
  }
}

const History = ({ history }) => {
  const { t, language } = useLanguage();
  const [usernames, setUsernames] = useState({});

  useEffect(() => {
    if (!history) return;
    
    const allAddresses = new Set();
    history.forEach(raffle => {
        raffle.numberWinners.forEach(winner => allAddresses.add(winner.player));
        raffle.animalWinners.forEach(winner => allAddresses.add(winner.player));
        raffle.numberBets.forEach(bet => bet.players.forEach(player => allAddresses.add(player)));
        raffle.animalBets.forEach(bet => bet.players.forEach(player => allAddresses.add(player)));
    });

    allAddresses.forEach(address => {
      if (!usernames[address]) {
        fetchUsername(address).then(name => {
          setUsernames(prev => ({
            ...prev,
            [address]: name || formatAddress(address)
          }));
        });
      }
    });
  }, [history]);

  if (!history || history.length === 0) {
    return <p>{t("history.no_raffles")}</p>;
  }

  const sortedHistory = [...history].sort((a, b) => Number(b.id) - Number(a.id));

  return (
    <div className="history-list">
      {sortedHistory.map((raffle) => {
        const pythBigInt = BigInt(raffle.pythRandomNumber);
        const winningNumberCalc = pythBigInt % 96n;

        const dateOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        };

        const formattedDate = new Intl.DateTimeFormat(language, dateOptions)
                                .format(new Date(Number(raffle.timestamp) * 1000));

        return (
          <div key={raffle.id.toString()} className="history-item">
            <h4>
              #{raffle.id.toString() } - {formattedDate}
            </h4>
            <p>
              <strong>{t("history.winning_number")}</strong> {raffle.winningNumber.toString().padStart(2, '0')} |{" "}
              <strong>{t("history.winning_animal")}</strong> {raffle.winningAnimal} |{" "}
              <strong>{t("history.total_prize")}</strong>{" "}
              {new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(Number(formatEther(raffle.totalPot)))} MON
            </p>

            <div className="winners-section">
                <div className="histdiv">
                  <strong>{t("history.winners_number")}</strong>
                  <ul>
                    {raffle.numberWinners.length > 0 ? (
                      raffle.numberWinners.map((winner, index) => (
                        <li key={`num-${index}`}>
                          {usernames[winner.player] || formatAddress(winner.player)} - {t("history.won")}{" "}
                          {new Intl.NumberFormat("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(Number(formatEther(winner.amountWon)))} MON
                        </li>
                      ))
                    ) : (
                      <li>{t("history.no_number_winner")}</li>
                    )}
                  </ul>
                </div>
    
                <div className="histdiv">
                  <strong>{t("history.winners_animal")}</strong>
                  <ul>
                    {raffle.animalWinners.length > 0 ? (
                      raffle.animalWinners.map((winner, index) => (
                        <li key={`animal-${index}`}>
                          {usernames[winner.player] || formatAddress(winner.player)} - {t("history.won")}{" "}
                          {new Intl.NumberFormat("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(Number(formatEther(winner.amountWon)))} MON
                        </li>
                      ))
                    ) : (
                      <li>{t("history.no_animal_winner")}</li>
                    )}
                  </ul>
                </div>
            </div>
            
            <Accordion title={t("history.verify_calculation")}>
                <div className="debug-steps">
                    <p>{t("history.verify_calculation.p1")}</p>
                    <ol>
                        <li>
                            <strong>{t("history.verify_calculation.step1")}</strong>
                            <span className="code-block">{raffle.pythRandomNumber.toString()}</span>
                        </li>
                        <li>
                            <strong>{t("history.verify_calculation.step2")}</strong>
                            <span className="code-block">{pythBigInt.toString()}</span>
                        </li>
                        <li>
                            <strong>{t("history.verify_calculation.step3")}</strong>
                            <span className="code-block">{pythBigInt.toString()} % 96 = {winningNumberCalc.toString()}</span>
                        </li>
                        <li>
                            <strong>{t("history.verify_calculation.step4")}</strong>
                            <span className="code-block final-result">{winningNumberCalc.toString().padStart(2, '0')}</span>
                        </li>
                    </ol>
                </div>
            </Accordion>

            <Accordion title={t("history.view_all_bets")}>
                <div className="all-bets-container">
                    <div className="bet-category">
                        <h4>{t("history.numbers_bet_on")}</h4>
                        {raffle.numberBets.length > 0 ? (
                            <ul className="all-bets-list">
                                {raffle.numberBets.map((bet, index) => (
                                    <li key={`nb-${index}`}>
                                        <span className="bet-item number">{String(Number(bet.number)).padStart(2, '0')}</span>
                                        <span className="bet-players">
                                            {bet.players.map(p => usernames[p] || formatAddress(p)).join(', ')}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : <p>{t("history.no_number_bets")}</p>}
                    </div>
                    <div className="bet-category">
                        <h4>{t("history.animals_bet_on")}</h4>
                         {raffle.animalBets.length > 0 ? (
                            <ul className="all-bets-list">
                                {raffle.animalBets.map((bet, index) => (
                                    <li key={`ab-${index}`}>
                                        <span className="bet-item animal">{bet.animal}</span>
                                        <span className="bet-players">
                                            {bet.players.map(p => usernames[p] || formatAddress(p)).join(', ')}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : <p>{t("history.no_animal_bets")}</p>}
                    </div>
                </div>
            </Accordion>
          </div>
        )
      })}
    </div>
  );
};

export default History;
