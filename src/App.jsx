import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { translations } from './translations';
import { usePrivy, useCrossAppAccounts } from "@privy-io/react-auth";
import { BrowserProvider, Contract, formatEther, WebSocketProvider, FallbackProvider, JsonRpcProvider, parseEther } from "ethers";
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



function App() {
    const { ready, authenticated, user, login, logout, getEthereumProvider } = usePrivy();
    const { sendTransaction } = useCrossAppAccounts();

    const [gameWalletAddress, setGameWalletAddress] = useState(null);
    const [username, setUsername] = useState(null);
    const [walletBalance, setWalletBalance] = useState("0");
    const [isAdmin, setIsAdmin] = useState(false);
    const [pendingPrize, setPendingPrize] = useState("0");
    
    const [provider, setProvider] = useState(null);
    const [readOnlyProvider] = useState(
        new FallbackProvider(
            monadTestnet.rpcUrls.default.http.map(url => new JsonRpcProvider(url)),
            monadTestnet.id
        )
    );
    const [contract, setContract] = useState(null);
    const [readOnlyContract, setReadOnlyContract] = useState(null);
    const [leaderboardContract, setLeaderboardContract] = useState(null);

    const [betPrice, setBetPrice] = useState("0");
    const [drawHistory, setDrawHistory] = useState([]);
    const [raffleHistory, setRaffleHistory] = useState([]);
    const [currentPot, setCurrentPot] = useState("0");
    const [bonusPot, setBonusPot] = useState("0");
    const [isGamePaused, setIsGamePaused] = useState(false);
    const [maxNumberBets, setMaxNumberBets] = useState(0);
    const [maxAnimalBets, setMaxAnimalBets] = useState(0);
    const [numberBetsThisRound, setNumberBetsThisRound] = useState(0);
    const [animalBetsThisRound, setAnimalBetsThisRound] = useState(0);
    const [contractStatus, setContractStatus] = useState({
        animalHitPercentage: 0,
        numberHitPercentage: 0,
        dappFeePercentage: 0,
    });

    const [playerBets, setPlayerBets] = useState({ numbers: new Set(), animals: new Set() });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isHowItWorksModalOpen, setIsHowItWorksModalOpen] = useState(false);
    const [isPreLoginModalOpen, setIsPreLoginModalOpen] = useState(false);
    const [initializationError, setInitializationError] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [latestBet, setLatestBet] = useState(null);
    
    const isHandlingAuth = useRef(false);
    const [language, setLanguage] = useState(() => {
        return localStorage.getItem('language') || 'en';
    });


    const t = (key, params = {}) => {
        const text = translations[language][key] || translations.en[key] || key;
        return Object.keys(params).reduce((str, k) => str.replace(`{${k}}`, params[k]), text);
    };

    const addNotification = useCallback((message, type = 'info') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);
    }, []);

    const handleLogin = () => {
        setIsPreLoginModalOpen(false);
        login();
    };

    const savedLanguage = localStorage.getItem('language') || 'en';
    const [toggle, setToggle] = useState(savedLanguage === 'pt');

    const handleToggleLanguage = () => {
        const newLang = toggle ? 'en' : 'pt';
        setLanguage(newLang);
        localStorage.setItem('language', newLang);
        setToggle(!toggle);
    };

    useEffect(() => {
        setToggle(language === 'pt');
    }, [language]);

    const PreLoginModal = ({ onClose, onLogin }) => (
        <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
            <h2>{t("prelogin.title")}</h2>
            <button onClick={onClose} className="close-button">
                &times;
            </button>
            </div>
            <div className="modal-body" style={{ textAlign: "center" }}>
            <div className="admin-action">
                <h4>{t("prelogin.step1_title")}</h4>
                <p style={{ color: "var(--text-secondary-color)" }}>
                {t("prelogin.step1_p1")}
                </p>
                <a
                href="https://monad-games-id-site.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
                >
                <button>{t("prelogin.step1_button")}</button>
                </a>
            </div>

            <hr style={{ margin: "2rem 0" }} />

            <div className="admin-action">
                <h4>{t("prelogin.step2_title")}</h4>
                <p style={{ color: "var(--text-secondary-color)" }}>
                {t("prelogin.step2_p1")}
                </p>
                <button onClick={onLogin} className="primary">
                {t("prelogin.step2_button")}
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
    
    const loadPublicData = useCallback(async () => {
        if (!readOnlyContract) return;
        try {
            const [
            status,
            history,
            numberHitPct,
            animalHitPct,
            dappFeePct,
            ] = await Promise.all([
            readOnlyContract.getFullStatus(),
            readOnlyContract.getDrawHistory().catch(e => {
                console.error("Failed to load getDrawHistory, returning empty array.", e);
                return [];
            }),
            readOnlyContract.numberHitPercentage(),
            readOnlyContract.animalHitPercentage(),
            readOnlyContract.dappFeePercentage(),
            ]);

            setBetPrice(formatEther(status.betPrice));
            setMaxNumberBets(Number(status.maxNumberBetsPerPlayer));
            setMaxAnimalBets(Number(status.maxAnimalBetsPerPlayer));
            setIsGamePaused(status.isPaused);
            setRaffleHistory([...history].sort((a, b) => Number(b.id) - Number(a.id)));
            setCurrentPot(formatEther(status.currentPot));
            setBonusPot(formatEther(status.bonusPot));

            setContractStatus({
            numberHitPercentage: Number(numberHitPct ?? 0),
            animalHitPercentage: Number(animalHitPct ?? 0),
            dappFeePercentage:   Number(dappFeePct ?? 0),
            });
        } catch (error) {
            console.error("Failed to load public data:", error);
            setInitializationError("Unable to load game data.");
        }
        }, [readOnlyContract]);

    const loadPrivateData = useCallback(async () => {
        if (!provider || !gameWalletAddress || !contract) return;

        try {
            const balance = await provider.getBalance(gameWalletAddress);
            setWalletBalance(formatEther(balance));
            const [
                isAdminStatus, 
                prize, 
                myBetsResult,
                numbersCount,
                animalsCount,
            ] = await Promise.all([
                contract.admins(gameWalletAddress),
                contract.pendingWithdrawals(gameWalletAddress),
                contract.getPlayerBets(gameWalletAddress),
                contract.numberBetsPerPlayerInRound(gameWalletAddress),
                contract.animalBetsPerPlayerInRound(gameWalletAddress),
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
            setNumberBetsThisRound(Number(numbersCount));
            setAnimalBetsThisRound(Number(animalsCount));


        } catch (error) {
            console.error("Failed to load user data:", error);
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
                    addNotification('Monad Games ID account not found.', 'error');
                    await logout();
                    isHandlingAuth.current = false;
                    return;
                }
                
                const walletAddress = crossAppAccount.embeddedWallets[0].address;
                
                try {
                    const response = await fetch(`https://www.monadclip.fun/api/check-wallet?wallet=${walletAddress}`);
                    const data = await response.json();
                    if (!data.hasUsername) {
                        addNotification('Username not found. Create one on Monad Games ID.', 'error');
                        await logout();
                        isHandlingAuth.current = false;
                        return;
                    }
                    
                    setUsername(data.user.username);
                    setGameWalletAddress(walletAddress);
                } catch (error) {
                    console.error("Failed to verify username:", error);
                    addNotification("Error verifying user. Disconnecting.", "error");
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
            console.error("Error initializing contract:", e);
            addNotification("Error setting up your wallet. Please try again.", "error");
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
            addNotification("The game is currently paused.", 'error');
            return false;
        }
        if (!contract || !provider) {
            addNotification("Wallet is not ready.", 'error');
            return false;
        }
        
        if (numberBetsThisRound + numbers.length > maxNumberBets) {
            addNotification(`Limit of ${maxNumberBets} number bets exceeded. You have already made ${numberBetsThisRound} number bet(s).`, 'error');
            return false;
        }
        if (animalBetsThisRound + animals.length > maxAnimalBets) {
            addNotification(`Limit of ${maxAnimalBets} animal bets exceeded. You have already made ${animalBetsThisRound} animal bet(s).`, 'error');
            return false;
        }
        
        try {
            const totalBetCount = numbers.length + animals.length;
            const price = parseEther(betPrice);
            const totalValue = BigInt(totalBetCount) * price;

            const userBalance = parseEther(walletBalance);
            if (userBalance < totalValue) {
                addNotification("Insufficient balance.", 'error');
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

            addNotification('Bet placed successfully!', 'success');
            await refreshBlockchainData(); 
            return true;

        } catch (error) {
            console.error("Error placing bet:", error);
            const errorMessage = error.message || "Unknown error";
            if (!errorMessage.includes('User rejected')) {
                addNotification(`Bet failed: ${errorMessage}`, 'error');
            }
            return false;
        }
    };

    const handleWithdraw = async () => {
        if (!authenticated) { setIsPreLoginModalOpen(true); return; }
        if (!contract || !provider) return addNotification("Wallet is not ready.", 'error');

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
            addNotification('Withdrawal successful!', 'success');
            refreshBlockchainData();
        } catch (error) {
            console.error("Error withdrawing:", error);
            const errorMessage = error.message || "Unknown error";
            if (!errorMessage.includes('User rejected')) {
                addNotification(`Withdrawal failed: ${errorMessage}`, 'error');
            }
        }
    };

    const handleMonWithdraw = async (to, value) => {
        if (!authenticated) { setIsPreLoginModalOpen(true); return; }
        if (!provider) return addNotification("Wallet is not ready.", 'error');

        try {
            await sendTransaction(
                {
                    to,
                    value: '0x' + value.toString(16),
                    chainId: monadTestnet.id,
                },
                { address: gameWalletAddress }
            );
            addNotification('MON withdrawn successfully!', 'success');
            refreshBlockchainData();
        } catch (error) {
            console.error("Error withdrawing MON:", error);
            const errorMessage = error.message || "Unknown error";
             if (!errorMessage.includes('User rejected')) {
                addNotification(`MON withdrawal failed: ${errorMessage}`, 'error');
            }
        }
    };
    
    const renderContent = () => {
        if (initializationError) {
            return (
            <div className="card error-card">
                <h2>{t("error.title")}</h2>
                <p>{initializationError}</p>
            </div>
            );
        }

        if (!readOnlyContract || !leaderboardContract) {
            return <LoadingState message={t("loading.data")} />;
        }

        const totalPotValue = parseFloat(currentPot) + parseFloat(bonusPot);

        return (
            <>
            {authenticated && parseFloat(walletBalance) < 1 && (
                <div className="card warning-card">
                <h3>{t("warning.title")}</h3>
                <p>
                    {t("warning.p1", {
                    balance: parseFloat(walletBalance).toFixed(2),
                    })}
                </p>
                <button onClick={() => setIsProfileModalOpen(true)}>
                    {t("warning.button")}
                </button>
                </div>
            )}

            {authenticated && parseFloat(pendingPrize) > 0 && (
                <div className="card withdraw-card">
                <h3>{t("withdraw_card.title")}</h3>
                <p className="pot-amount">
                    {parseFloat(pendingPrize).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                    })}{" "}
                    MON
                </p>
                <button onClick={handleWithdraw}>
                    {t("withdraw_card.button")}
                </button>
                </div>
            )}

            {isGamePaused && (
                <div className="card danger-card">
                <h3>{t("paused.title")}</h3>
                <p>{t("paused.description")}</p>
                </div>
            )}

            <div className="stats-grid">
                <div className="card pot-display">
                <h2>{t("stats_grid.pot_title")}</h2>
                <p className="pot-amount">
                    {new Intl.NumberFormat("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                    }).format(totalPotValue)}{" "}
                    MON
                </p>
                <h2>{t("stats_grid.draw_time")}</h2>
                <p className="percentagesinfo">
                    {t("stats_grid.draw_percentages", {
                        animal: contractStatus.animalHitPercentage ?? 0,
                        number: contractStatus.numberHitPercentage ?? 0,
                        dapp:   contractStatus.dappFeePercentage ?? 0,
                    })}
                </p>
                </div>

                <LastDraw lastDraw={raffleHistory[0]} />
            </div>

            <BettingGrid
                betPrice={betPrice}
                maxNumberBetsPerPlayer={maxNumberBets}
                maxAnimalBetsPerPlayer={maxAnimalBets}
                numberBetsThisRound={numberBetsThisRound}
                animalBetsThisRound={animalBetsThisRound}
                playerBets={playerBets}
                isGamePaused={isGamePaused}
                disabled={!ready || !authenticated}
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
                <h3>{t("history.title")}</h3>
                <History history={raffleHistory} />
            </div>
            </>
        );
        };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
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
                <div className="header-controls">
                    <div className="logo-container">
                    <img src="images/monanimallogo.svg" alt="JDB Logo" width={200} height={60} />
                    </div>

                    <div className="header-btns" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {!ready ? (
                        <button disabled>{t("header.loading")}</button>
                    ) : !authenticated ? (
                        <button onClick={() => setIsPreLoginModalOpen(true)}>{t("header.login")}</button>
                    ) : (
                        <>
                        <button className="how-it-works-button" onClick={() => setIsHowItWorksModalOpen(true)}>
                            {t("header.how_it_works")}
                        </button>
                        <div className="user-profile" onClick={() => setIsProfileModalOpen(true)}>
                            {username ?? "..."}
                        </div>
                        {isAdmin && <button className="admin-button" onClick={() => setIsModalOpen(true)}>Admin</button>}
                        <button onClick={logout}>Logout</button>
                        </>
                    )}
                    
                    <div 
                        className="language-toggle" 
                        onClick={handleToggleLanguage} 
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                    >
                        <span style={{ fontWeight: toggle ? 'normal' : 'bold' }}>
                        <img src="https://flagicons.lipis.dev/flags/4x3/us.svg" alt="EN" width={20} height={20} />
                        </span>
                        <div style={{
                        width: '40px',
                        height: '20px',
                        background:'#7c3aed',
                        borderRadius: '10px',
                        position: 'relative',
                        transition: 'background 0.3s'
                        }}>
                        <div style={{
                            width: '18px',
                            height: '18px',
                            background: '#fff',
                            borderRadius: '50%',
                            position: 'absolute',
                            top: '1px',
                            left: toggle ? '20px' : '1px',
                            transition: 'left 0.3s'
                        }}></div>
                        </div>
                        <span style={{ fontWeight: toggle ? 'bold' : 'normal' }}>
                        <img src="https://flagicons.lipis.dev/flags/4x3/br.svg" alt="PT" width={20} height={20} />
                        </span>
                    </div>
                    </div>
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
        </LanguageContext.Provider>
    );
}

export default App;

export const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);
