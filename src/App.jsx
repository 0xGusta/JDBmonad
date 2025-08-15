import { useState, useEffect } from 'react';
import { usePrivy, useCrossAppAccounts } from "@privy-io/react-auth";
import { BrowserProvider, Contract, formatEther, JsonRpcProvider, parseEther } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './contractInfo';
import { monadTestnet } from './monadChain.js';
import './App.css';

import AdminModal from './components/AdminModal.jsx';
import BettingGrid from './components/BettingGrid.jsx';
import History from './components/History.jsx';

const LoadingState = ({ message }) => (
    <div className="card">
        <h2>{message}</h2>
    </div>
);

function App() {

    const { ready, authenticated, user, login, logout, getEthereumProvider } = usePrivy();
    const { sendTransaction } = useCrossAppAccounts();

    const [gameWalletAddress, setGameWalletAddress] = useState(null);
    const [username, setUsername] = useState("");
    const [walletBalance, setWalletBalance] = useState("0.00");
    const [isAdmin, setIsAdmin] = useState(false);
    const [pendingPrize, setPendingPrize] = useState("0");
    
    const [provider, setProvider] = useState(null);
    const [readOnlyProvider] = useState(new JsonRpcProvider(monadTestnet.rpcUrls.default.http[0]));
    const [contract, setContract] = useState(null);
    const [readOnlyContract, setReadOnlyContract] = useState(null);

    const [betPrice, setBetPrice] = useState("0");
    const [drawHistory, setDrawHistory] = useState([]);
    const [currentPot, setCurrentPot] = useState("0");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [initializationError, setInitializationError] = useState(null);

    useEffect(() => {
        console.log("Inicializando contrato de apenas leitura...");
        const roc = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readOnlyProvider);
        setReadOnlyContract(roc);
    }, [readOnlyProvider]);

    useEffect(() => {
        const setupUserAndSigner = async () => {
            if (ready && authenticated && user) {
                const monadGamesId = 'cmd8euall0037le0my79qpz42';
                const crossAppAccount = user.linkedAccounts.find(
                    (account) => account.type === "cross_app" && account.providerApp.id === monadGamesId
                );
                const embeddedWallet = crossAppAccount?.embeddedWallets?.[0];

                if (embeddedWallet) {
                    const walletAddress = embeddedWallet.address;
                    setGameWalletAddress(walletAddress);

                    fetch(`https://monad-games-id-site.vercel.app/api/check-wallet?wallet=${walletAddress}`)
                        .then(res => res.json())
                        .then(data => setUsername(data.hasUsername ? data.user.username : "Anônimo"));

                    try {
                        const privyProvider = await getEthereumProvider();
                        const ethersProvider = new BrowserProvider(privyProvider);
                        setProvider(ethersProvider);
                        
                        const signer = await ethersProvider.getSigner();
                        const gameContract = new Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
                        setContract(gameContract);
                    } catch (e) {
                        console.error("Erro ao inicializar o contrato com signer:", e);
                    }
                }
            } else if (ready && !authenticated) {

                setGameWalletAddress(null);
                setContract(null);
                setProvider(null);
                setUsername("");
                setWalletBalance("0.00");
                setIsAdmin(false);
                setPendingPrize("0");
            }
        };
        setupUserAndSigner();
    }, [ready, authenticated, user, getEthereumProvider]);

    useEffect(() => {
        const loadPublicData = async () => {
            if (readOnlyContract) {
                try {
                    const [currentBetPrice, history, pot] = await Promise.all([
                        readOnlyContract.betPrice(),
                        readOnlyContract.getDrawHistory(),
                        readOnlyContract.getCurrentRoundPot(),
                    ]);
                    setBetPrice(formatEther(currentBetPrice));
                    setDrawHistory([...history].reverse());
                    setCurrentPot(formatEther(pot));
                } catch (error) {
                    console.error("Falha ao carregar dados públicos:", error);
                    setInitializationError("Não foi possível carregar os dados do jogo.");
                }
            }
        };
        loadPublicData();
        const interval = setInterval(loadPublicData, 15000);
        return () => clearInterval(interval);
    }, [readOnlyContract]);
    
    useEffect(() => {
        const loadPrivateData = async () => {
             if (contract && provider && gameWalletAddress) {
                try {
                    const [isAdminStatus, prize, balance] = await Promise.all([
                        contract.admins(gameWalletAddress),
                        contract.pendingWithdrawals(gameWalletAddress),
                        provider.getBalance(gameWalletAddress)
                    ]);
                    setIsAdmin(isAdminStatus);
                    setPendingPrize(formatEther(prize));
                    setWalletBalance(parseFloat(formatEther(balance)).toFixed(2));
                } catch (error) {
                    console.error("Falha ao carregar dados do usuário:", error);
                }
            }
        };
        loadPrivateData();
    }, [contract, provider, gameWalletAddress]);


    const showSuccessToast = (message) => alert(message);
    const showErrorToast = (message) => alert(message);

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(gameWalletAddress);
        showSuccessToast("Endereço copiado!");
    };

    const handlePlaceBet = async (numbers, animals) => {
        if (!authenticated) {
            login();
            return;
        }
        if (!contract || !provider) return showErrorToast("Carteira não está pronta. Tente novamente.");
        
        try {
            const totalBet = BigInt(numbers.length + animals.length);
            const price = await contract.betPrice();
            const totalValue = totalBet * price;

            showSuccessToast('Aguarde a confirmação da transação...');
            
            const { hash } = await sendTransaction(
                {
                    to: CONTRACT_ADDRESS,
                    data: contract.interface.encodeFunctionData("placeBets", [numbers, animals]),
                    value: '0x' + totalValue.toString(16),
                    chainId: monadTestnet.id,
                },
                { address: gameWalletAddress }
            );

            await provider.waitForTransaction(hash);
            showSuccessToast('Aposta realizada com sucesso!');
        } catch (error) {
            console.error("Erro ao apostar:", error);
            showErrorToast(`Falha na aposta: ${error.message}`);
        }
    };

    const handleWithdraw = async () => {
        if (!authenticated) {
            login();
            return;
        }
        if (!contract || !provider) return showErrorToast("Carteira não está pronta. Tente novamente.");

        try {
            showSuccessToast('Enviando transação de saque...');
            const { hash } = await sendTransaction(
                {
                    to: CONTRACT_ADDRESS,
                    data: contract.interface.encodeFunctionData("withdrawPrize"),
                    value: '0x0',
                    chainId: monadTestnet.id,
                },
                { address: gameWalletAddress }
            );
            await provider.waitForTransaction(hash);
            showSuccessToast('Prêmio sacado com sucesso!');
        } catch (error) {
            console.error("Erro ao sacar:", error);
            showErrorToast(`Falha no saque: ${error.message}`);
        }
    };
    
    const renderContent = () => {
        if (initializationError) return <div className="card error-card"><h2>Erro</h2><p>{initializationError}</p></div>;
        if (!readOnlyContract) return <LoadingState message="Carregando dados da blockchain..." />;

        return (
            <>
                {authenticated && parseFloat(pendingPrize) > 0 && (
                    <div className="card withdraw-card">
                        <h3>🏆 Você tem um prêmio para sacar! 🏆</h3>
                        <p className="pot-amount">{pendingPrize} MON</p>
                        <button onClick={handleWithdraw}>Sacar Meu Prêmio</button>
                    </div>
                )}
                <div className="card pot-display">
                    <h2>Prêmio da Rodada Atual</h2>
                    <p className="pot-amount">{currentPot} MON</p>
                </div>
                <BettingGrid 
                    betPrice={betPrice} 
                    onPlaceBet={handlePlaceBet} 
                    isAuthenticated={authenticated}
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
            <header>
                <h1>JDB</h1>
                <div className="header-controls">
                    {!ready ? (
                        <button disabled>Carregando...</button>
                    ) : !authenticated ? (
                        <button onClick={login}>Login com Monad Games ID</button>
                    ) : (
                        <>
                            <div className="user-profile" title="Clique para copiar seu endereço" onClick={handleCopyAddress}>
                                {username || "..."} ({walletBalance} MON)
                            </div>
                            {isAdmin && <button className="admin-button" onClick={() => setIsModalOpen(true)}>Painel Admin</button>}
                            <button onClick={logout}>Logout</button>
                        </>
                    )}
                </div>
            </header>
            <AdminModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                contract={contract}
                provider={provider}
                sendTransaction={sendTransaction}
                gameWalletAddress={gameWalletAddress}
            />
            <main>
                {renderContent()}
            </main>
        </div>
    );
}

export default App;