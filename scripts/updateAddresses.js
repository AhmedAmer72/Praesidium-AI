import fs from 'fs';
import path from 'path';

// Read contract addresses from contracts directory
const contractAddressesPath = path.join(process.cwd(), 'contracts', 'contractAddresses.json');
const constantsPath = path.join(process.cwd(), 'constants.ts');

try {
  const addresses = JSON.parse(fs.readFileSync(contractAddressesPath, 'utf8'));
  let constantsContent = fs.readFileSync(constantsPath, 'utf8');
  
  // Update the CONTRACT_ADDRESSES object
  const addressesString = JSON.stringify(addresses, null, 2);
  constantsContent = constantsContent.replace(
    /export const CONTRACT_ADDRESSES = \{[\s\S]*?\};/,
    `export const CONTRACT_ADDRESSES = ${addressesString};`
  );
  
  fs.writeFileSync(constantsPath, constantsContent);
  console.log('✅ Contract addresses updated in constants.ts');
} catch (error) {
  console.error('❌ Failed to update addresses:', error.message);
}