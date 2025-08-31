import React from 'react';

const HowItWorksModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content how-it-works-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>How Does the Raffle Work?</h2>
                    <button onClick={onClose} className="close-button">&times;</button>
                </div>
                <div className="modal-body">
                    <p>
                        Our raffle game is built to be <strong>fair, transparent and 100% on the blockchain</strong>. 
                        Here's the step-by-step of how everything happens:
                    </p>

                    <div className="step">
                        <h3>1. The Betting Phase</h3>
                        <p>
                            You choose your numbers (0-95) and/or your preferred animals. Each selection has a fixed cost in MON. All bets from one round are gathered in a large prize "pot".
                        </p>
                    </div>

                    <div className="step">
                        <h3>2. The Raffle with Pyth Network</h3>
                        <p>
                            To ensure that the winning number is truly random and unpredictable, we use an oracle service called <strong>Pyth Network</strong>.
                        </p>
                        <ul>
                            <li>When the raffle is initiated, our smart contract makes a request to Pyth.</li>
                            <li>Pyth generates a random number completely outside our blockchain (off-chain), making it impossible to be manipulated or predicted.</li>
                            <li>This number (a huge `bytes32`) is sent back to our smart contract securely.</li>
                        </ul>
                         <div className="logo-container">
                           <img src="/images/pyth.svg" alt="Pyth Network Logo" />
                        </div>
                    </div>

                    <div className="step">
                        <h3>3. The Winner Calculation</h3>
                        <p>
                            The smart contract takes the random number received from Pyth and applies a simple and public mathematical operation called <strong>modulo (`%`)</strong>.
                        </p>
                        <div className="code-block-explanation">
                           <span>Winning Number = (Pyth Number) % 96</span>
                        </div>
                        <p>
                            This operation ensures that the result is always a number between 0 and 95. Since the Pyth number is unpredictable, the result is also. You can verify this calculation in the history of each raffle!
                        </p>
                    </div>

                    <div className="step">
                        <h3>4. Prize Distribution</h3>
                        <p>
                           The pot is divided among those who guessed the number and the animal, according to the defined percentages. If no one guesses, the value accumulates for the next raffle. All prizes are sent to a withdrawal area where you can withdraw them at any time.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HowItWorksModal;