import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Calendar, Package, Users, LogOut, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface LayoutProps {
  children: ReactNode;
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export function Layout({ children, currentTab, onTabChange }: LayoutProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const tabs = [
    { id: 'citas', label: 'Citas', icon: Calendar },
    { id: 'clientes', label: 'Clientes', icon: Users },
    { id: 'inventario', label: 'Inventario', icon: Package },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Agenda de Citas</h1>
              <p className="text-sm text-muted-foreground">
                Bienvenido, {user?.username} ({user?.role === 'admin' ? 'Administrador' : 'Usuario'})
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button variant="outline" onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>
      </header>

      <nav className="border-b bg-card">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={currentTab === tab.id ? 'default' : 'ghost'}
                  className="rounded-none border-b-2 border-transparent data-[active=true]:border-primary"
                  data-active={currentTab === tab.id}
                  onClick={() => onTabChange(tab.id)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
