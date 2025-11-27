
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useBalance, useAccount } from 'wagmi';
import Button from './ui/Button';
import { FiLink } from 'react-icons/fi';

const ConnectWallet = () => {
  const { address } = useAccount();
  
  // Fetch real-time balance with auto-refresh
  const { data: balance } = useBalance({
    address: address,
    query: {
      refetchInterval: 10000, // Refresh every 10 seconds
    }
  });

  const formatBalance = () => {
    if (!balance) return '';
    const value = parseFloat(balance.formatted);
    return `${value.toFixed(3)} ${balance.symbol}`;
  };

  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        authenticationStatus,
        mounted,
      }) => {
        const ready = mounted && authenticationStatus !== 'loading';
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus ||
            authenticationStatus === 'authenticated');

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              'style': {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button variant="primary" onClick={openConnectModal} icon={<FiLink />}>
                    Connect Wallet
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button variant="secondary" onClick={openChainModal}>
                    Wrong network
                  </Button>
                );
              }

              return (
                <div style={{ display: 'flex', gap: 12 }}>
                  <Button
                    variant="secondary"
                    onClick={openChainModal}
                    style={{ display: 'flex', alignItems: 'center' }}
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          overflow: 'hidden',
                          marginRight: 4,
                        }}
                      >
                        {chain.iconUrl && (
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 12, height: 12 }}
                          />
                        )}
                      </div>
                    )}
                    {chain.name}
                  </Button>

                  <Button variant="secondary" onClick={openAccountModal}>
                    {account.displayName}
                    {balance ? ` (${formatBalance()})` : ''}
                  </Button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
};

export default ConnectWallet;
