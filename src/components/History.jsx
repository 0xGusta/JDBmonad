import React, { useEffect, useState } from 'react';
import { formatEther } from "ethers";

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
    const res = await fetch(`https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${wallet}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.hasUsername ? data.user.username : null;
  } catch (err) {
    console.error("Error fetching username:", err);
    return null;
  }
}

const History = ({ history }) => {
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
    return <p>No raffles in history yet.</p>;
  }

  const sortedHistory = [...history].sort((a, b) => Number(b.id) - Number(a.id));

  return (
    <div className="history-list">
      {sortedHistory.map((raffle) => {
        const pythBigInt = BigInt(raffle.pythRandomNumber);
        const winningNumberCalc = pythBigInt % 96n;

        return (
          <div key={raffle.id.toString()} className="history-item">
            <h4>
              Raffle #{raffle.id.toString()} -{" "}
              {new Date(Number(raffle.timestamp) * 1000).toLocaleString('en-US')}
            </h4>
            <p>
              <strong>Winning Number:</strong> {raffle.winningNumber.toString().padStart(2, '0')} |{" "}
              <strong>Animal:</strong> {raffle.winningAnimal} |{" "}
              <strong>Total Prize:</strong>{" "}
              {new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(Number(formatEther(raffle.totalPot)))}{" "}
              MON
            </p>

            <div className="winners-section">
                <div className="histdiv">
                  <strong>Winners (Number):</strong>
                  <ul>
                    {raffle.numberWinners.length > 0 ? (
                      raffle.numberWinners.map((winner, index) => (
                        <li key={`num-${index}`}>
                          {usernames[winner.player] || formatAddress(winner.player)} - won{" "}
                          {new Intl.NumberFormat("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(Number(formatEther(winner.amountWon)))}{" "}
                          MON
                        </li>
                      ))
                    ) : (
                      <li>No one guessed the number.</li>
                    )}
                  </ul>
                </div>
    
                <div className="histdiv">
                  <strong>Winners (Animal):</strong>
                  <ul>
                    {raffle.animalWinners.length > 0 ? (
                      raffle.animalWinners.map((winner, index) => (
                        <li key={`animal-${index}`}>
                          {usernames[winner.player] || formatAddress(winner.player)} - won{" "}
                          {new Intl.NumberFormat("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(Number(formatEther(winner.amountWon)))}{" "}
                          MON
                        </li>
                      ))
                    ) : (
                      <li>No one guessed the animal.</li>
                    )}
                  </ul>
                </div>
            </div>
            
            <Accordion title="Verify Raffle Calculation">
                <div className="debug-steps">
                    <p>The winning number is derived from the Pyth random number using the modulo operation (`%`).</p>
                    <ol>
                        <li>
                            <strong>Pyth Number (Hex):</strong>
                            <span className="code-block">{raffle.pythRandomNumber.toString()}</span>
                        </li>
                        <li>
                            <strong>Converted to Decimal:</strong>
                            <span className="code-block">{pythBigInt.toString()}</span>
                        </li>
                        <li>
                            <strong>Calculation (Decimal % 96):</strong>
                            <span className="code-block">{pythBigInt.toString()} % 96 = {winningNumberCalc.toString()}</span>
                        </li>
                        <li>
                            <strong>Final Result:</strong>
                            <span className="code-block final-result">{winningNumberCalc.toString().padStart(2, '0')}</span>
                        </li>
                    </ol>
                </div>
            </Accordion>

            <Accordion title="View All Bets from the Raffle">
                <div className="all-bets-container">
                    <div className="bet-category">
                        <h4>Numbers Bet On:</h4>
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
                        ) : <p>No numbers were bet on.</p>}
                    </div>
                    <div className="bet-category">
                        <h4>Animals Bet On:</h4>
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
                        ) : <p>No animals were bet on.</p>}
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