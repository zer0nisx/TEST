import { useState } from 'react';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { Login } from '@/components/Login';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/components/Dashboard';
import { CitasModule } from '@/components/CitasModule';
import { ClientesModule } from '@/components/ClientesModule';
import { InventarioModule } from '@/components/InventarioModule';
import { Toaster } from '@/components/ui/sonner';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [currentTab, setCurrentTab] = useState('dashboard');

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout currentTab={currentTab} onTabChange={setCurrentTab}>
      {currentTab === 'dashboard' && <Dashboard />}
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
