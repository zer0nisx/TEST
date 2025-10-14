import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await login(username, password);

      if (success) {
        toast.success('Sesión iniciada correctamente');
      } else {
        toast.error('Usuario o contraseña incorrectos');
      }
    } catch (error) {
      toast.error('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center text-white">
            Agenda de Citas
          </CardTitle>
          <CardDescription className="text-center text-slate-400">
            Ingresa tus credenciales para acceder
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-slate-200">Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="Ingresa tu usuario"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Button>
          </form>
          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-sm text-slate-400 text-center">
              Usuarios de prueba:
            </p>
            <div className="mt-2 space-y-1 text-xs text-slate-500 text-center">
              <p>Admin: <span className="text-slate-400">admin / 123456</span></p>
              <p>Usuario: <span className="text-slate-400">usuario / 123456</span></p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
