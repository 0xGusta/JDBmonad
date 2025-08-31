import React, { useState, useEffect, useCallback } from 'react';
import { parseEther, formatEther } from "ethers";
import { CONTRACT_ADDRESS } from '../contractInfo';
import { monadTestnet } from '../monadChain';

const StatusItem = ({ label, value, children }) => (
    <div className="status-item">
        <strong>{label}:</strong>
        <span>{children || value}</span>
    </div>
);

const ActionSection = ({ title, description, children }) => (
    <div className="admin-action">
        <h4>{title}</h4>
        {description && <p className="action-description">{description}</p>}
        {children}
    </div>
);


const AdminModal = ({ isOpen, onClose, contract, readOnlyContract, provider, sendTransaction, gameWalletAddress, addNotification, onSuccess }) => {
    const [activeTab, setActiveTab] = useState('status');
    const [contractStatus, setContractStatus] = useState(null);

    const fetchContractStatus = useCallback(async (isInitialLoad = false) => {
        const contractReader = contract || readOnlyContract;
        if (!contractReader) return;

        try {

            const [status, numberPercent, animalPercent, dappFeePercent, dappWalletAddress] = await Promise.all([
                contractReader.getFullStatus(),
                contractReader.numberHitPercentage(),
                contractReader.animalHitPercentage(),
                contractReader.dappFeePercentage(),
                contractReader.dappWallet()
            ]);


            setContractStatus({
                isPaused: status.isPaused,
                statusString: status.statusString,
                nextDrawId: status.nextDrawId.toString(),
                activeSequenceNumber: status.activeSequenceNumber.toString(),
                currentPot: formatEther(status.currentPot),
                bonusPot: formatEther(status.bonusPot),
                betPrice: formatEther(status.betPrice),
                maxBetsPerDraw: status.maxBetsPerDraw.toString(),
                isRandomNumberFulfilled: status.isRandomNumberFulfilled,
                numberHitPercentage: numberPercent.toString(),
                animalHitPercentage: animalPercent.toString(),
                dappFeePercentage: dappFeePercent.toString(),
                dappWallet: dappWalletAddress
            });
        } catch (error) {
            console.error("Error fetching contract status:", error);
            if (isInitialLoad) {
               addNotification("Unable to load contract status.", "error");
            }
        }
    }, [contract, readOnlyContract, addNotification]);

    useEffect(() => {
        if (isOpen) {
            if (!contractStatus) {
                fetchContractStatus(true);
            }
            const intervalId = setInterval(() => fetchContractStatus(false), 5000);
            return () => clearInterval(intervalId);
        }
    }, [isOpen, contractStatus, fetchContractStatus]);

    if (!isOpen) return null;

    const handleAction = async (action, args = [], txValue = '0x0') => {
        if (!contract || !provider || !sendTransaction || !gameWalletAddress) {
            addNotification("Wallet is not ready for transactions.", 'error');
            return;
        }

        try {
            await sendTransaction(
                { to: CONTRACT_ADDRESS, data: contract.interface.encodeFunctionData(action, args), value: txValue, chainId: monadTestnet.id },
                { address: gameWalletAddress }
            );

            addNotification(`Action "${action}" successful!`, 'success');
            if (onSuccess) onSuccess();
            fetchContractStatus(true);

        } catch (error) {
            console.error(`Error executing ${action}:`, error);
            const errorMessage = error.reason || error.message || "Unknown error.";
            if (!errorMessage.includes('User rejected')) {
                addNotification(`Action failed: ${errorMessage}`, 'error');
            }
        }
    };

    const handleTriggerDraw = async () => {
        if (!contract) return addNotification("Contract is not ready.", 'error');
        try {
            const pythFee = await contract.getPythFee();
            const feeInHex = '0x' + pythFee.toString(16);
            await handleAction('triggerDraw', [], feeInHex);
        } catch (error) {
            addNotification(`Failed to fetch Pyth fee: ${error.message}`, 'error');
        }
    };

    const handleAddBonus = () => {
        const amount = document.getElementById('bonusAmountInput').value;
        if (!amount || parseFloat(amount) <= 0) {
            addNotification("Please enter a valid bonus amount.", "error");
            return;
        }
        const valueAsHex = '0x' + parseEther(amount).toString(16);
        handleAction('addBonusToPot', [], valueAsHex);
    };

    const renderTabs = () => (
        <div className="tabs">
            <button className={activeTab === 'status' ? 'active' : ''} onClick={() => setActiveTab('status')}>Status</button>
            <button className={activeTab === 'management' ? 'active' : ''} onClick={() => setActiveTab('management')}>Round</button>
            <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>Settings</button>
            <button className={activeTab === 'admins' ? 'active' : ''} onClick={() => setActiveTab('admins')}>Admins</button>
        </div>
    );
    
    const renderStatusContent = () => (
        <div className="status-grid">
            <StatusItem label="Status">{contractStatus.statusString}</StatusItem>
            <StatusItem label="Paused">{contractStatus.isPaused ? 'Yes' : 'No'}</StatusItem>
            <StatusItem label="Next Raffle">{`#${contractStatus.nextDrawId}`}</StatusItem>
            <StatusItem label="Round Pot">{`${parseFloat(contractStatus.currentPot).toFixed(4)} MON`}</StatusItem>
            <StatusItem label="Bonus Pot">{`${parseFloat(contractStatus.bonusPot).toFixed(4)} MON`}</StatusItem>
            <StatusItem label="Bet Price">{`${parseFloat(contractStatus.betPrice).toFixed(4)} MON`}</StatusItem>
            <StatusItem label="Max Bets">{contractStatus.maxBetsPerDraw}</StatusItem>
            <StatusItem label="Pyth OK">{contractStatus.isRandomNumberFulfilled ? 'Yes' : 'No'}</StatusItem>
            <StatusItem label="Number Prize %">{`${contractStatus.numberHitPercentage}%`}</StatusItem>
            <StatusItem label="Animal Prize %">{`${contractStatus.animalHitPercentage}%`}</StatusItem>
            <StatusItem label="DApp Fee %">{`${contractStatus.dappFeePercentage}%`}</StatusItem>
            <div className='full-width'>
                <StatusItem label="Active Sequence Number (Pyth)">{contractStatus.activeSequenceNumber === '0' ? 'None' : contractStatus.activeSequenceNumber}</StatusItem>
            </div>
            <div className='full-width'>
                <StatusItem label="Fee Wallet">{contractStatus.dappWallet}</StatusItem>
            </div>
        </div>
    );

    const renderManagementContent = () => (
        <>
            <ActionSection title="Raffle Actions">
                {contractStatus?.isRandomNumberFulfilled ? (
                    <button className="primary" onClick={() => handleAction('processDraw')}>Process Raffle</button>
                ) : (
                    <button className="primary" onClick={handleTriggerDraw} disabled={contractStatus?.activeSequenceNumber !== '0'}>Start Raffle</button>
                )}
            </ActionSection>
            <ActionSection title="Add Bonus to Pot" description="Add an extra incentive for the next raffle. The amount will be added to the betting pot.">
                <input id="bonusAmountInput" type="text" placeholder="Ex: 10.5 MON" />
                <button onClick={handleAddBonus}>Add Bonus</button>
            </ActionSection>
             <ActionSection title="Emergency Actions" description="Use with caution.">
                 <button className="danger" onClick={() => handleAction('refundAllBets')}>Refund Current Raffle</button>
                 <input id="sequenceNumberInput" type="text" placeholder="Sequence Number of failed raffle" style={{marginTop: '1rem'}} />
                 <button className="danger" onClick={() => {
                     const seqNum = document.getElementById('sequenceNumberInput').value;
                     if (seqNum) handleAction('cancelFailedDraw', [seqNum]);
                 }}>Cancel Failed Raffle</button>
             </ActionSection>
        </>
    );

    const renderSettingsContent = () => (
        <>
            <ActionSection title="Changes are only allowed here when there are no bets" description="It's good practice to pause the raffle before making changes.">
            </ActionSection>
            <ActionSection title="Bet Price" description="Set the cost of each selection (in MON).">
                 <input id="newPriceInput" type="text" placeholder={`Current: ${contractStatus?.betPrice || '0'} MON`} />
                 <button onClick={() => {
                     const newPrice = document.getElementById('newPriceInput').value;
                     if (newPrice) handleAction('setBetPrice', [parseEther(newPrice)]);
                 }}>Save Price</button>
            </ActionSection>
            <ActionSection title="Maximum Bets per Raffle" description="Maximum number of bets (numbers + animals) that a player can make per raffle.">
                 <input id="maxBetsInput" type="number" placeholder={`Current: ${contractStatus?.maxBetsPerDraw || '0'}`} />
                 <button onClick={() => {
                     const newLimit = document.getElementById('maxBetsInput').value;
                     if (newLimit) handleAction('setMaxBetsPerDraw', [newLimit]);
                 }}>Save Limit</button>
            </ActionSection>
            <ActionSection title="Prize and Fee Percentages" description="The sum of the three fields must be 100.">
                 <input id="numPercentInput" type="number" placeholder={`Number (${contractStatus?.numberHitPercentage || '0'}%)`} />
                 <input id="animalPercentInput" type="number" placeholder={`Animal (${contractStatus?.animalHitPercentage || '0'}%)`} />
                 <input id="dappFeePercentInput" type="number" placeholder={`DApp Fee (${contractStatus?.dappFeePercentage || '0'}%)`} />
                 <button onClick={() => {
                     const num = document.getElementById('numPercentInput').value;
                     const animal = document.getElementById('animalPercentInput').value;
                     const dappFee = document.getElementById('dappFeePercentInput').value;
                     if (num && animal && dappFee) handleAction('setPercentages', [num, animal, dappFee]);
                 }}>Save Percentages</button>
            </ActionSection>
            <ActionSection title="DApp Fee Wallet" description="Address that receives the maintenance fee. Only the Owner can change.">
                 <input id="newDappWalletInput" type="text" placeholder="New address 0x..." />
                 <button onClick={() => {
                     const newWallet = document.getElementById('newDappWalletInput').value;
                     if (newWallet) handleAction('setDappWallet', [newWallet]);
                 }}>Save Wallet</button>
            </ActionSection>
             <ActionSection title="Game Control">
                {contractStatus && !contractStatus.isPaused ? (
                    <button onClick={() => handleAction('pause')}>Pause Game</button>
                ) : (
                    <button className="warning" onClick={() => handleAction('unpause')}>Unpause Game</button>
                )}
            </ActionSection>
        </>
    );

    const renderAdminsContent = () => (
        <>
            <ActionSection title="Add New Administrator">
                 <input id="newAdminAddress" type="text" placeholder="Address 0x..." />
                 <button onClick={() => {
                     const newAdmin = document.getElementById('newAdminAddress').value;
                     if (newAdmin) handleAction('addAdmin', [newAdmin]);
                 }}>Add Admin</button>
            </ActionSection>
            <ActionSection title="Remove Administrator">
                 <input id="removeAdminAddress" type="text" placeholder="Address 0x..." />
                 <button className="danger" onClick={() => {
                     const adminToRemove = document.getElementById('removeAdminAddress').value;
                     if (adminToRemove) handleAction('removeAdmin', [adminToRemove]);
                 }}>Remove Admin</button>
            </ActionSection>
        </>
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content admin-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Administrator Panel</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="modal-body">
                    {renderTabs()}
                    <div className="tab-content">
                        {!contractStatus ? (
                            <p>Loading...</p>
                        ) : (
                            <>
                                {activeTab === 'status' && renderStatusContent()}
                                {activeTab === 'management' && renderManagementContent()}
                                {activeTab === 'settings' && renderSettingsContent()}
                                {activeTab === 'admins' && renderAdminsContent()}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminModal;
