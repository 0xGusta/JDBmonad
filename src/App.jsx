import { useState, useEffect, useCallback, useRef } from 'react';
import { usePrivy, useCrossAppAccounts } from "@privy-io/react-auth";
import { BrowserProvider, Contract, formatEther, WebSocketProvider, JsonRpcProvider, parseEther } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI, LEADERBOARD_ADDRESS, LEADERBOARD_ABI } from './contractInfo';
import { monadTestnet } from './monadChain.js';
import './App.css';

import AdminModal from './components/AdminModal.jsx';
import BettingGrid from './components/BettingGrid.jsx';
import History from './components/History.jsx';
import UserProfileModal from './components/UserProfileModal.jsx';
import Leaderboard from './components/Leaderboard.jsx';
import Notification from './components/Notification.jsx';
import LastDraw from './components/LastDraw.jsx';
import BetNotification from './components/BetNotification.jsx';
import Footer from './components/Footer.jsx';
import HowItWorksModal from './components/HowItWorksModal.jsx';
import MyBets from './components/MyBets.jsx';

const PreLoginModal = ({ onClose, onLogin }) => (
    <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
                <h2>Conecte-se com Monad Games ID</h2>
                <button onClick={onClose} className="close-button">&times;</button>
            </div>
            <div className="modal-body" style={{textAlign: 'center'}}>
                <div className="admin-action">
                    <h4>1. Crie sua conta no Monad ID</h4>
                    <p style={{color: 'var(--text-secondary-color)'}}>É rápido, fácil e necessário para jogar.</p>
                    <a href="https://monad-games-id-site.vercel.app/" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                         <button>Criar conta no Monad ID</button>
                    </a>
                </div>
                <hr style={{margin: '2rem 0'}} />
                <div className="admin-action">
                    <h4>2. Já tem uma conta?</h4>
                     <p style={{color: 'var(--text-secondary-color)'}}>Prossiga para se conectar com sua carteira.</p>
                    <button onClick={onLogin} className="primary">
                        Conectar Carteira
                    </button>
                </div>
            </div>
        </div>
    </div>
);

const LoadingState = ({ message }) => (
    <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
            <h2>{message}</h2>
        </div>
    </div>
);

function App() {
    const { ready, authenticated, user, login, logout, getEthereumProvider } = usePrivy();
    const { sendTransaction } = useCrossAppAccounts();

    const [gameWalletAddress, setGameWalletAddress] = useState(null);
    const [username, setUsername] = useState(null);
    const [walletBalance, setWalletBalance] = useState("0");
    const [isAdmin, setIsAdmin] = useState(false);
    const [pendingPrize, setPendingPrize] = useState("0");
    
    const [provider, setProvider] = useState(null);
    const [readOnlyProvider] = useState(new JsonRpcProvider(monadTestnet.rpcUrls.default.http[0]));
    const [contract, setContract] = useState(null);
    const [readOnlyContract, setReadOnlyContract] = useState(null);
    const [leaderboardContract, setLeaderboardContract] = useState(null);

    const [betPrice, setBetPrice] = useState("0");
    const [maxBetsPerDraw, setMaxBetsPerDraw] = useState(0);
    const [drawHistory, setDrawHistory] = useState([]);
    const [currentPot, setCurrentPot] = useState("0");
    const [bonusPot, setBonusPot] = useState("0");
    const [isGamePaused, setIsGamePaused] = useState(false);
    const [betsThisRound, setBetsThisRound] = useState(0);
    const [playerBets, setPlayerBets] = useState({ numbers: new Set(), animals: new Set() });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isHowItWorksModalOpen, setIsHowItWorksModalOpen] = useState(false);
    const [isPreLoginModalOpen, setIsPreLoginModalOpen] = useState(false);
    const [initializationError, setInitializationError] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [latestBet, setLatestBet] = useState(null);
    
    const isHandlingAuth = useRef(false);

    const addNotification = useCallback((message, type = 'info') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
    }, []);

    const handleLogin = () => {
        setIsPreLoginModalOpen(false);
        login();
    };
    
    const loadPublicData = useCallback(async () => {
        if (!readOnlyContract) return;
        try {
            const [status, history] = await Promise.all([
                readOnlyContract.getFullStatus(),
                readOnlyContract.getDrawHistory().catch(e => {
                    console.error("Falha ao carregar getDrawHistory, retornando array vazio.", e);
                    return [];
                }),
            ]);
            setBetPrice(formatEther(status.betPrice));
            setMaxBetsPerDraw(Number(status.maxBetsPerDraw));
            setIsGamePaused(status.isPaused);
            setDrawHistory([...history].sort((a, b) => Number(b.id) - Number(a.id)));
            setCurrentPot(formatEther(status.currentPot));
            setBonusPot(formatEther(status.bonusPot));
        } catch (error) {
            console.error("Falha ao carregar dados públicos:", error);
            setInitializationError("Não foi possível carregar os dados do jogo.");
        }
    }, [readOnlyContract]);

    const loadPrivateData = useCallback(async () => {
        if (!provider || !gameWalletAddress || !contract) return;

        try {
            const balance = await provider.getBalance(gameWalletAddress);
            setWalletBalance(formatEther(balance));

            const [isAdminStatus, prize, betsInRound, myBetsResult] = await Promise.all([
            contract.admins(gameWalletAddress),
            contract.pendingWithdrawals(gameWalletAddress),
            contract.betsPerPlayerInRound(gameWalletAddress),
            contract.getPlayerBets(gameWalletAddress)
            ]);

            const numbersRaw = Array.from(myBetsResult?.numbers ?? myBetsResult?.[0] ?? []);
            const animalsRaw = Array.from(myBetsResult?.animals ?? myBetsResult?.[1] ?? []);

            const numbersArray = numbersRaw.map(n => Number(n));
            const animalsArray = animalsRaw.map(a => String(a));

            setPlayerBets({
            numbers: new Set(numbersArray),
            animals: new Set(animalsArray)
            });

            setIsAdmin(isAdminStatus);
            setPendingPrize(formatEther(prize));
            setBetsThisRound(Number(betsInRound));
        } catch (error) {
            console.error("Falha ao carregar dados do usuário:", error);
        }
        }, [contract, provider, gameWalletAddress]);

    const refreshBlockchainData = useCallback(async () => {
        await Promise.all([loadPublicData(), loadPrivateData()]);
    }, [loadPublicData, loadPrivateData]);

    useEffect(() => {
        const roc = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readOnlyProvider);
        setReadOnlyContract(roc);
        const lbc = new Contract(LEADERBOARD_ADDRESS, LEADERBOARD_ABI, readOnlyProvider);
        setLeaderboardContract(lbc);
    }, [readOnlyProvider]);
    
    useEffect(() => {
        const setupUser = async () => {
            if (isHandlingAuth.current || !ready) return;

            if (!authenticated) {
                isHandlingAuth.current = false;
                setGameWalletAddress(null);
                setUsername(null);
                setContract(null);
                setProvider(null);
                return;
            }

            if (user) {
                isHandlingAuth.current = true;
                const monadGamesId = 'cmd8euall0037le0my79qpz42';
                const crossAppAccount = user.linkedAccounts.find(
                    (account) => account.type === "cross_app" && account.providerApp.id === monadGamesId
                );

                if (!crossAppAccount || !crossAppAccount.embeddedWallets || crossAppAccount.embeddedWallets.length === 0) {
                    addNotification('Conta Monad Games ID não encontrada.', 'error');
                    await logout();
                    isHandlingAuth.current = false;
                    return;
                }
                
                const walletAddress = crossAppAccount.embeddedWallets[0].address;
                
                try {
                    const response = await fetch(`https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${walletAddress}`);
                    const data = await response.json();
                    if (!data.hasUsername) {
                        addNotification('Nome de usuário não encontrado. Crie um no Monad Games ID.', 'error');
                        await logout();
                        isHandlingAuth.current = false;
                        return;
                    }
                    
                    setUsername(data.user.username);
                    setGameWalletAddress(walletAddress);
                } catch (error) {
                    console.error("Falha ao verificar username:", error);
                    addNotification("Erro ao verificar usuário. Desconectando.", "error");
                    await logout();
                } finally {
                    isHandlingAuth.current = false;
                }
            }
        };
        setupUser();
    }, [ready, authenticated, user, logout, addNotification]);

    useEffect(() => {
        const setupProviderAndContract = async () => {
            if (!gameWalletAddress || !authenticated || !ready) return;

            try {
            const privyProvider = await getEthereumProvider();
            if (!privyProvider) {
                setTimeout(setupProviderAndContract, 1000);
                return;
            }

            let accounts;
            try {
                accounts = await privyProvider.request({ method: "eth_accounts" });
            } catch {
                accounts = null;
            }

            if (!accounts || accounts.length === 0) {
                setTimeout(setupProviderAndContract, 1000);
                return;
            }

            const ethersProvider = new BrowserProvider(privyProvider);
            const signer = await ethersProvider.getSigner();
            const signerAddr = await signer.getAddress();

            const gameContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

            setProvider(ethersProvider);
            setContract(gameContract);

            } catch (e) {
            console.error("Erro ao inicializar o contrato:", e);
            addNotification("Erro ao configurar sua carteira. Tente novamente.", "error");
            }
        };

        setupProviderAndContract();
        }, [gameWalletAddress, authenticated, ready, getEthereumProvider, addNotification]);



    useEffect(() => {
        if (readOnlyContract) {
            loadPublicData();
            const wsProvider = new WebSocketProvider(monadTestnet.rpcUrls.default.webSocket[0]);
            const eventContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wsProvider);

            const handleEvent = (drawId, player, numbers, animals) => {
                 if (player && numbers && animals) {
                    const totalBets = numbers.length + animals.length;
                    const eventId = `${player}-${Date.now()}`;
                    setLatestBet({ player, totalBets, id: eventId });
                }
                refreshBlockchainData();
            };
            eventContract.on("BetsPlaced", handleEvent);
            return () => {
                eventContract.off("BetsPlaced", handleEvent);
                wsProvider.destroy().catch(e => console.error('Failed to destroy websocket provider', e));
            };
        }
    }, [readOnlyContract, refreshBlockchainData]);
    
    useEffect(() => {
        if(contract && provider && gameWalletAddress) {
            loadPrivateData();
        }
    }, [contract, provider, gameWalletAddress, loadPrivateData]);

    useEffect(() => {
        if (authenticated && gameWalletAddress && provider) {
            const intervalId = setInterval(() => {
                loadPrivateData();
            }, 5000);

            return () => clearInterval(intervalId);
        }
    }, [authenticated, gameWalletAddress, provider, loadPrivateData]);

    const removeNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const handlePlaceBet = async (numbers, animals) => {
        if (!authenticated) { 
            setIsPreLoginModalOpen(true);
            return false;
        }
        if (isGamePaused) {
            addNotification("O jogo está pausado no momento.", 'error');
            return false;
        }
        if (!contract || !provider) {
            addNotification("Carteira não está pronta.", 'error');
            return false;
        }
        
        const totalBetCount = numbers.length + animals.length;

        if (betsThisRound + totalBetCount > maxBetsPerDraw) {
            addNotification(`Limite de ${maxBetsPerDraw} apostas por rodada excedido. Você já fez ${betsThisRound} aposta(s).`, 'error');
            return false;
        }
        
        try {
            const price = parseEther(betPrice);
            const totalValue = BigInt(totalBetCount) * price;

            const userBalance = parseEther(walletBalance);
            if (userBalance < totalValue) {
                addNotification("Saldo insuficiente.", 'error');
                return false;
            }
            
            await sendTransaction(
                {
                    to: CONTRACT_ADDRESS,
                    data: contract.interface.encodeFunctionData("placeBets", [numbers, animals]),
                    value: '0x' + totalValue.toString(16),
                    chainId: monadTestnet.id,
                },
                { address: gameWalletAddress }
            );

            addNotification('Aposta realizada com sucesso!', 'success');
            await refreshBlockchainData(); 
            return true;

        } catch (error) {
            console.error("Erro ao apostar:", error);
            const errorMessage = error.message || "Erro desconhecido";
            if (!errorMessage.includes('User rejected')) {
                addNotification(`Falha na aposta: ${errorMessage}`, 'error');
            }
            return false;
        }
    };

    const handleWithdraw = async () => {
        if (!authenticated) { setIsPreLoginModalOpen(true); return; }
        if (!contract || !provider) return addNotification("Carteira não está pronta.", 'error');

        try {
            await sendTransaction(
                {
                    to: CONTRACT_ADDRESS,
                    data: contract.interface.encodeFunctionData("withdrawPrize"),
                    value: '0x0',
                    chainId: monadTestnet.id,
                },
                { address: gameWalletAddress }
            );
            addNotification('Saque bem-sucedido!', 'success');
            refreshBlockchainData();
        } catch (error) {
            console.error("Erro ao sacar:", error);
            const errorMessage = error.message || "Erro desconhecido";
            if (!errorMessage.includes('User rejected')) {
                addNotification(`Falha no saque: ${errorMessage}`, 'error');
            }
        }
    };

    const handleMonWithdraw = async (to, value) => {
        if (!authenticated) { setIsPreLoginModalOpen(true); return; }
        if (!provider) return addNotification("Carteira não está pronta.", 'error');

        try {
            await sendTransaction(
                {
                    to,
                    value: '0x' + value.toString(16),
                    chainId: monadTestnet.id,
                },
                { address: gameWalletAddress }
            );
            addNotification('MON sacado com sucesso!', 'success');
            refreshBlockchainData();
        } catch (error) {
            console.error("Erro ao sacar MON:", error);
            const errorMessage = error.message || "Erro desconhecido";
             if (!errorMessage.includes('User rejected')) {
                addNotification(`Falha no saque de MON: ${errorMessage}`, 'error');
            }
        }
    };
    
    const renderContent = () => {
        if (initializationError) return <div className="card error-card"><h2>Erro</h2><p>{initializationError}</p></div>;
        if (!readOnlyContract || !leaderboardContract) return <LoadingState message="Carregando dados..." />;

        const totalPotValue = parseFloat(currentPot) + parseFloat(bonusPot);

        return (
            <>
                {authenticated && parseFloat(walletBalance) < 0.3 && (
                    <div className="card warning-card">
                        <h3>Aviso</h3>
                        <p>Seu saldo está baixo ({parseFloat(walletBalance).toFixed(2)} MON). Recarregue para continuar jogando.</p>
                        <button onClick={() => setIsProfileModalOpen(true)}>Recarregar</button>
                    </div>
                )}
                {authenticated && parseFloat(pendingPrize) > 0 && (
                    <div className="card withdraw-card">
                        <h3>Você tem um prêmio para sacar!</h3>
                        <p className="pot-amount">
                          {parseFloat(pendingPrize).toLocaleString("en-US", { 
                             minimumFractionDigits: 2, 
                            maximumFractionDigits: 2 
                           })} MON
                        </p>
                        <button onClick={handleWithdraw}>Sacar Meu Prêmio</button>
                    </div>
                )}
                {isGamePaused && (
                    <div className="card danger-card">
                        <h3>Jogo Pausado</h3>
                        <p>O jogo está temporariamente pausado por um administrador. Novas apostas não são permitidas no momento.</p>
                    </div>
                )}
                <div className="stats-grid">
                    <div className="card pot-display">
                        <h2>Prêmio da Rodada Atual</h2>
                        <p className="pot-amount">
                            {new Intl.NumberFormat("en-US", { 
                                minimumFractionDigits: 2, 
                                maximumFractionDigits: 2 
                            }).format(totalPotValue)} MON
                        </p>
                        {parseFloat(bonusPot) > 0 && (
                            <p className="bonus-pot-text">
                                (inclui {new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(bonusPot)} MON de bônus!)
                            </p>
                        )}
                    </div>
                    <LastDraw lastDraw={drawHistory[0]} />
                </div>
                <BettingGrid 
                    betPrice={betPrice}
                    maxBetsPerDraw={maxBetsPerDraw}
                    betsThisRound={betsThisRound}
                    playerBets={playerBets}
                    isGamePaused={isGamePaused}
                    onPlaceBet={handlePlaceBet} 
                    isAuthenticated={authenticated}
                    addNotification={addNotification}
                    walletBalance={walletBalance}
                />
                
                <MyBets playerBets={playerBets} />

                <Leaderboard 
                    provider={readOnlyProvider} 
                    gameContract={readOnlyContract}
                    leaderboardContract={leaderboardContract} 
                    yourAddress={gameWalletAddress}
                />
                <div className="card history-card">
                    <h3>Histórico Detalhado de Sorteios</h3>
                    <History history={drawHistory} />
                </div>
            </>
        );
    };

    return (
        <div className="container">
            {isPreLoginModalOpen && <PreLoginModal onClose={() => setIsPreLoginModalOpen(false)} onLogin={handleLogin} />}
            <BetNotification betEvent={latestBet} onDismiss={() => setLatestBet(null)} />
            <div className="notification-container">
                {notifications.map(note => (
                    <Notification 
                        key={note.id}
                        message={note.message}
                        type={note.type}
                        onDismiss={() => removeNotification(note.id)}
                    />
                ))}
            </div>
            <header>
                <h1>JDB</h1>
                <div className="header-controls">
                    {!ready ? (
                        <button disabled>Carregando...</button>
                    ) : !authenticated ? (
                        <button onClick={() => setIsPreLoginModalOpen(true)}>Login com Monad Games ID</button>
                    ) : (
                        <>
                            <button className="how-it-works-button" onClick={() => setIsHowItWorksModalOpen(true)}>
                                Como Funciona?
                            </button>
                            <div className="user-profile" onClick={() => setIsProfileModalOpen(true)}>
                                {username === null ? "..." : username}
                            </div>
                            {isAdmin && <button className="admin-button" onClick={() => setIsModalOpen(true)}>Admin</button>}
                            <button onClick={logout}>Logout</button>
                        </>
                    )}
                </div>
            </header>
            <HowItWorksModal 
                isOpen={isHowItWorksModalOpen} 
                onClose={() => setIsHowItWorksModalOpen(false)} 
            />
            <AdminModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                contract={contract}
                readOnlyContract={readOnlyContract}
                provider={provider}
                sendTransaction={sendTransaction}
                gameWalletAddress={gameWalletAddress}
                addNotification={addNotification}
                onSuccess={refreshBlockchainData}
            />
            <UserProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                username={username}
                balance={parseFloat(walletBalance).toFixed(4)}
                address={gameWalletAddress}
                onWithdraw={handleMonWithdraw}
                addNotification={addNotification}
            />
            <main>
                {renderContent()}
            </main>
             <Footer />
        </div>
    );
}

export default App;