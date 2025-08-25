import React, { useState, useEffect, useCallback } from 'react';
import { Contract, WebSocketProvider } from "ethers";
import { monadTestnet } from '../monadChain.js';
import { LEADERBOARD_ADDRESS, LEADERBOARD_ABI } from '../contractInfo.js';

const JDB_GAME_ID = 58;

const Leaderboard = ({ leaderboardContract, yourAddress }) => {
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchLeaderboard = useCallback(async (isUpdate = false) => {
        if (!isUpdate) {
            setLoading(true);
        }

        try {
            const response = await fetch(`https://monad-games-id-site.vercel.app/api/leaderboard?page=1&gameId=${JDB_GAME_ID}&sortBy=transactions`);
            if (!response.ok) {
                throw new Error('Falha ao buscar dados do leaderboard');
            }
            const apiResult = await response.json();
            
            const formattedData = apiResult.data.map(player => ({
                address: player.walletAddress,
                username: player.username,
                transactions: player.transactionCount
            }));
            
            setLeaderboardData(formattedData);

        } catch (error) {
            console.error("Erro ao montar o leaderboard via API:", error);
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
        const JDB_GAME_ADDRESS_FOR_LEADERBOARD = "0x8cDdbc30cc9E4fe404EecD254056d9736f9Dc168";
        const filter = eventContract.filters.PlayerDataUpdated(JDB_GAME_ADDRESS_FOR_LEADERBOARD);
        
        const handleUpdate = () => { 
            console.log("Evento PlayerDataUpdated recebido, atualizando leaderboard via API...");
            setTimeout(() => fetchLeaderboard(true), 1500); 
        };

        eventContract.on(filter, handleUpdate);

        return () => { 
            eventContract.off(filter, handleUpdate); 
            wsProvider.destroy().catch(err => console.error("Erro ao fechar WebSocket:", err));
        };
    }, [leaderboardContract, fetchLeaderboard]);

    return (
        <div className="card leaderboard-card">
            <h3>Leaderboard - Top 10 Apostadores</h3>
            {loading ? (
                <p>Carregando leaderboard...</p>
            ) : leaderboardData.length > 0 ? (
                <table className="leaderboard-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Jogador</th>
                            <th>Apostas</th>
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
                <p>Ainda não há apostas para exibir no ranking.</p>
            )}
        </div>
    );
};

export default Leaderboard;
