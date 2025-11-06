# Praesidium AI Smart Contracts

## Setup

1. Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
```

2. Install dependencies:
```bash
npm install
```

3. Compile contracts:
```bash
npm run compile
```

## Deployment

### Mumbai Testnet
```bash
npm run deploy:mumbai
```

### Polygon Mainnet
```bash
npm run deploy:polygon
```

## Contracts

- **PraesidiumInsurance**: Main insurance contract with NFT policies
- **LiquidityPool**: Underwriter deposits and yield distribution
- **RiskOracle**: Protocol risk scoring and premium calculation

## Next Steps

1. Set up environment variables
2. Deploy to Mumbai testnet
3. Update frontend with contract addresses
4. Test basic functionality