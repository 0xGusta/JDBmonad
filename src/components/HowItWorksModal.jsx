import React from 'react';

const HowItWorksModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content how-it-works-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Como o Sorteio Funciona?</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="modal-body">
                    <p>
                        Nosso jogo de sorteio é construído para ser <strong>justo, transparente e 100% na blockchain</strong>. 
                        Aqui está o passo a passo de como tudo acontece:
                    </p>

                    <div className="step">
                        <h3>1. A Fase de Apostas</h3>
                        <p>
                            Você escolhe seus números (0-95) e/ou seus animais preferidos. Cada seleção tem um custo fixo em MON. Todas as apostas de uma rodada são reunidas em um grande "pote" de prêmios.
                        </p>
                    </div>

                    <div className="step">
                        <h3>2. O Sorteio com Pyth Network</h3>
                        <p>
                            Para garantir que o número vencedor seja verdadeiramente aleatório e imprevisível, usamos um serviço de oráculo chamado <strong>Pyth Network</strong>.
                        </p>
                        <ul>
                            <li>Quando o sorteio é iniciado, nosso smart contract faz uma requisição à Pyth.</li>
                            <li>A Pyth gera um número aleatório completamente fora da nossa blockchain (off-chain), tornando-o impossível de ser manipulado ou previsto.</li>
                            <li>Esse número (um `bytes32` gigante) é enviado de volta para o nosso smart contract de forma segura.</li>
                        </ul>
                         <div className="logo-container">
                           <img src="/images/pyth.svg" alt="Pyth Network Logo" />
                        </div>
                    </div>

                    <div className="step">
                        <h3>3. O Cálculo do Vencedor</h3>
                        <p>
                            O smart contract pega o número aleatório recebido da Pyth e aplica uma operação matemática simples e pública chamada <strong>módulo (`%`)</strong>.
                        </p>
                        <div className="code-block-explanation">
                           <span>Número Vencedor = (Número da Pyth) % 96</span>
                        </div>
                        <p>
                            Essa operação garante que o resultado seja sempre um número entre 0 e 95. Como o número da Pyth é imprevisível, o resultado também é. Você pode verificar esse cálculo no histórico de cada sorteio!
                        </p>
                    </div>

                    <div className="step">
                        <h3>4. Distribuição dos Prêmios</h3>
                        <p>
                           O pote é dividido entre os acertadores do número e do animal, de acordo com os percentuais definidos. Se ninguém acertar, o valor acumula para o próximo sorteio. Todos os prêmios são enviados para uma área de saque onde você pode retirá-los a qualquer momento.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HowItWorksModal;