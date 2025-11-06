🛡️ Praesidium AI
🚀 Live Demo

Experience the future of DeFi insurance today.

📖 About The Project

Praesidium AI is a decentralized insurance protocol built to solve one of DeFi’s biggest challenges — systemic risk.
We replace slow, subjective, and unreliable claims processes with a new paradigm of intelligent automation.

The DeFi ecosystem faces billions in losses due to hacks, smart contract exploits, and protocol failures. Current insurance models rely on manual, governance-based claims voting, which is slow and uncertain.
Praesidium AI re-architects this model with automation and AI-driven intelligence.

⚙️ Core Technologies

1. AI-Powered Risk Engine
At the heart of Praesidium is an AI engine that continuously analyzes on-chain and off-chain data to generate a dynamic, real-time “Praesidium Score.”
This score directly determines premium costs — transparent, objective, and dynamic.

2. Automated Parametric Payouts
We eliminate claims committees entirely. Policies are smart contracts with “if/then” logic — they pay out instantly when a verifiable on-chain event (parametric trigger) occurs.

Built for the Polygon Buildathon by AKINDO.

🧱 Built With

Frontend: React, Ethers.js, Chakra UI

Smart Contracts: Solidity, Hardhat

Blockchain: Polygon

Oracles: Chainlink (for future data feeds)

✨ Key Features

AI-Driven Risk Assessment:
Real-time Praesidium Scores for DeFi protocols, offering transparent, data-backed insights.

Parametric Insurance:
Payouts are triggered by objective on-chain events, not community votes.

Instant & Automated Payouts:
Smart contracts execute payouts immediately — no forms, no waiting.

Policy as an NFT:
Each policy is minted as an NFT — a verifiable, transferable proof of ownership.

Built for Polygon:
Leverages Polygon’s high-speed, low-cost infrastructure for micro-premiums and instant transactions.

🏁 Getting Started

Follow these steps to run Praesidium AI locally.

🔧 Prerequisites

Node.js
 (v18 or later)

npm or yarn

A Web3 wallet (e.g., MetaMask or Phantom)

📦 Installation

Clone the repository:

git clone https://github.com/your-username/praesidium-ai.git
cd praesidium-ai


Install frontend dependencies:

cd client
npm install


Install smart contract dependencies:

cd ../contracts
npm install

⚙️ Environment Variables

Create a .env file inside the contracts directory and add:

POLYGON_RPC_URL="YOUR_ALCHEMY_OR_INFURA_URL"
PRIVATE_KEY="YOUR_WALLET_PRIVATE_KEY"
POLYGONSCAN_API_KEY="YOUR_POLYGONSCAN_API_KEY"

🚀 Running the Project

Deploy Smart Contracts:

npx hardhat run scripts/deploy.js --network polygon


Update the deployed contract address in your frontend configuration.

Start the Frontend:

npm start


The application will be available at:
👉 http://localhost:3000

🗺️ Roadmap

 Phase 1: MVP Launch (Buildathon)

Core smart contract architecture on Polygon

Functional UI for policy purchase

Automated parametric payout demo

 Phase 2: AI Engine Integration

Develop and train ML models for dynamic risk scoring

Integrate live AI engine for real-time Praesidium Scores

Expand protocol coverage

 Phase 3: Ecosystem Integration & Composability

One-click insurance via wallet/dashboard integrations

Tokenized underwriting positions (pUTs)

 Phase 4: Multi-Chain Future

Leverage Polygon’s AggLayer for cross-chain insurance products

🤝 Contributing

Contributions make the open-source community amazing — your help is welcome!

Fork the Project

Create your Feature Branch

git checkout -b feature/AmazingFeature


Commit your Changes

git commit -m 'Add some AmazingFeature'


Push to the Branch

git push origin feature/AmazingFeature


Open a Pull Request

