import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import './index.scss';
import App from './App';
import NiceModal from '@ebay/nice-modal-react';
import { PersistGate } from 'redux-persist/integration/react';
import { Toaster } from 'react-hot-toast';
import { Provider, useSelector } from 'react-redux';
import persistStore from 'redux-persist/es/persistStore';
import store from './redux/Store';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
let persistor = persistStore(store);
import './NiceModalRegistry';
import Loader from './components/ui/loader/Loader';
import { SocketProvider } from './context/SocketProvider';
import { LANDBIT_SOCKET } from './utils/config';

// Reads token from Redux after rehydration
function SocketBridge({ children }: { children: React.ReactNode }) {
  const authToken = useSelector((state: RootState) => state?.user?.authToken);
  return (
    <SocketProvider token={authToken} baseURL={LANDBIT_SOCKET}>
      {children}
    </SocketProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <NiceModal.Provider>
        <PersistGate loading={'loading...'} persistor={persistor}>
          <SocketBridge>
            <Loader />
            <Toaster />
            <App />
          </SocketBridge>
        </PersistGate>
      </NiceModal.Provider>
    </Provider>
  </StrictMode>
);
