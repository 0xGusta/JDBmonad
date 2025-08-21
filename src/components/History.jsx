import React, { useEffect, useState } from 'react';
import { formatEther } from "ethers";

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
    const allWinners = history.flatMap(draw => [...draw.numberWinners, ...draw.animalWinners]);

    allWinners.forEach(winner => {
      const wallet = winner.player;
      if (!usernames[wallet]) {
        fetchUsername(wallet).then(name => {
          setUsernames(prev => ({
            ...prev,
            [wallet]: name || formatAddress(wallet)
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
      {sortedHistory.map((draw) => (
        <div key={draw.id.toString()} className="history-item">
          <h4>
            Sorteio #{draw.id.toString()} -{" "}
            {new Date(Number(draw.timestamp) * 1000).toLocaleString('pt-BR')} {/* para a data em formato ingles é 'en-US' */}
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
                  <li>Ninguém acertou o número. Acumulou...</li>
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
                  <li>Ninguém acertou o animal. Acumulou...</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default History;
