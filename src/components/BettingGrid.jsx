import React, { useState } from 'react';
import { parseEther } from "ethers";

const animals = [
    { name: "Monlandak", numbers: [0, 1, 2, 3, 4, 5], img: "/images/placeholder.png" },
    { name: "Chog", numbers: [6, 7, 8, 9, 10, 11], img: "/images/placeholder.png" },
    { name: "Moyaki", numbers: [12, 13, 14, 15, 16, 17], img: "/images/placeholder.png" },
    { name: "Mouch", numbers: [18, 19, 20, 21, 22, 23], img: "/images/placeholder.png" },
    { name: "Salmonad", numbers: [24, 25, 26, 27, 28, 29], img: "/images/placeholder.png" },
    { name: "Moncock", numbers: [30, 31, 32, 33, 34, 35], img: "/images/placeholder.png" },
    { name: "Snelly", numbers: [36, 37, 38, 39, 40, 41], img: "/images/placeholder.png" },
    { name: "Salandak", numbers: [42, 43, 44, 45, 46, 47], img: "/images/placeholder.png" },
    { name: "Honk", numbers: [48, 49, 50, 51, 52, 53], img: "/images/placeholder.png" },
    { name: "Mokadel", numbers: [54, 55, 56, 57, 58, 59], img: "/images/placeholder.png" },
    { name: "Lyraffe", numbers: [60, 61, 62, 63, 64, 65], img: "/images/placeholder.png" },
    { name: "Spidermon", numbers: [66, 67, 68, 69, 70, 71], img: "/images/placeholder.png" },
    { name: "Montiger", numbers: [72, 73, 74, 75, 76, 77], img: "/images/placeholder.png" },
    { name: "Moxy", numbers: [78, 79, 80, 81, 82, 83], img: "/images/placeholder.png" },
    { name: "Birbie", numbers: [84, 85, 86, 87, 88, 89], img: "/images/placeholder.png" },
    { name: "MonCoringa", numbers: [90, 91, 92, 93, 94, 95], img: "/images/placeholder.png" },
];


const BettingGrid = ({ betPrice, onPlaceBet, isAuthenticated, addNotification, walletBalance }) => {
    const [selectedNumbers, setSelectedNumbers] = useState(new Set());
    const [selectedAnimals, setSelectedAnimals] = useState(new Set());

    const toggleNumber = (num) => {
        const newSelection = new Set(selectedNumbers);
        if (newSelection.has(num)) newSelection.delete(num);
        else newSelection.add(num);
        setSelectedNumbers(newSelection);
    };

    const toggleAnimal = (animalName) => {
        const newSelection = new Set(selectedAnimals);
        if (newSelection.has(animalName)) newSelection.delete(animalName);
        else newSelection.add(animalName);
        setSelectedAnimals(newSelection);
    };

    const handleBet = () => {
        if (!isAuthenticated) {
            onPlaceBet([], []);
            return;
        }
        if (selectedNumbers.size === 0 && selectedAnimals.size === 0) {
            addNotification("Selecione números ou animais para apostar.", 'error');
            return;
        }
        onPlaceBet(Array.from(selectedNumbers), Array.from(selectedAnimals));
    };

    const totalSelections = selectedNumbers.size + selectedAnimals.size;
    const totalCost = totalSelections * parseFloat(betPrice);
    const hasSufficientBalance = isAuthenticated ? parseEther(walletBalance || '0') >= parseEther(totalCost.toString()) : false;

    return (
        <div className="card game-card">
            <h2 style={{textAlign: 'center', marginBottom: '0.5rem'}}>Faça sua Aposta</h2>
            <p style={{textAlign: 'center', color: 'var(--text-secondary-color)'}}>Preço por seleção: <strong>{betPrice} MON</strong></p>

            <div className="betting-grid">
                {animals.map(animal => (
                    <div className={`animal-card ${selectedAnimals.has(animal.name) ? 'selected-animal' : ''}`} key={animal.name}>
                        <img
                            src={animal.img}
                            alt={animal.name}
                            className="animal-image"
                            onClick={() => toggleAnimal(animal.name)}
                        />
                        <h3 className="animal-name">{animal.name}</h3>
                        <div className="number-grid">
                            {animal.numbers.map(num => (
                                <button
                                    key={num}
                                    className={`number-item ${selectedNumbers.has(num) ? 'selected' : ''}`}
                                    onClick={() => toggleNumber(num)}
                                >
                                    {String(num).padStart(2, '0')}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bet-summary">
                <p>Seleções: <strong>{totalSelections}</strong></p>
                <p>Custo Total: <strong>{totalCost.toFixed(2)} MON</strong></p>
                <p>Saldo: <strong>{Number(walletBalance).toFixed(2)} MON</strong></p>
            </div>

            {!hasSufficientBalance && isAuthenticated && totalCost > 0 && (
                <p style={{color: 'var(--danger-color)', textAlign: 'center', fontWeight: 'bold'}}>Saldo insuficiente.</p>
            )}

            <button className="bet-button" onClick={handleBet} disabled={isAuthenticated && (!hasSufficientBalance || totalSelections === 0)}>
                {isAuthenticated ? `Apostar Agora` : 'Conectar Carteira para Apostar'}
            </button>
        </div>
    );
};

export default BettingGrid;