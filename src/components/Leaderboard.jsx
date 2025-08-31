import React, { useState, useEffect, useCallback } from 'react';
import { Contract, WebSocketProvider } from "ethers";
import { monadTestnet } from '../monadChain.js';
import { LEADERBOARD_ADDRESS, LEADERBOARD_ABI } from '../contractInfo.js';

const JDB_GAME_ID = 249;
const JDB_GAME_ADDRESS_FOR_LEADERBOARD = "0x8cDdbc30cc9E4fe404EecD254056d9736f9Dc168";

const Leaderboard = ({ leaderboardContract, yourAddress }) => {
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = useCallback(async (isUpdate = false) => {
        if (!isUpdate) {
            setLoading(true);
        }

        try {
            const response = await fetch(`/api/leaderboard?page=1&gameId=${JDB_GAME_ID}&sortBy=transactions`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch leaderboard data: ${response.statusText}`);
            }
            const apiResult = await response.json();
            
            const formattedData = apiResult.data.map(player => ({
                address: player.walletAddress,
                username: player.username,
                transactions: player.transactionCount
            }));
            
            setLeaderboardData(formattedData);

        } catch (error) {
            console.error("Error building leaderboard via API:", error);
        } finally {
            setLoading(false);
        }
    }, []);

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
            setTimeout(() => fetchLeaderboard(true), 2000); 
        };

        eventContract.on(filter, handleUpdate);

        return () => { 
            eventContract.off(filter, handleUpdate); 
            wsProvider.destroy().catch(err => console.error("Error closing WebSocket:", err));
        };
    }, [leaderboardContract, fetchLeaderboard]);

    return (
        <div className="card leaderboard-card">
            <h3>Leaderboard - Top 10 Bettors</h3>
            {loading ? (
                <p>Loading leaderboard...</p>
            ) : leaderboardData.length > 0 ? (
                <table className="leaderboard-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Player</th>
                            <th>Bets</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboardData.map((player, index) => (
                            <tr key={player.address} className={player.address.toLowerCase() === yourAddress?.toLowerCase() ? 'your-rank' : ''}>
                                <td>{index + 1}</td>
                                <td>{player.username}</td>
                                <td>{player.transactions}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No bets yet to display in the ranking.</p>
            )}
        </div>
    );
};

export default Leaderboard;
