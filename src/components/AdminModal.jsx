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
            console.error("Erro ao buscar status do contrato:", error);
            if (isInitialLoad) {
               addNotification("Não foi possível carregar o status do contrato.", "error");
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
            addNotification("Carteira não está pronta para transações.", 'error');
            return;
        }

        try {
            await sendTransaction(
                { to: CONTRACT_ADDRESS, data: contract.interface.encodeFunctionData(action, args), value: txValue, chainId: monadTestnet.id },
                { address: gameWalletAddress }
            );

            addNotification(`Ação "${action}" bem-sucedida!`, 'success');
            if (onSuccess) onSuccess();
            fetchContractStatus(true);

        } catch (error) {
            console.error(`Erro ao executar ${action}:`, error);
            const errorMessage = error.reason || error.message || "Erro desconhecido.";
            if (!errorMessage.includes('User rejected')) {
                addNotification(`Falha na ação: ${errorMessage}`, 'error');
            }
        }
    };

    const handleTriggerDraw = async () => {
        if (!contract) return addNotification("Contrato não está pronto.", 'error');
        try {
            const pythFee = await contract.getPythFee();
            const feeInHex = '0x' + pythFee.toString(16);
            await handleAction('triggerDraw', [], feeInHex);
        } catch (error) {
            addNotification(`Falha ao buscar taxa da Pyth: ${error.message}`, 'error');
        }
    };

    const handleAddBonus = () => {
        const amount = document.getElementById('bonusAmountInput').value;
        if (!amount || parseFloat(amount) <= 0) {
            addNotification("Por favor, insira um valor de bônus válido.", "error");
            return;
        }
        const valueAsHex = '0x' + parseEther(amount).toString(16);
        handleAction('addBonusToPot', [], valueAsHex);
    };

    const renderTabs = () => (
        <div className="tabs">
            <button className={activeTab === 'status' ? 'active' : ''} onClick={() => setActiveTab('status')}>Status</button>
            <button className={activeTab === 'management' ? 'active' : ''} onClick={() => setActiveTab('management')}>Rodada</button>
            <button className={activeTab === 'settings' ? 'active' : ''} onClick={() => setActiveTab('settings')}>Configurações</button>
            <button className={activeTab === 'admins' ? 'active' : ''} onClick={() => setActiveTab('admins')}>Admins</button>
        </div>
    );
    
    const renderStatusContent = () => (
        <div className="status-grid">
            <StatusItem label="Status">{contractStatus.statusString}</StatusItem>
            <StatusItem label="Pausado">{contractStatus.isPaused ? 'Sim' : 'Não'}</StatusItem>
            <StatusItem label="Próximo Sorteio">{`#${contractStatus.nextDrawId}`}</StatusItem>
            <StatusItem label="Pote da Rodada">{`${parseFloat(contractStatus.currentPot).toFixed(4)} MON`}</StatusItem>
            <StatusItem label="Pote Bônus">{`${parseFloat(contractStatus.bonusPot).toFixed(4)} MON`}</StatusItem>
            <StatusItem label="Preço da Aposta">{`${parseFloat(contractStatus.betPrice).toFixed(4)} MON`}</StatusItem>
            <StatusItem label="Apostas Máx.">{contractStatus.maxBetsPerDraw}</StatusItem>
            <StatusItem label="Pyth OK">{contractStatus.isRandomNumberFulfilled ? 'Sim' : 'Não'}</StatusItem>
            <StatusItem label="% Prêmio Número">{`${contractStatus.numberHitPercentage}%`}</StatusItem>
            <StatusItem label="% Prêmio Animal">{`${contractStatus.animalHitPercentage}%`}</StatusItem>
            {/* NOVO: Exibe a porcentagem da taxa do DApp */}
            <StatusItem label="% Taxa DApp">{`${contractStatus.dappFeePercentage}%`}</StatusItem>
            <div className='full-width'>
                <StatusItem label="Sequence Number Ativo (Pyth)">{contractStatus.activeSequenceNumber === '0' ? 'Nenhum' : contractStatus.activeSequenceNumber}</StatusItem>
            </div>
             {/* NOVO: Exibe a carteira do DApp */}
            <div className='full-width'>
                <StatusItem label="Carteira da Taxa">{contractStatus.dappWallet}</StatusItem>
            </div>
        </div>
    );

    const renderManagementContent = () => (
        <>
            <ActionSection title="Ações da Rodada">
                {contractStatus?.isRandomNumberFulfilled ? (
                    <button className="primary" onClick={() => handleAction('processDraw')}>Processar Sorteio</button>
                ) : (
                    <button className="primary" onClick={handleTriggerDraw} disabled={contractStatus?.activeSequenceNumber !== '0'}>Iniciar Sorteio</button>
                )}
            </ActionSection>
            <ActionSection title="Adicionar Bônus ao Pote" description="Adicione um incentivo extra para o próximo sorteio. O valor será somado ao pote de apostas.">
                <input id="bonusAmountInput" type="text" placeholder="Ex: 10.5 MON" />
                <button onClick={handleAddBonus}>Adicionar Bônus</button>
            </ActionSection>
             <ActionSection title="Ações de Emergência" description="Use com cuidado.">
                 <button className="danger" onClick={() => handleAction('refundAllBets')}>Reembolsar Rodada Atual</button>
                 <input id="sequenceNumberInput" type="text" placeholder="Sequence Number do sorteio falho" style={{marginTop: '1rem'}} />
                 <button className="danger" onClick={() => {
                     const seqNum = document.getElementById('sequenceNumberInput').value;
                     if (seqNum) handleAction('cancelFailedDraw', [seqNum]);
                 }}>Cancelar Sorteio Falho</button>
             </ActionSection>
        </>
    );

    const renderSettingsContent = () => (
        <>
            <ActionSection title="Só são permitidas mudanças aqui quando não ha nenhuma aposta" description="É uma boa prática pausar o sorteio antes de fazer alterações.">
            </ActionSection>
            <ActionSection title="Preço da Aposta" description="Defina o custo de cada seleção (em MON).">
                 <input id="newPriceInput" type="text" placeholder={`Atual: ${contractStatus?.betPrice || '0'} MON`} />
                 <button onClick={() => {
                     const newPrice = document.getElementById('newPriceInput').value;
                     if (newPrice) handleAction('setBetPrice', [parseEther(newPrice)]);
                 }}>Salvar Preço</button>
            </ActionSection>
            <ActionSection title="Limite de Apostas por Sorteio" description="Número máximo de apostas (números + animais) que um jogador pode fazer por rodada.">
                 <input id="maxBetsInput" type="number" placeholder={`Atual: ${contractStatus?.maxBetsPerDraw || '0'}`} />
                 <button onClick={() => {
                     const newLimit = document.getElementById('maxBetsInput').value;
                     if (newLimit) handleAction('setMaxBetsPerDraw', [newLimit]);
                 }}>Salvar Limite</button>
            </ActionSection>
            {/* ALTERADO: Seção de percentuais agora inclui a taxa do DApp */}
            <ActionSection title="Percentuais de Prêmio e Taxa" description="A soma dos três campos deve ser 100.">
                 <input id="numPercentInput" type="number" placeholder={`Número (${contractStatus?.numberHitPercentage || '0'}%)`} />
                 <input id="animalPercentInput" type="number" placeholder={`Animal (${contractStatus?.animalHitPercentage || '0'}%)`} />
                 <input id="dappFeePercentInput" type="number" placeholder={`Taxa DApp (${contractStatus?.dappFeePercentage || '0'}%)`} />
                 <button onClick={() => {
                     const num = document.getElementById('numPercentInput').value;
                     const animal = document.getElementById('animalPercentInput').value;
                     const dappFee = document.getElementById('dappFeePercentInput').value;
                     if (num && animal && dappFee) handleAction('setPercentages', [num, animal, dappFee]);
                 }}>Salvar Percentuais</button>
            </ActionSection>
            {/* NOVO: Seção para alterar a carteira da taxa */}
            <ActionSection title="Carteira da Taxa DApp" description="Endereço que recebe a taxa de manutenção. Apenas o Dono pode alterar.">
                 <input id="newDappWalletInput" type="text" placeholder="Novo endereço 0x..." />
                 <button onClick={() => {
                     const newWallet = document.getElementById('newDappWalletInput').value;
                     if (newWallet) handleAction('setDappWallet', [newWallet]);
                 }}>Salvar Carteira</button>
            </ActionSection>
             <ActionSection title="Controle do Jogo">
                {contractStatus && !contractStatus.isPaused ? (
                    <button onClick={() => handleAction('pause')}>Pausar Jogo</button>
                ) : (
                    <button className="warning" onClick={() => handleAction('unpause')}>Despausar Jogo</button>
                )}
            </ActionSection>
        </>
    );

    const renderAdminsContent = () => (
        <>
            <ActionSection title="Adicionar Novo Administrador">
                 <input id="newAdminAddress" type="text" placeholder="Endereço 0x..." />
                 <button onClick={() => {
                     const newAdmin = document.getElementById('newAdminAddress').value;
                     if (newAdmin) handleAction('addAdmin', [newAdmin]);
                 }}>Adicionar Admin</button>
            </ActionSection>
            <ActionSection title="Remover Administrador">
                 <input id="removeAdminAddress" type="text" placeholder="Endereço 0x..." />
                 <button className="danger" onClick={() => {
                     const adminToRemove = document.getElementById('removeAdminAddress').value;
                     if (adminToRemove) handleAction('removeAdmin', [adminToRemove]);
                 }}>Remover Admin</button>
            </ActionSection>
        </>
    );

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content admin-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Painel de Administrador</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="modal-body">
                    {renderTabs()}
                    <div className="tab-content">
                        {!contractStatus ? (
                            <p>Carregando...</p>
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
