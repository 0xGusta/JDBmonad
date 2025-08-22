import { useState, useEffect } from 'react';
import { parseEther, formatEther } from "ethers";

const UserProfileModal = ({ isOpen, onClose, username, balance, address, onWithdraw, addNotification }) => {
    const [withdrawAddress, setWithdrawAddress] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [walletBalance, setWalletBalance] = useState(balance);

    useEffect(() => {
        setWalletBalance(balance);
    }, [balance]);

    if (!isOpen) return null;

    const handleWithdraw = () => {
        if (!withdrawAddress || !withdrawAmount) {
            addNotification('Por favor, insira um endereço e uma quantidade válidos.', 'error');
            return;
        }
        onWithdraw(withdrawAddress, parseEther(withdrawAmount));
    };

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(address);
        addNotification('Endereço copiado para a área de transferência!', 'success');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Perfil</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="modal-body">
                    <div className="user-info">
                        <p><strong>{username}</strong></p>
                        <p>
                            <strong>
                                {new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(walletBalance)} MON
                            </strong>
                        </p>
                    </div>
                    <div className="top-up-instructions">
                        <h4>Como adicionar fundos à sua carteira:</h4>
                        <p>Envie MON da sua carteira principal para este endereço.</p>
                        <p>{address} <button onClick={handleCopyAddress}>Copiar</button></p>
                    </div>
                    <div className="withdraw-section">
                        <h4>Retirar MON</h4>
                        <p>Carteira de destino:</p>
                        <input
                            type="text"
                            placeholder="Endereço do Destinatário"
                            value={withdrawAddress}
                            onChange={(e) => setWithdrawAddress(e.target.value)}
                        />
                        <p>Quantidade:</p>
                        <input
                            type="number"
                            placeholder="Quantidade em MON"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                        />
                        <button onClick={handleWithdraw}>Retirar</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;
