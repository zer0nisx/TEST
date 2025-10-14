import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, Permission } from '@/types';
import { api } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (permission: Permission) => boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Verificar si hay sesión guardada
    const savedUser = localStorage.getItem('agenda-citas-user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await api.login(username, password);

      if (response.success && response.user) {
        setUser(response.user);
        localStorage.setItem('agenda-citas-user', JSON.stringify(response.user));
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('agenda-citas-user');
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;

    // Admin tiene todos los permisos
    if (user.role === 'admin') return true;

    // Usuario con permisos personalizados
    if (user.customPermissions) {
      return user.customPermissions.includes(permission);
    }

    // Usuario por defecto solo puede crear y leer
    return permission === 'create' || permission === 'read';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        hasPermission,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
