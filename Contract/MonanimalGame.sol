// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "https://github.com/pyth-network/pyth-crosschain/blob/main/target_chains/ethereum/entropy_sdk/solidity/IEntropy.sol";
import "https://github.com/pyth-network/pyth-crosschain/blob/main/target_chains/ethereum/entropy_sdk/solidity/IEntropyConsumer.sol";

contract MonanimalGame is IEntropyConsumer {

    struct Winner {
        address player;
        uint256 amountWon;
    }

    struct NumberBet {
        uint256 number;
        address[] players;
    }

    struct AnimalBet {
        string animal;
        address[] players;
    }

    struct PlayerBets {
        uint256[] numbers;
        string[] animals;
    }

    struct Draw {
        uint256 id;
        uint256 winningNumber;
        string winningAnimal;
        bytes32 pythRandomNumber;
        uint256 timestamp;
        uint256 totalPot;
        Winner[] numberWinners;
        Winner[] animalWinners;
        NumberBet[] numberBets;
        AnimalBet[] animalBets;
    }

    struct RefundSession {
        uint256 timestamp;
        address triggeredBy;
    }
    
    struct PendingDraw {
        uint256 totalPot;
        uint256 numberHitPot;
        uint256 animalHitPot;
        uint256 requestTimestamp;
        bool exists;
        bytes32 randomNumber;
        bool isFulfilled;
    }
    
    struct FullStatus {
        bool isPaused;
        string statusString;
        uint256 nextDrawId;
        uint64 activeSequenceNumber;
        uint256 pendingDrawTimestamp;
        uint256 currentPot;
        uint256 bonusPot;
        uint256 betPrice;
        uint256 maxNumberBetsPerPlayer;
        uint256 maxAnimalBetsPerPlayer;
        bool hasBetsPlaced;
        bool isRandomNumberFulfilled;
    }

    mapping(uint256 => address[]) public numberBetters;
    mapping(string => address[]) public animalBetters;
    uint256[] private bettedNumbers;
    string[] private bettedAnimals;
    mapping(address => uint256) public pendingWithdrawals;
    uint256 public totalPendingWithdrawals;

    mapping(address => PlayerBets) internal betsByPlayerInCurrentRound;

    mapping(address => uint256) public numberBetsPerPlayerInRound;
    mapping(address => uint256) public animalBetsPerPlayerInRound;
    mapping(address => mapping(uint256 => bool)) public playerHasBetOnNumberInRound;
    mapping(address => mapping(string => bool)) public playerHasBetOnAnimalInRound;


    address[] public currentRoundPlayers; 
    mapping(address => bool) public hasBetInCurrentRound; 
    address[] public allTimePlayers; 
    mapping(address => bool) public hasEverPlayed; 
    mapping(address => bool) public admins;
    Draw[] public drawHistory;
    RefundSession[] public refundHistory;
    uint256 public betPrice = 0.01 ether;

    uint256 public maxNumberBetsPerPlayer = 25;
    uint256 public maxAnimalBetsPerPlayer = 5;

    uint256 public bonusPot;
    address public dappWallet;
    uint256 public dappFeePercentage = 5;
    uint256 public numberHitPercentage = 65;
    uint256 public animalHitPercentage = 30;
    address public owner;
    uint256 public nextDrawId = 1;
    bool public isPaused = false;
    IEntropy internal constant entropyContract = IEntropy(0x36825bf3Fbdf5a29E2d5148bfe7Dcf7B5639e320);
    address internal constant pythProvider = 0x6CC14824Ea2918f5De5C2f75A9Da968ad4BD6344;
    address private constant INITIAL_DAPP_WALLET = 0x05c42Bc46cbB58975091aC5101D5b9a763181801;
    mapping(uint64 => PendingDraw) public pendingDraws;
    uint64 public activeSequenceNumber;
    uint256 private drawHistoryCounter;
    uint256 public constant MIN_CANCEL_WAIT_TIME = 10 minutes;
    uint256 private constant DRAW_HISTORY_SIZE = 5;

    event BetsPlaced(uint256 indexed drawId, address indexed player, uint256[] numbers, string[] animals);
    event DrawCompleted(uint256 indexed drawId, uint256 winningNumber, string winningAnimal);
    event PrizeWithdrawn(address indexed player, uint256 amount);
    event RefundSessionLogged(uint256 timestamp, address indexed admin);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event ContractPaused(bool isPaused);
    event BetPriceChanged(uint256 newPrice);

    event MaxNumberBetsChanged(uint256 newLimit);
    event MaxAnimalBetsChanged(uint256 newLimit);
    event PercentagesChanged(uint256 numberHit, uint256 animalHit, uint256 dappFee);
    event DappWalletChanged(address indexed newWallet);
    event RandomNumberRequested(uint64 indexed sequenceNumber, uint256 drawId);
    event RandomNumberFulfilled(uint64 indexed sequenceNumber, bytes32 randomNumber);
    event DrawCancelled(uint64 indexed sequenceNumber, address indexed admin);
    event DrawProcessed(uint64 indexed sequenceNumber, address indexed admin);
    event BonusAddedToPot(address indexed admin, uint256 amount);

    modifier onlyOwner() { require(msg.sender == owner, "Only owner."); _; }
    modifier onlyAdmin() { require(admins[msg.sender] || msg.sender == owner, "Only admins."); _; }
    modifier whenNotPaused() { require(!isPaused, "Contract is paused."); _; }
    modifier noDrawPending() { require(activeSequenceNumber == 0, "A draw is already in progress."); _; }

    constructor() {
        owner = msg.sender;
        admins[msg.sender] = true;
        dappWallet = INITIAL_DAPP_WALLET;
    }

    function placeBets(uint256[] memory _numbers, string[] memory _animalNames) public payable whenNotPaused noDrawPending {
        uint256 totalBets = _numbers.length + _animalNames.length;
        require(totalBets > 0, "No bets provided.");
        
        require(numberBetsPerPlayerInRound[msg.sender] + _numbers.length <= maxNumberBetsPerPlayer, "Exceeded maximum number bets.");
        require(animalBetsPerPlayerInRound[msg.sender] + _animalNames.length <= maxAnimalBetsPerPlayer, "Exceeded maximum animal bets.");

        require(msg.value == totalBets * betPrice, "Incorrect bet value.");

        numberBetsPerPlayerInRound[msg.sender] += _numbers.length;
        animalBetsPerPlayerInRound[msg.sender] += _animalNames.length;

        if (!hasEverPlayed[msg.sender]) {
            hasEverPlayed[msg.sender] = true;
            allTimePlayers.push(msg.sender);
        }

        if (!hasBetInCurrentRound[msg.sender]) {
            hasBetInCurrentRound[msg.sender] = true;
            currentRoundPlayers.push(msg.sender);
        }

        PlayerBets storage currentBets = betsByPlayerInCurrentRound[msg.sender];

        for (uint i = 0; i < _numbers.length; i++) {
            uint256 num = _numbers[i];
            require(num <= 95, "Invalid number.");
            
            require(!playerHasBetOnNumberInRound[msg.sender][num], "Number already bet in this round.");
            playerHasBetOnNumberInRound[msg.sender][num] = true;

            if (numberBetters[num].length == 0) bettedNumbers.push(num);
            numberBetters[num].push(msg.sender);
            
            currentBets.numbers.push(num);
        }
        for (uint i = 0; i < _animalNames.length; i++) {
            string memory animalName = _animalNames[i];
            require(bytes(animalName).length > 2, "Invalid animal name.");

            require(!playerHasBetOnAnimalInRound[msg.sender][animalName], "Animal already bet in this round.");
            playerHasBetOnAnimalInRound[msg.sender][animalName] = true;

            if (animalBetters[animalName].length == 0) bettedAnimals.push(animalName);
            animalBetters[animalName].push(msg.sender);
            
            currentBets.animals.push(animalName);
        }
        emit BetsPlaced(nextDrawId, msg.sender, _numbers, _animalNames);
    }
    
    function triggerDraw() public payable onlyAdmin whenNotPaused noDrawPending {
        uint256 currentRoundPotValue = (address(this).balance - msg.value - bonusPot) - totalPendingWithdrawals;
        require(currentRoundPotValue > 0, "Empty pot.");
        require(currentRoundPlayers.length > 0, "No players in the current round.");

        uint128 fee = entropyContract.getFee(pythProvider);
        require(msg.value == fee, "Incorrect fee amount sent to trigger the draw.");
        
        uint256 finalTotalPot = currentRoundPotValue + bonusPot;
        
        uint256 dappFeeAmount = (finalTotalPot * dappFeePercentage) / 100;
        if (dappFeeAmount > 0) {
            (bool success, ) = dappWallet.call{value: dappFeeAmount}("");
            require(success, "Failed to send DApp fee.");
        }

        uint256 potForPrizes = finalTotalPot - dappFeeAmount;
        
        bytes32 userCommitment = keccak256(abi.encodePacked(block.timestamp, currentRoundPlayers.length));
        uint64 sequenceNumber = entropyContract.requestWithCallback{value: msg.value}(
            pythProvider,
            userCommitment
        );

        pendingDraws[sequenceNumber] = PendingDraw({
            totalPot: finalTotalPot,
            numberHitPot: (potForPrizes * numberHitPercentage) / (numberHitPercentage + animalHitPercentage),
            animalHitPot: (potForPrizes * animalHitPercentage) / (numberHitPercentage + animalHitPercentage),
            requestTimestamp: block.timestamp,
            exists: true,
            randomNumber: 0,
            isFulfilled: false
        });
        
        bonusPot = 0;
        
        activeSequenceNumber = sequenceNumber;
        emit RandomNumberRequested(sequenceNumber, nextDrawId);
    }

    function entropyCallback(
        uint64 sequenceNumber,
        address,
        bytes32 randomNumber
    ) internal override {
        require(sequenceNumber == activeSequenceNumber, "Callback for an inactive draw.");
        
        PendingDraw storage drawToFulfill = pendingDraws[sequenceNumber];
        require(drawToFulfill.exists, "Draw does not exist.");

        drawToFulfill.randomNumber = randomNumber;
        drawToFulfill.isFulfilled = true;

        emit RandomNumberFulfilled(sequenceNumber, randomNumber);
    }

    function processDraw() public onlyAdmin {
        uint64 sequenceNumber = activeSequenceNumber;
        require(sequenceNumber != 0, "No draw is active.");
        
        PendingDraw storage drawToProcess = pendingDraws[sequenceNumber];
        require(drawToProcess.isFulfilled, "Random number not yet received from Pyth.");

        bytes32 randomNumber = drawToProcess.randomNumber;
        uint256 currentDrawId = nextDrawId;
        uint256 winningNumber = uint256(randomNumber) % 96;
        string memory winningAnimal = getAnimalFromNumber(winningNumber);

        emit DrawCompleted(currentDrawId, winningNumber, winningAnimal);

        (Winner[] memory numberWinners, Winner[] memory animalWinners) = _distributePrizes(
            winningNumber,
            winningAnimal,
            drawToProcess.numberHitPot,
            drawToProcess.animalHitPot
        );
        _logDrawHistory(currentDrawId, winningNumber, winningAnimal, drawToProcess.totalPot, numberWinners, animalWinners, randomNumber);

        delete pendingDraws[sequenceNumber];
        activeSequenceNumber = 0;
        _clearBets();
        nextDrawId++;
        emit DrawProcessed(sequenceNumber, msg.sender);
    }

    function getEntropy() internal view override returns (address) {
        return address(entropyContract);
    }
    
    function getPythFee() public view returns (uint128) {
        return entropyContract.getFee(pythProvider);
    }

    function withdrawPrize() public {
        uint256 amount = pendingWithdrawals[msg.sender];
        require(amount > 0, "No prize to withdraw.");
        pendingWithdrawals[msg.sender] = 0;
        totalPendingWithdrawals -= amount;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Failed to withdraw prize.");
        emit PrizeWithdrawn(msg.sender, amount);
    }
    
    function _distributePrizes(uint256 _wn, string memory _wa, uint256 _nPot, uint256 _aPot) internal returns (Winner[] memory, Winner[] memory) {
        address[] memory numberWinnerAddresses = numberBetters[_wn];
        address[] memory animalWinnerAddresses = animalBetters[_wa];
        Winner[] memory finalNumberWinners = new Winner[](numberWinnerAddresses.length);
        if (numberWinnerAddresses.length > 0) {
            uint256 prizePerWinner = _nPot / numberWinnerAddresses.length;
            for (uint i = 0; i < numberWinnerAddresses.length; i++) {
                address winnerAddr = numberWinnerAddresses[i];
                finalNumberWinners[i] = Winner(winnerAddr, prizePerWinner);
                pendingWithdrawals[winnerAddr] += prizePerWinner;
                totalPendingWithdrawals += prizePerWinner;
            }
        }
        Winner[] memory finalAnimalWinners = new Winner[](animalWinnerAddresses.length);
        if (animalWinnerAddresses.length > 0) {
            uint256 prizePerWinner = _aPot / animalWinnerAddresses.length;
            for (uint i = 0; i < animalWinnerAddresses.length; i++) {
                address winnerAddr = animalWinnerAddresses[i];
                finalAnimalWinners[i] = Winner(winnerAddr, prizePerWinner);
                pendingWithdrawals[winnerAddr] += prizePerWinner;
                totalPendingWithdrawals += prizePerWinner;
            }
        }
        return (finalNumberWinners, finalAnimalWinners);
    }

    function _clearBets() private {
        for (uint i = 0; i < bettedNumbers.length; i++) delete numberBetters[bettedNumbers[i]];
        for (uint i = 0; i < bettedAnimals.length; i++) delete animalBetters[bettedAnimals[i]];
        delete bettedNumbers;
        delete bettedAnimals;
        
        for (uint i = 0; i < currentRoundPlayers.length; i++) {
            address player = currentRoundPlayers[i];
            
            PlayerBets storage bets = betsByPlayerInCurrentRound[player];

            for (uint j = 0; j < bets.numbers.length; j++) {
                delete playerHasBetOnNumberInRound[player][bets.numbers[j]];
            }

            for (uint j = 0; j < bets.animals.length; j++) {
                delete playerHasBetOnAnimalInRound[player][bets.animals[j]];
            }

            delete hasBetInCurrentRound[player];
            delete numberBetsPerPlayerInRound[player];
            delete animalBetsPerPlayerInRound[player];
            delete betsByPlayerInCurrentRound[player];
        }
        delete currentRoundPlayers;
    }
    
    function _logDrawHistory(uint256 _id, uint256 _wn, string memory _wa, uint256 _pot, Winner[] memory _numW, Winner[] memory _aniW, bytes32 _pythRandomNumber) private {
        uint256 index = drawHistoryCounter % DRAW_HISTORY_SIZE;
        Draw storage newDraw;

        if (drawHistory.length < DRAW_HISTORY_SIZE) {
            drawHistory.push();
            newDraw = drawHistory[drawHistory.length - 1];
        } else {
            newDraw = drawHistory[index];
            delete newDraw.numberWinners;
            delete newDraw.animalWinners;
            delete newDraw.numberBets;
            delete newDraw.animalBets;
        }

        newDraw.id = _id;
        newDraw.winningNumber = _wn;
        newDraw.winningAnimal = _wa;
        newDraw.pythRandomNumber = _pythRandomNumber;
        newDraw.timestamp = block.timestamp;
        newDraw.totalPot = _pot;

        for (uint i = 0; i < _numW.length; i++) {
            newDraw.numberWinners.push(_numW[i]);
        }
        for (uint i = 0; i < _aniW.length; i++) {
            newDraw.animalWinners.push(_aniW[i]);
        }

        for (uint i = 0; i < bettedNumbers.length; i++) {
            uint256 num = bettedNumbers[i];
            newDraw.numberBets.push(NumberBet(num, numberBetters[num]));
        }
        for (uint i = 0; i < bettedAnimals.length; i++) {
            string memory animal = bettedAnimals[i];
            newDraw.animalBets.push(AnimalBet(animal, animalBetters[animal]));
        }

        drawHistoryCounter++;
    }

    function getPlayerBets(address player) external view returns (PlayerBets memory) {
        return betsByPlayerInCurrentRound[player];
    }

    function getAllTimePlayers() public view returns (address[] memory) {
        return allTimePlayers;
    }

    function getFullStatus() public view returns (FullStatus memory) {
        FullStatus memory status;

        status.isPaused = isPaused;
        status.nextDrawId = nextDrawId;
        status.activeSequenceNumber = activeSequenceNumber;
        status.betPrice = betPrice;
        status.maxNumberBetsPerPlayer = maxNumberBetsPerPlayer;
        status.maxAnimalBetsPerPlayer = maxAnimalBetsPerPlayer;
        status.hasBetsPlaced = bettedNumbers.length > 0 || bettedAnimals.length > 0;
        status.bonusPot = bonusPot;

        if (activeSequenceNumber != 0) {
            PendingDraw storage pDraw = pendingDraws[activeSequenceNumber];
            status.currentPot = pDraw.totalPot;
            status.pendingDrawTimestamp = pDraw.requestTimestamp;
            status.isRandomNumberFulfilled = pDraw.isFulfilled;
        } else {
            status.currentPot = (address(this).balance - bonusPot - totalPendingWithdrawals);
            status.pendingDrawTimestamp = 0;
            status.isRandomNumberFulfilled = false;
        }

        if (isPaused) {
            status.statusString = "Paused";
        } else if (activeSequenceNumber != 0) {
            if (status.isRandomNumberFulfilled) {
                status.statusString = "Ready to Process Draw";
            } else if (block.timestamp > status.pendingDrawTimestamp + MIN_CANCEL_WAIT_TIME) {
                status.statusString = "Pyth took too long, cancel the draw";
            } else {
                status.statusString = "Raffle in progress, waiting for Pyth...";
            }
        } else if (status.hasBetsPlaced) {
            status.statusString = "Waiting for Draw Trigger";
        } else {
            status.statusString = "Open for Betting";
        }
        return status;
    }

    function getAnimalFromNumber(uint256 _number) public pure returns (string memory) {
        if (_number <= 5) return "Molandak";
        if (_number <= 11) return "Chog";
        if (_number <= 17) return "Moyaki";
        if (_number <= 23) return "Mouch";
        if (_number <= 29) return "Salmonad";
        if (_number <= 35) return "Moncock";
        if (_number <= 41) return "Snelly";
        if (_number <= 47) return "Salandak";
        if (_number <= 53) return "Honk";
        if (_number <= 59) return "Mokadel";
        if (_number <= 65) return "Lyraffe";
        if (_number <= 71) return "Spidermon";
        if (_number <= 77) return "Montiger";
        if (_number <= 83) return "Moxy";
        if (_number <= 89) return "Birbie";
        if (_number <= 95) return "Monavara";
        return "Invalid";
    }

    function getDrawHistory() public view returns (Draw[] memory) {
        return drawHistory;
    }

    function getCurrentRoundPot() public view returns (uint256) {
        if (activeSequenceNumber != 0) {
            return pendingDraws[activeSequenceNumber].totalPot;
        }
        return (address(this).balance - totalPendingWithdrawals);
    }

    function addBonusToPot() public payable onlyAdmin {
        require(msg.value > 0, "Amount must be greater than zero.");
        bonusPot += msg.value;
        emit BonusAddedToPot(msg.sender, msg.value);
    }

    function cancelFailedDraw(uint64 _sequenceNumber) public onlyAdmin {
        require(_sequenceNumber == activeSequenceNumber, "Can only cancel the active draw.");
        PendingDraw storage pDraw = pendingDraws[_sequenceNumber];
        require(pDraw.exists, "Draw does not exist.");
        require(block.timestamp > pDraw.requestTimestamp + MIN_CANCEL_WAIT_TIME, "Cannot cancel yet, please wait.");

        _refundAllActiveBets();
        delete pendingDraws[_sequenceNumber];
        activeSequenceNumber = 0;
        _clearBets();
        emit DrawCancelled(_sequenceNumber, msg.sender);
    }
    
    function _refundAllActiveBets() private {
        for (uint i = 0; i < bettedNumbers.length; i++) {
            address[] storage players = numberBetters[bettedNumbers[i]];
            for (uint j = 0; j < players.length; j++) {
                pendingWithdrawals[players[j]] += betPrice;
                 totalPendingWithdrawals += betPrice;
            }
        }
        for (uint i = 0; i < bettedAnimals.length; i++) {
            address[] storage players = animalBetters[bettedAnimals[i]];
            for (uint j = 0; j < players.length; j++) {
                pendingWithdrawals[players[j]] += betPrice;
                 totalPendingWithdrawals += betPrice;
            }
        }
    }

    function setBetPrice(uint256 _newPriceInWei) public onlyAdmin noDrawPending {
        require(bettedNumbers.length == 0 && bettedAnimals.length == 0, "Cannot change settings during a round.");
        betPrice = _newPriceInWei;
        emit BetPriceChanged(_newPriceInWei);
    }

    function setMaxNumberBets(uint256 _newLimit) public onlyAdmin {
        require(_newLimit > 0, "Limit must be greater than 0.");
        maxNumberBetsPerPlayer = _newLimit;
        emit MaxNumberBetsChanged(_newLimit);
    }

    function setMaxAnimalBets(uint256 _newLimit) public onlyAdmin {
        require(_newLimit > 0, "Limit must be greater than 0.");
        maxAnimalBetsPerPlayer = _newLimit;
        emit MaxAnimalBetsChanged(_newLimit);
    }

    function setDappWallet(address _newWallet) public onlyOwner {
        require(_newWallet != address(0), "Cannot set dapp wallet to zero address.");
        dappWallet = _newWallet;
        emit DappWalletChanged(_newWallet);
    }

    function setPercentages(uint256 _numberHit, uint256 _animalHit, uint256 _dappFee) public onlyAdmin noDrawPending {
        require(bettedNumbers.length == 0 && bettedAnimals.length == 0, "Cannot change settings during a round.");
        require(_numberHit + _animalHit + _dappFee == 100, "Percentages must sum to 100.");
        numberHitPercentage = _numberHit;
        animalHitPercentage = _animalHit;
        dappFeePercentage = _dappFee;
        emit PercentagesChanged(_numberHit, _animalHit, _dappFee);
    }

    function addAdmin(address _newAdmin) public onlyOwner {
        require(_newAdmin != address(0), "Cannot add zero address.");
        admins[_newAdmin] = true;
        emit AdminAdded(_newAdmin);
    }

    function removeAdmin(address _adminToRemove) public onlyOwner {
        require(admins[_adminToRemove], "Address is not an admin.");
        admins[_adminToRemove] = false;
        emit AdminRemoved(_adminToRemove);
    }

    function pause() public onlyAdmin {
        require(!isPaused, "Contract is already paused.");
        isPaused = true;
        emit ContractPaused(true);
    }

    function unpause() public onlyAdmin {
        require(isPaused, "Contract is not paused.");
        isPaused = false;
        emit ContractPaused(false);
    }
    
    function refundAllBets() public onlyAdmin {
        require(activeSequenceNumber == 0, "Cannot refund while a draw is active.");
        _refundAllActiveBets();
        refundHistory.push(RefundSession(block.timestamp, msg.sender));
        emit RefundSessionLogged(block.timestamp, msg.sender);
        _clearBets();
    }
}
