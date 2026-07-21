import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ConversationProvider } from '@/context/ConversationContext';
import { SocketProvider } from '@/context/SocketContext';
import { AppRoutes } from '@/routes/AppRoutes';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ConversationProvider>
            <SocketProvider>
              <AppRoutes />
              <Toaster
                position="top-center"
                toastOptions={{
                  style: {
                    background: 'var(--surface-elevated)',
                    color: 'var(--foreground)',
                    border: '1px solid var(--border)',
                  },
                }}
              />
            </SocketProvider>
          </ConversationProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
