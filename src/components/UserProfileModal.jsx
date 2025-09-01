import { useState, useEffect } from 'react';
import { parseEther } from "ethers";
import { useLanguage } from '../App.jsx';

const UserProfileModal = ({ isOpen, onClose, username, balance, address, onWithdraw, addNotification }) => {
    const { t } = useLanguage();
    const [withdrawAddress, setWithdrawAddress] = useState('');
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [walletBalance, setWalletBalance] = useState(balance);

    useEffect(() => {
        setWalletBalance(balance);
    }, [balance]);

    if (!isOpen) return null;

    const handleWithdraw = () => {
        if (!withdrawAddress || !withdrawAmount || parseFloat(withdrawAmount) <= 0) {

            addNotification(t('modal.user_profile.error_invalid_withdraw'), 'error');
            return;
        }
        onWithdraw(withdrawAddress, parseEther(withdrawAmount));
    };

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(address);

        addNotification(t('modal.user_profile.success_copy'), 'success');
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">

                    <h2>{t('modal.user_profile.title')}</h2>
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
                        <h4>{t('modal.user_profile.how_to_add_funds')}</h4>
                        <p>{t('modal.user_profile.p1')}</p>
                        <p>{address} <button onClick={handleCopyAddress}>{t('modal.user_profile.copy')}</button></p>
                    </div>
                    <div className="withdraw-section">
                        <h4>{t('modal.user_profile.withdraw_title')}</h4>
                        <p>{t('modal.user_profile.destination_wallet')}</p>
                        <input
                            type="text"
                            placeholder={t('modal.user_profile.placeholder_address')}
                            value={withdrawAddress}
                            onChange={(e) => setWithdrawAddress(e.target.value)}
                        />
                        <p>{t('modal.user_profile.amount')}</p>
                        <input
                            type="number"
                            placeholder={t('modal.user_profile.placeholder_amount')}
                            value={withdrawAmount}
                            onChange={(e) => setWithdrawAmount(e.target.value)}
                        />
                        <button onClick={handleWithdraw}>{t('modal.user_profile.withdraw_button')}</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;