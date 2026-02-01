// Direct deployment without hardhat script runner
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

async function main() {
    const privateKey = process.env.PRIV_KEY;
    if (!privateKey) {
        console.log('ERROR: Set PRIV_KEY environment variable');
        process.exit(1);
    }
    
    console.log('=== DIRECT DEPLOYMENT TO POLYGON ===\n');
    
    // Connect to Polygon
    const provider = new ethers.JsonRpcProvider('https://polygon-bor-rpc.publicnode.com');
    const wallet = new ethers.Wallet(privateKey, provider);
    
    console.log('Deployer:', wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log('Balance:', ethers.formatEther(balance), 'POL\n');
    
    // Get current nonce
    let nonce = await provider.getTransactionCount(wallet.address);
    console.log('Starting nonce:', nonce);
    
    // Load contract artifacts
    const poolArtifact = JSON.parse(fs.readFileSync(
        path.join(__dirname, '../artifacts/contracts/SimpleLiquidityPool.sol/SimpleLiquidityPool.json')
    ));
    const insuranceArtifact = JSON.parse(fs.readFileSync(
        path.join(__dirname, '../artifacts/contracts/PraesidiumInsuranceV2.sol/PraesidiumInsuranceV2.json')
    ));
    
    // Get gas price
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice * 120n / 100n; // 20% buffer
    console.log('Gas price:', ethers.formatUnits(gasPrice, 'gwei'), 'gwei\n');
    
    // Deploy SimpleLiquidityPool
    console.log('1️⃣ Deploying SimpleLiquidityPool...');
    console.log('   Bytecode length:', poolArtifact.bytecode.length);
    
    const poolFactory = new ethers.ContractFactory(poolArtifact.abi, poolArtifact.bytecode, wallet);
    const poolTx = await poolFactory.getDeployTransaction();
    poolTx.nonce = nonce;
    poolTx.gasPrice = gasPrice;
    poolTx.gasLimit = 500000n;
    
    const poolSentTx = await wallet.sendTransaction(poolTx);
    console.log('   TX Hash:', poolSentTx.hash);
    console.log('   Waiting for confirmation...');
    
    const poolReceipt = await poolSentTx.wait();
    const poolAddress = poolReceipt.contractAddress;
    console.log('   ✅ SimpleLiquidityPool:', poolAddress);
    
    // Verify bytecode
    const poolCode = await provider.getCode(poolAddress);
    console.log('   Deployed bytecode length:', poolCode.length);
    nonce++;
    
    // Wait 3 seconds
    console.log('\n   Waiting 3 seconds...\n');
    await new Promise(r => setTimeout(r, 3000));
    
    // Deploy PraesidiumInsuranceV2
    console.log('2️⃣ Deploying PraesidiumInsuranceV2...');
    console.log('   Bytecode length:', insuranceArtifact.bytecode.length);
    
    const insFactory = new ethers.ContractFactory(insuranceArtifact.abi, insuranceArtifact.bytecode, wallet);
    const insTx = await insFactory.getDeployTransaction();
    insTx.nonce = nonce;
    insTx.gasPrice = gasPrice;
    insTx.gasLimit = 2000000n;
    
    const insSentTx = await wallet.sendTransaction(insTx);
    console.log('   TX Hash:', insSentTx.hash);
    console.log('   Waiting for confirmation...');
    
    const insReceipt = await insSentTx.wait();
    const insAddress = insReceipt.contractAddress;
    console.log('   ✅ PraesidiumInsuranceV2:', insAddress);
    
    // Verify bytecode
    const insCode = await provider.getCode(insAddress);
    console.log('   Deployed bytecode length:', insCode.length);
    
    // Summary
    console.log('\n===========================================');
    console.log('🎉 DEPLOYMENT COMPLETE!');
    console.log('===========================================');
    console.log('RiskOracle:           0x41E41d1aEcb893616e8c24f32998F7c850670ABF');
    console.log('SimpleLiquidityPool:', poolAddress);
    console.log('PraesidiumInsuranceV2:', insAddress);
    console.log('===========================================');
    
    // Create addresses output
    const addresses = {
        polygon: {
            chainId: 137,
            riskOracle: '0x41E41d1aEcb893616e8c24f32998F7c850670ABF',
            liquidityPool: poolAddress,
            insurance: insAddress
        }
    };
    
    console.log('\nUpdate contractAddresses.json with:');
    console.log(JSON.stringify(addresses, null, 2));
}

main().catch(err => {
    console.error('ERROR:', err.message);
    process.exit(1);
});
