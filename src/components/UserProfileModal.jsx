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
            addNotification('Please enter a valid address and amount.', 'error');
            return;
        }
        onWithdraw(withdrawAddress, parseEther(withdrawAmount));
    };

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(address);
        addNotification('Address copied to clipboard!', 'success');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Profile</h2>
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
                        <h4>How to add funds to your wallet:</h4>
                        <p>Send MON from your main wallet to this address.</p>
                        <p>{address} <button onClick={handleCopyAddress}>Copy</button></p>
                    </div>
                    <div className="withdraw-section">
                        <h4>Withdraw MON</h4>
                        <p>Destination wallet:</p>
                        <input
                            type="text"
                            placeholder="Recipient Address"
                            value={withdrawAddress}
                            onChange={(e) => setWithdrawAddress(e.target.value)}
                        />
                        <p>Amount:</p>
                        <input
                            type="number"
                            placeholder="Amount in MON"
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                        />
                        <button onClick={handleWithdraw}>Withdraw</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;
