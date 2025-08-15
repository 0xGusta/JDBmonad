import React from 'react';
import { parseEther } from "ethers";
import { CONTRACT_ADDRESS } from '../contractInfo';
import { monadTestnet } from '../monadChain';

const AdminModal = ({ isOpen, onClose, contract, provider, sendTransaction, gameWalletAddress }) => {
    if (!isOpen) return null;

    const handleAction = async (action, ...args) => {
        if (!contract || !provider || !sendTransaction || !gameWalletAddress) {
            return alert("Componentes de transação não estão prontos.");
        }
        
        const finalArgs = args.filter(arg => arg !== null && arg !== undefined && arg !== '');
        
        try {
            const data = contract.interface.encodeFunctionData(action, finalArgs);
            
            alert(`Enviando transação para "${action}"...`);
            
            const { hash } = await sendTransaction(
                {
                    to: CONTRACT_ADDRESS,
                    data: data,
                    value: '0x0',
                    chainId: monadTestnet.id,
                },
                { address: gameWalletAddress }
            );

            await provider.waitForTransaction(hash);
            alert(`Ação "${action}" executada com sucesso!`);
            onClose();
        } catch (error) {
            console.error(`Erro ao executar ${action}:`, error);
            alert(`Falha: ${error.reason || error.message}`);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Painel de Administrador</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="modal-body">
                    <div className="admin-action">
                        <h4>Mudar Preço da Aposta (em MON)</h4>
                        <input id="newPriceInput" type="text" placeholder="Ex: 0.02" />
                        <button onClick={() => {
                            const priceValue = document.getElementById('newPriceInput').value;
                            if (priceValue) handleAction('setBetPrice', parseEther(priceValue));
                        }}>Salvar Preço</button>
                    </div>
                    <div className="admin-action">
                        <h4>Mudar Percentuais (Número/Animal)</h4>
                        <input id="numPercentInput" type="number" placeholder="Prêmio do Número (Ex: 70)" />
                        <input id="animalPercentInput" type="number" placeholder="Prêmio do Animal (Ex: 30)" />
                        <button onClick={() => {
                            const numPercent = document.getElementById('numPercentInput').value;
                            const animalPercent = document.getElementById('animalPercentInput').value;
                            if (numPercent && animalPercent) handleAction('setPercentages', numPercent, animalPercent);
                        }}>Salvar Percentuais</button>
                    </div>
                     <div className="admin-action">
                        <h4>Gerenciar Jogo</h4>
                        <button className="primary" onClick={() => handleAction('triggerDraw')}>Realizar Sorteio</button>
                        <button onClick={() => handleAction('togglePause')}>Pausar / Despausar Jogo</button>
                        <button className="danger" onClick={() => handleAction('refundAllBets')}>Reembolsar Rodada</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminModal;