import React, { useState } from 'react';
import { parseEther } from "ethers";
import { useLanguage } from "../App.jsx";

const animals = [
    { name: "Molandak", numbers: [0, 1, 2, 3, 4, 5], img: "/images/molandak.jpg" },
    { name: "Chog", numbers: [6, 7, 8, 9, 10, 11], img: "/images/chog.jpg" },
    { name: "Moyaki", numbers: [12, 13, 14, 15, 16, 17], img: "/images/moyaki.jpg" },
    { name: "Mouch", numbers: [18, 19, 20, 21, 22, 23], img: "/images/mouch.jpg" },
    { name: "Salmonad", numbers: [24, 25, 26, 27, 28, 29], img: "/images/salmonad.jpg" },
    { name: "Moncock", numbers: [30, 31, 32, 33, 34, 35], img: "/images/moncock.jpg" },
    { name: "Snelly", numbers: [36, 37, 38, 39, 40, 41], img: "/images/snelly.jpg" },
    { name: "Salandak", numbers: [42, 43, 44, 45, 46, 47], img: "/images/salandak.jpg" },
    { name: "Honk", numbers: [48, 49, 50, 51, 52, 53], img: "/images/honk.jpg" },
    { name: "Mokadel", numbers: [54, 55, 56, 57, 58, 59], img: "/images/mokadel.jpg" },
    { name: "Lyraffe", numbers: [60, 61, 62, 63, 64, 65], img: "/images/lyraffe.jpg" },
    { name: "Spidermon", numbers: [66, 67, 68, 69, 70, 71], img: "/images/spidermon.jpg" },
    { name: "Montiger", numbers: [72, 73, 74, 75, 76, 77], img: "/images/montiger.jpg" },
    { name: "Moxy", numbers: [78, 79, 80, 81, 82, 83], img: "/images/moxy.jpg" },
    { name: "Birbie", numbers: [84, 85, 86, 87, 88, 89], img: "/images/birbie.jpg" },
    { name: "Monavara", numbers: [90, 91, 92, 93, 94, 95], img: "/images/monavara.jpg" },
];

const BettingGrid = ({
    betPrice,
    maxNumberBetsPerPlayer,
    maxAnimalBetsPerPlayer,
    numberBetsThisRound,
    animalBetsThisRound,
    playerBets,
    isGamePaused,
    disabled,
    onPlaceBet,
    isAuthenticated,
    addNotification,
    walletBalance
}) => {
    const { t } = useLanguage();
    const [selectedNumbers, setSelectedNumbers] = useState(new Set());
    const [selectedAnimals, setSelectedAnimals] = useState(new Set());
    const canSelectMoreNumbers = (numberBetsThisRound + selectedNumbers.size) < maxNumberBetsPerPlayer;
    const canSelectMoreAnimals = (animalBetsThisRound + selectedAnimals.size) < maxAnimalBetsPerPlayer;

    const toggleNumber = (num) => {
        if (playerBets.numbers.has(num)) {
            addNotification(t("betting_grid.already_bet_number"), "info");
            return;
        }
        const newSelection = new Set(selectedNumbers);
        if (newSelection.has(num)) {
            newSelection.delete(num);
        } else {

            if (!canSelectMoreNumbers) {
                addNotification(t("betting_grid.max_number_selection_error", { max: maxNumberBetsPerPlayer }), "error");
                return;
            }
            newSelection.add(num);
        }
        setSelectedNumbers(newSelection);
    };

    const toggleAnimal = (animalName) => {
        if (playerBets.animals.has(animalName)) {
            addNotification(t("betting_grid.already_bet_animal"), "info");
            return;
        }
        const newSelection = new Set(selectedAnimals);
        if (newSelection.has(animalName)) {
            newSelection.delete(animalName);
        } else {

            if (!canSelectMoreAnimals) {
                addNotification(t("betting_grid.max_animal_selection_error", { max: maxAnimalBetsPerPlayer }), "error");
                return;
            }
            newSelection.add(animalName);
        }
        setSelectedAnimals(newSelection);
    };

    const handleBet = async () => {
        if (!isAuthenticated) {
            onPlaceBet([], []);
            return;
        }
        if (selectedNumbers.size === 0 && selectedAnimals.size === 0) {
            addNotification(t("betting_grid.select_to_bet"), 'error');
            return;
        }
        const success = await onPlaceBet(Array.from(selectedNumbers), Array.from(selectedAnimals));
        if (success) {
            setSelectedNumbers(new Set());
            setSelectedAnimals(new Set());
        }
    };

    const totalSelections = selectedNumbers.size + selectedAnimals.size;
    const totalCost = totalSelections * parseFloat(betPrice);
    const totalCostString = totalCost > 0 ? totalCost.toFixed(18) : "0";
    const hasSufficientBalance = isAuthenticated ? parseEther(walletBalance || '0') >= parseEther(totalCostString) : false;

    const getClassName = (type, value) => {
        if (type === 'animal') {
            if (playerBets.animals.has(value)) return 'already-bet-animal';
            if (selectedAnimals.has(value)) return 'selected-animal';
        }
        if (type === 'number') {
            if (playerBets.numbers.has(value)) return 'already-bet';
            if (selectedNumbers.has(value)) return 'selected';
        }
        return '';
    };

    return (
        <div className="card game-card">
            <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>{t("betting_grid.title")}</h2>
            
            <p style={{ textAlign: 'center', color: 'var(--text-secondary-color)' }} dangerouslySetInnerHTML={{
                __html: t("betting_grid.price_limit", { 
                    betPrice: parseFloat(betPrice).toFixed(2), 
                    maxNumbers: maxNumberBetsPerPlayer,
                    maxAnimals: maxAnimalBetsPerPlayer
                })
            }} />

            <div className="betting-grid">
                {animals.map(animal => (
                    <div className={`animal-card ${getClassName('animal', animal.name)}`} key={animal.name}>
                        <img
                            src={animal.img}
                            alt={animal.name}
                            className="animal-image"
                            onClick={() => !isGamePaused && !disabled && toggleAnimal(animal.name)}
                        />
                        <h3 className="animal-name">{animal.name}</h3>
                        <div className="number-grid">
                            {animal.numbers.map(num => (
                                <button
                                    key={num}
                                    className={`number-item ${getClassName('number', num)}`}
                                    onClick={() => !disabled && toggleNumber(num)}
                                    disabled={isGamePaused || playerBets.numbers.has(num) || disabled}
                                >
                                    {String(num).padStart(2, '0')}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bet-summary">
                <p dangerouslySetInnerHTML={{ __html: t("betting_grid.number_selections", { 
                    current: numberBetsThisRound + selectedNumbers.size, 
                    max: maxNumberBetsPerPlayer 
                }) }} />
                <p dangerouslySetInnerHTML={{ __html: t("betting_grid.animal_selections", { 
                    current: animalBetsThisRound + selectedAnimals.size, 
                    max: maxAnimalBetsPerPlayer 
                }) }} />
                <p dangerouslySetInnerHTML={{
                    __html: t("betting_grid.cost", { totalCost: new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(totalCost) })
                }} />
            </div>

            {!hasSufficientBalance && isAuthenticated && totalCost > 0 && (
                <p style={{ color: 'var(--danger-color)', textAlign: 'center', fontWeight: 'bold' }}>
                    {t("betting_grid.insufficient_balance")}
                </p>
            )}

            <button
                className="bet-button"
                onClick={handleBet}
                disabled={isGamePaused || disabled || (isAuthenticated && (!hasSufficientBalance || totalSelections === 0))}
            >
                {isGamePaused
                    ? t("betting_grid.game_paused")
                    : isAuthenticated
                        ? t("betting_grid.button_place_bet")
                        : t("betting_grid.button_connect_wallet")}
            </button>
        </div>
    );
};

export default BettingGrid;