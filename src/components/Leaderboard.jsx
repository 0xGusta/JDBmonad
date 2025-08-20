import React, { useState, useEffect, useCallback } from 'react';
import { Contract, WebSocketProvider } from "ethers";
import { monadTestnet } from '../monadChain.js';
import { LEADERBOARD_ADDRESS, LEADERBOARD_ABI } from '../contractInfo.js';

const JDB_GAME_ADDRESS_FOR_LEADERBOARD = "0x8cDdbc30cc9E4fe404EecD254056d9736f9Dc168";

const Leaderboard = ({ provider, gameContract, leaderboardContract, yourAddress }) => {
    const [leaderboardData, setLeaderboardData] = useState([]);
    const [loading, setLoading] = useState(true);

    const formatAddress = (address) => `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;

    const fetchLeaderboard = useCallback(async (isUpdate = false) => {
        if (!provider || !gameContract || !leaderboardContract) return;

        if (!isUpdate) {
            setLoading(true);
        }

        try {
            const playerAddresses = await gameContract.getAllTimePlayers();
            if (playerAddresses.length === 0) {
                setLeaderboardData([]);
                return;
            }
            
            const playerDataPromises = playerAddresses.map(async (address) => {
                try {
                    const [playerData, usernameRes] = await Promise.all([
                        leaderboardContract.playerDataPerGame(JDB_GAME_ADDRESS_FOR_LEADERBOARD, address),
                        fetch(`https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${address}`)
                    ]);

                    const usernameData = await usernameRes.json();
                    const username = usernameData.hasUsername ? usernameData.user.username : formatAddress(address);
                    
                    return {
                        address,
                        username,
                        transactions: Number(playerData.transactions)
                    };
                } catch (e) {
                    return { address, username: formatAddress(address), transactions: 0 };
                }
            });

            const unsortedPlayers = await Promise.all(playerDataPromises);
            
            const sortedPlayers = unsortedPlayers
                .filter(p => p.transactions > 0)
                .sort((a, b) => b.transactions - a.transactions);
            
            setLeaderboardData(sortedPlayers.slice(0, 10));

        } catch (error) {
            console.error("Erro ao montar o leaderboard:", error);
        } finally {

            setLoading(false);
        }
    }, [provider, gameContract, leaderboardContract]);

    useEffect(() => {
        if (leaderboardContract && gameContract) {
            fetchLeaderboard();
        }
    }, [leaderboardContract, gameContract, fetchLeaderboard]);

    useEffect(() => {
        if (!leaderboardContract) return;

        const wsProvider = new WebSocketProvider(monadTestnet.rpcUrls.default.webSocket[0]);
        const eventContract = new Contract(LEADERBOARD_ADDRESS, LEADERBOARD_ABI, wsProvider);
        
        const filter = eventContract.filters.PlayerDataUpdated(JDB_GAME_ADDRESS_FOR_LEADERBOARD);
        
        const handleUpdate = () => { 
            console.log("Evento PlayerDataUpdated recebido, atualizando leaderboard...");
            setTimeout(() => fetchLeaderboard(true), 1000); 
        };

        eventContract.on(filter, handleUpdate);

        return () => { 
            eventContract.off(filter, handleUpdate); 
            wsProvider.destroy().catch(err => console.error("Erro ao fechar WebSocket:", err));
        };
    }, [leaderboardContract]);

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
