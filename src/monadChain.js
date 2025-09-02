export const monadTestnet = {
  id: 10143,
  name: 'Monad Testnet',
  nativeCurrency: { name: 'MON', symbol: 'MON', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        'https://rpc.ankr.com/monad_testnet',
        'https://testnet-rpc.monad.xyz',
        'https://monad-testnet.drpc.org'
      ],
      webSocket: [
        'wss://testnet-rpc.monad.xyz',
        'wss://monad-testnet.drpc.org'
      ]
    }
  },
  blockExplorers: { default: { name: 'MonVision', url: 'https://testnet.monadexplorer.com/' } },
};
