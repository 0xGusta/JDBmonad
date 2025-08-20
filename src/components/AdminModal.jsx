import React, { useState, useEffect } from 'react';
import { parseEther, formatEther } from "ethers";
import { CONTRACT_ADDRESS } from '../contractInfo';
import { monadTestnet } from '../monadChain';

const AdminModal = ({ isOpen, onClose, contract, readOnlyContract, provider, sendTransaction, gameWalletAddress, addNotification, onSuccess }) => {
    const [contractStatus, setContractStatus] = useState(null);

    const fetchContractStatus = async () => {
        const contractReader = contract || readOnlyContract;
        if (!contractReader) return;

        try {
            const status = await contractReader.getFullStatus();
            setContractStatus({
                isPaused: status.isPaused,
                statusString: status.statusString,
                nextDrawId: status.nextDrawId.toString(),
                activeSequenceNumber: status.activeSequenceNumber.toString(),
                currentPot: formatEther(status.currentPot),
                betPrice: formatEther(status.betPrice),
                isRandomNumberFulfilled: status.isRandomNumberFulfilled,
            });
        } catch (error) {
            console.error("Erro ao buscar status do contrato:", error);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchContractStatus();
            const intervalId = setInterval(fetchContractStatus, 2000);
            return () => clearInterval(intervalId);
        }
    }, [isOpen, contract, readOnlyContract]);

    if (!isOpen) {
        return null;
    }

    const handleAction = async (action, args = [], txValue = '0x0') => {
        if (!contract || !provider || !sendTransaction || !gameWalletAddress) {
            return addNotification("Componentes de transação não estão prontos.", 'error');
        }

        try {
            addNotification(`Enviando transação para "${action}"...`, 'info');
            
            const data = contract.interface.encodeFunctionData(action, args);
            const { hash } = await sendTransaction(
                { to: CONTRACT_ADDRESS, data, value: txValue, chainId: monadTestnet.id },
                { address: gameWalletAddress }
            );

            addNotification("Transação enviada. O status será atualizado em breve.", 'info');

            provider.waitForTransaction(hash).then(() => {
                addNotification(`Transação para "${action}" foi confirmada!`, 'success');
                if (onSuccess) onSuccess();
                fetchContractStatus();
            });

        } catch (error) {
            console.error(`Erro ao executar ${action}:`, error);
            const errorMessage = error.reason || (error.data ? error.data.message : error.message) || "Erro desconhecido.";
            addNotification(`Falha: ${errorMessage}`, 'error');
        }
    };

    const handleTriggerDraw = async () => {
        if (!contract) { return addNotification("Contrato não está pronto.", 'error'); }
        addNotification("Buscando taxa da Pyth...", 'info');
        try {
            const pythFee = await contract.getPythFee();
            const feeInHex = '0x' + pythFee.toString(16);
            addNotification(`Taxa da Pyth encontrada. Iniciando sorteio...`, 'info');
            await handleAction('triggerDraw', [], feeInHex);
        } catch (error) {
            console.error("Erro ao realizar sorteio:", error);
            const errorMessage = error.reason || (error.data ? error.data.message : error.message);
            addNotification(`Falha ao realizar sorteio: ${errorMessage}`, 'error');
        }
    };

    const renderDrawButtons = () => {
        if (!contractStatus) return null;

        if (contractStatus.isRandomNumberFulfilled) {
            return (
                <button className="primary" onClick={() => handleAction('processDraw')}>
                    Processar Sorteio
                </button>
            );
        }
        

            return (
                <button className="primary" onClick={handleTriggerDraw}>
                    Realizar Sorteio
                </button>
            );
        

        return null;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Painel de Administrador</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="modal-body">
                    <div className="status-dashboard">
                        <h3>Status Atual do Contrato</h3>
                        {contractStatus ? (
                            <div className="status-grid">
                                <div className="status-item">
                                    <strong>Status:</strong> <span className={`status-${contractStatus.statusString.replace(/\s+/g, '-').toLowerCase()}`}>{contractStatus.statusString}</span>
                                </div>
                                <div className="status-item">
                                    <strong>Próximo Sorteio Nº:</strong> {contractStatus.nextDrawId}
                                </div>
                                <div className="status-item">
                                    <strong>Prêmio Acumulado:</strong> {parseFloat(contractStatus.currentPot).toFixed(4)} MON
                                </div>
                                <div className="status-item">
                                    <strong>Preço da Aposta:</strong> {parseFloat(contractStatus.betPrice).toFixed(4)} MON
                                </div>
                                <div className="status-item full-width">
                                    <strong>Sequence Number Ativo:</strong> 
                                    <span> {contractStatus.activeSequenceNumber === '0' ? 'Nenhum' : contractStatus.activeSequenceNumber} </span>
                                    <small>(ID do sorteio pendente)</small>
                                </div>
                            </div>
                        ) : (
                            <p>Carregando status...</p>
                        )}
                         <button onClick={fetchContractStatus}>
                             Atualizar Status
                         </button>
                    </div>
                    
                    <hr />
                    <h3>Configurações Gerais</h3>
                     <div className="admin-action">
                         <h4>Mudar Preço da Aposta (em MON)</h4>
                         <input id="newPriceInput" type="text" placeholder="Ex: 0.02" />
                         <button onClick={() => {
                             const priceValue = document.getElementById('newPriceInput').value;
                             if (priceValue) handleAction('setBetPrice', [parseEther(priceValue)]);
                         }}>Salvar Preço</button>
                     </div>
                     <div className="admin-action">
                         <h4>Mudar Percentuais (Número/Animal)</h4>
                         <input id="numPercentInput" type="number" placeholder="Prêmio do Número (Ex: 70)" />
                         <input id="animalPercentInput" type="number" placeholder="Prêmio do Animal (Ex: 30)" />
                         <button onClick={() => {
                             const numPercent = document.getElementById('numPercentInput').value;
                             const animalPercent = document.getElementById('animalPercentInput').value;
                             if (numPercent && animalPercent) handleAction('setPercentages', [numPercent, animalPercent]);
                         }}>Salvar Percentuais</button>
                     </div>

                    <hr />
                    <h3>Gerenciamento de Jogo</h3>
                     <div className="admin-action">
                        <h4>Ações da Rodada</h4>
                        {renderDrawButtons()}
                        {contractStatus && !contractStatus.isPaused ? (
                            <button onClick={() => handleAction('pause')}>Pausar Jogo</button>
                        ) : (
                            <button className="warning" onClick={() => handleAction('unpause')}>Despausar Jogo</button>
                        )}
                    </div>
                    
                    <hr />
                    <h3>Gerenciar Admins</h3>
                     <div className="admin-action">
                          <h4>Adicionar Novo Administrador</h4>
                         <input id="newAdminAddress" type="text" placeholder="Endereço 0x..." />
                         <button onClick={() => {
                             const newAdmin = document.getElementById('newAdminAddress').value;
                             if (newAdmin) handleAction('addAdmin', [newAdmin]);
                         }}>Adicionar Admin</button>
                     </div>
                     <div className="admin-action">
                         <h4>Remover Administrador</h4>
                         <input id="removeAdminAddress" type="text" placeholder="Endereço 0x..." />
                         <button onClick={() => {
                             const adminToRemove = document.getElementById('removeAdminAddress').value;
                             if (adminToRemove) handleAction('removeAdmin', [adminToRemove]);
                         }}>Remover Admin</button>
                     </div>
                    
                    <hr />
                    <h3>Ações de Emergência (Zona de Perigo)</h3>
                     <div className="admin-action">
                         <h4>Reembolsar Rodada Atual</h4>
                         <p>Use se precisar cancelar a rodada atual e devolver o dinheiro das apostas.</p>
                         <button className="danger" onClick={() => handleAction('refundAllBets')}>Reembolsar Rodada</button>
                     </div>
                      <div className="admin-action">
                         <h4>Cancelar Sorteio Falho</h4>
                         <p>Use se o status do jogo for "Falha no Oráculo". Requer o Sequence Number.</p>
                         <input id="sequenceNumberInput" type="text" placeholder="Sequence Number do sorteio" />
                         <button className="danger" onClick={() => {
                             const seqNum = document.getElementById('sequenceNumberInput').value;
                             if (seqNum) handleAction('cancelFailedDraw', [seqNum]);
                         }}>Cancelar Sorteio</button>
                     </div>
                </div>
            </div>
        </div>
    );
};

export default AdminModal;