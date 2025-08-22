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
    console.error("Erro ao buscar username:", err);
    return null;
  }
}

const History = ({ history }) => {
  const [usernames, setUsernames] = useState({});

  useEffect(() => {
    if (!history) return;
    
    const allAddresses = new Set();
    history.forEach(draw => {
        draw.numberWinners.forEach(winner => allAddresses.add(winner.player));
        draw.animalWinners.forEach(winner => allAddresses.add(winner.player));
        draw.numberBets.forEach(bet => bet.players.forEach(player => allAddresses.add(player)));
        draw.animalBets.forEach(bet => bet.players.forEach(player => allAddresses.add(player)));
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
    return <p>Ainda não há sorteios no histórico.</p>;
  }

  const sortedHistory = [...history].sort((a, b) => Number(b.id) - Number(a.id));

  return (
    <div className="history-list">
      {sortedHistory.map((draw) => {
        const pythBigInt = BigInt(draw.pythRandomNumber);
        const winningNumberCalc = pythBigInt % 96n;

        return (
          <div key={draw.id.toString()} className="history-item">
            <h4>
              Sorteio #{draw.id.toString()} -{" "}
              {new Date(Number(draw.timestamp) * 1000).toLocaleString('pt-BR')}
            </h4>
            <p>
              <strong>Número Sorteado:</strong> {draw.winningNumber.toString().padStart(2, '0')} |{" "}
              <strong>Animal:</strong> {draw.winningAnimal} |{" "}
              <strong>Prêmio Total:</strong>{" "}
              {new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(Number(formatEther(draw.totalPot)))}{" "}
              MON
            </p>

            <div className="winners-section">
                <div className="histdiv">
                  <strong>Ganhadores (Número):</strong>
                  <ul>
                    {draw.numberWinners.length > 0 ? (
                      draw.numberWinners.map((winner, index) => (
                        <li key={`num-${index}`}>
                          {usernames[winner.player] || formatAddress(winner.player)} - ganhou{" "}
                          {new Intl.NumberFormat("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(Number(formatEther(winner.amountWon)))}{" "}
                          MON
                        </li>
                      ))
                    ) : (
                      <li>Ninguém acertou o número.</li>
                    )}
                  </ul>
                </div>
    
                <div className="histdiv">
                  <strong>Ganhadores (Animal):</strong>
                  <ul>
                    {draw.animalWinners.length > 0 ? (
                      draw.animalWinners.map((winner, index) => (
                        <li key={`animal-${index}`}>
                          {usernames[winner.player] || formatAddress(winner.player)} - ganhou{" "}
                          {new Intl.NumberFormat("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(Number(formatEther(winner.amountWon)))}{" "}
                          MON
                        </li>
                      ))
                    ) : (
                      <li>Ninguém acertou o animal.</li>
                    )}
                  </ul>
                </div>
            </div>
            
            <Accordion title="Verificar Cálculo do Sorteio">
                <div className="debug-steps">
                    <p>O número sorteado é derivado do número aleatório da Pyth usando a operação de módulo (`%`).</p>
                    <ol>
                        <li>
                            <strong>Número da Pyth (Hex):</strong>
                            <span className="code-block">{draw.pythRandomNumber.toString()}</span>
                        </li>
                        <li>
                            <strong>Convertido para Decimal:</strong>
                            <span className="code-block">{pythBigInt.toString()}</span>
                        </li>
                        <li>
                            <strong>Cálculo (Decimal % 96):</strong>
                            <span className="code-block">{pythBigInt.toString()} % 96 = {winningNumberCalc.toString()}</span>
                        </li>
                        <li>
                            <strong>Resultado Final:</strong>
                            <span className="code-block final-result">{winningNumberCalc.toString().padStart(2, '0')}</span>
                        </li>
                    </ol>
                </div>
            </Accordion>

            <Accordion title="Ver Todas as Apostas da Rodada">
                <div className="all-bets-container">
                    <div className="bet-category">
                        <h4>Números Apostados:</h4>
                        {draw.numberBets.length > 0 ? (
                            <ul className="all-bets-list">
                                {draw.numberBets.map((bet, index) => (
                                    <li key={`nb-${index}`}>
                                        <span className="bet-item number">{String(Number(bet.number)).padStart(2, '0')}</span>
                                        <span className="bet-players">
                                            {bet.players.map(p => usernames[p] || formatAddress(p)).join(', ')}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : <p>Nenhum número foi apostado.</p>}
                    </div>
                    <div className="bet-category">
                        <h4>Animais Apostados:</h4>
                         {draw.animalBets.length > 0 ? (
                            <ul className="all-bets-list">
                                {draw.animalBets.map((bet, index) => (
                                    <li key={`ab-${index}`}>
                                        <span className="bet-item animal">{bet.animal}</span>
                                        <span className="bet-players">
                                            {bet.players.map(p => usernames[p] || formatAddress(p)).join(', ')}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : <p>Nenhum animal foi apostado.</p>}
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