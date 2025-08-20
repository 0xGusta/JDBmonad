import React, { useState, useEffect } from 'react';

const BetNotification = ({ betEvent, onDismiss }) => {
  const [visible, setVisible] = useState(false);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    let timer;

    const fetchUsername = async (walletAddress) => {
      try {
        const res = await fetch(`https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${walletAddress}`);
        const data = await res.json();

        if (data.hasUsername && data.user?.username) {
          setUsername(data.user.username);
        } else {
          setUsername(null);
        }
      } catch (error) {
        console.error("Erro ao buscar username:", error);
        setUsername(null);
      }
    };

    if (betEvent) {
      fetchUsername(betEvent.player);
      setVisible(true);

      timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onDismiss, 500);
      }, 10000);
    }

    return () => clearTimeout(timer);
  }, [betEvent, onDismiss]);

  if (!betEvent) return null;

  const { player, totalBets } = betEvent;
  const displayName = username || `${player.substring(0, 6)}...${player.substring(player.length - 4)}`;
  const message = `${displayName} acabou de fazer ${totalBets} aposta${totalBets > 1 ? 's' : ''}!`;

  return (
    <div className={`bet-notification-banner ${visible ? 'visible' : ''}`}>
      <span>{message}</span>
    </div>
  );
};

export default BetNotification;