import { useState } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Login } from '@/components/Login';
import { Layout } from '@/components/Layout';
import { CitasModule } from '@/components/CitasModule';
import { ClientesModule } from '@/components/ClientesModule';
import { InventarioModule } from '@/components/InventarioModule';
import { Toaster } from '@/components/ui/sonner';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [currentTab, setCurrentTab] = useState('citas');

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout currentTab={currentTab} onTabChange={setCurrentTab}>
      {currentTab === 'citas' && <CitasModule />}
      {currentTab === 'clientes' && <ClientesModule />}
      {currentTab === 'inventario' && <InventarioModule />}
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
