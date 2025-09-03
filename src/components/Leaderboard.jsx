import React, { useState, useEffect, useCallback } from 'react';
import { Contract, WebSocketProvider } from "ethers";
import { monadTestnet } from '../monadChain.js';
import { LEADERBOARD_ADDRESS, LEADERBOARD_ABI } from '../contractInfo.js';
import { useLanguage } from '../App.jsx';

const JDB_GAME_ID = 249;
const JDB_GAME_ADDRESS_FOR_LEADERBOARD = "0x8cDdbc30cc9E4fe404EecD254056d9736f9Dc168";

const Leaderboard = ({ leaderboardContract, yourAddress }) => {
  const { t } = useLanguage();
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch(`/api/leaderboard?page=${currentPage}&gameId=${JDB_GAME_ID}&sortBy=transactions`);
      if (!response.ok) throw new Error(`Failed to fetch leaderboard data: ${response.statusText}`);
      
      const apiResult = await response.json();
      const formattedData = apiResult.data.map(player => ({
        address: player.walletAddress,
        username: player.username || player.walletAddress,
        transactions: player.transactionCount
      }));
      
      setLeaderboardData(formattedData);
      setTotalPages(apiResult.pagination.totalPages);

    } catch (error) {
      console.error("Error building leaderboard via API:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  useEffect(() => {
    if (!leaderboardContract) return;

    const wsProvider = new WebSocketProvider(monadTestnet.rpcUrls.default.webSocket[0]);
    const eventContract = new Contract(LEADERBOARD_ADDRESS, LEADERBOARD_ABI, wsProvider);

    const filter = eventContract.filters.PlayerDataUpdated(JDB_GAME_ADDRESS_FOR_LEADERBOARD);
    
    const handleUpdate = () => { 
      console.log("PlayerDataUpdated event received, updating leaderboard via API...");
      setTimeout(() => fetchLeaderboard(), 2000);
    };

    eventContract.on(filter, handleUpdate);

    return () => {
      eventContract.off(filter, handleUpdate);
      wsProvider.destroy().catch(err => console.error("Error closing WebSocket:", err));
    };
  }, [leaderboardContract, fetchLeaderboard]);
  
  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  return (
    <div className="card leaderboard-card">
      <h3>{t("leaderboard.title")}</h3>
      {loading ? (
        <p>{t("leaderboard.loading")}</p>
      ) : leaderboardData.length > 0 ? (
        <>
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t("leaderboard.player")}</th>
                <th>{t("leaderboard.bets")}</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((player, index) => {
                const rank = (currentPage - 1) * 10 + index + 1;
                return (
                  <tr 
                    key={player.address} 
                    className={player.address.toLowerCase() === yourAddress?.toLowerCase() ? 'your-rank' : ''}
                  >
                    <td>{rank}</td>
                    <td>{player.username}</td>
                    <td>{player.transactions}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="leaderboard-pagination">
            <button onClick={handlePrevPage} disabled={currentPage === 1}>
              &larr;
            </button>
            <span>
               {currentPage} / {totalPages}
            </span>
            <button onClick={handleNextPage} disabled={currentPage === totalPages}>
              &rarr;
            </button>
          </div>
        </>
      ) : (
        <p>{t("leaderboard.no_bets")}</p>
      )}
    </div>
  );
};

export default Leaderboard;
