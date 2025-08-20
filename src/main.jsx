import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

import { PrivyProvider } from '@privy-io/react-auth';
import { monadTestnet } from './monadChain.js';

const privyAppId = 'cmdypcch1007ylh0bt9q9no9c';
const monadGamesId = 'cmd8euall0037le0my79qpz42';

ReactDOM.createRoot(document.getElementById('root')).render(
    <PrivyProvider
      appId={privyAppId}
      config={{
        defaultChain: monadTestnet,
        supportedChains: [monadTestnet],
        loginMethodsAndOrder: {
        primary: [`privy:${monadGamesId}`],
      },
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
          requireUserPasswordOnCreate: false,
        },
      }}
    >
      <App />
    </PrivyProvider>
);