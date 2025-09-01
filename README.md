# Monanimal Game

Monanimal Game is a decentralized and transparent lottery game built on the Monad blockchain. Players can bet on numbers (0-95) or Monanimals in each round. A Pyth Network oracle is used to generate a random number that determines the winner, ensuring a fair and tamper-proof result.

## How it Works

The lottery game was designed to be fair, transparent, and 100% on-chain. Here is a step-by-step explanation of how it all happens:

1.  **The Betting Phase**: You choose your numbers (0-95) and/or your favorite Monanimals. Each selection has a fixed cost in MON. All bets from a round are gathered into a large prize pool.

2.  **The Draw with Pyth Network**: To ensure the winning number is truly random and unpredictable, the game uses the Pyth Network's oracle service.
    * When the draw is initiated, the smart contract makes a request to Pyth.
    * Pyth generates a random number off-chain, making it impossible to manipulate or predict.
    * This number is securely sent back to the smart contract.

3.  **The Winner Calculation**: The smart contract takes the random number received from Pyth and applies a modulo (`%`) operation to ensure the result is always a number between 0 and 95.

4.  **Prize Distribution**: The accumulated prize pool is divided among those who guessed the number and the Monanimal correctly, according to the defined percentages. If no one wins, the prize pool rolls over to the next draw.

## Technologies Used

* **Frontend**: React, Vite, Ethers.js
* **Backend**: Node.js, Ethers.js, node-cron
* **Blockchain**: Solidity, Monad Testnet
* **Oracle**: Pyth Network
* **Authentication**: Privy

## Project Structure

* `/src`: Contains the source code for the application's frontend.
    * `components`: Reusable React components.
    * `App.jsx`: The main component that manages the game's state.
    * `translations.js`: Translations for different languages (English and Portuguese).
* `/public`: Contains static files, such as images and `index.html`.
* `/Contract`: Contains the game's smart contract.
    * `MonanimalGame.sol`: The source code of the smart contract in Solidity.

## Backend

The backend consists of a Node.js server that automates and facilitates the operation of the Monanimal Game. Its main responsibilities are:

* **Automated Draws**: Using `node-cron`, the server automatically triggers a new draw every day at a scheduled time. It does this by calling the `triggerDraw` function in the smart contract and paying the necessary fee to the Pyth oracle.
* **Result Processing**: The server listens for the `RandomNumberFulfilled` event from the smart contract. Upon receiving this event, it calls the `processDraw` function to finalize the round, calculate the winners, and make the prizes available for withdrawal.
* **Leaderboard Integration**: The backend listens for `BetsPlaced` events from the game contract. When a new bet is detected, it updates a separate leaderboard smart contract, ensuring that the ranking of the most active players is always up to date.

This automation ensures that the game runs continuously and reliably without the need for manual intervention.

## Smart Contracts

The logic of the Monanimal Game is encapsulated in two main smart contracts deployed on the Monad Testnet:

* **MonanimalGame.sol**: This is the core contract of the game. It is responsible for managing betting rounds, storing bets, interacting with the Pyth oracle to obtain a random number, calculating the winners, and distributing the prizes.
* **Leaderboard.sol**: A separate contract used to maintain a ranking of players based on the number of bets placed. This allows for a persistent and transparent leaderboard, independent of the main game logic.

## How to Run Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/jdbmonad/JDBmonad-main.git
    cd JDBmonad-main
    ```

2.  **Install the dependencies:**
    ```bash
    npm install
    ```

3.  **Start the development server:**
    ```bash
    npm run dev
    ```

4.  **Open your browser to `http://localhost:5173` (or the port indicated in your terminal).**
