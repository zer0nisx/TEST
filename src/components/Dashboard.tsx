import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Calendar, Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface DashboardStats {
  totalClientes: number;
  citasCompletadas: number;
  citasAgendadas: number;
  citasCanceladas: number;
  citasHoy: number;
}

interface CitaConCliente {
  id: string;
  titulo: string;
  fecha: string;
  estado: string;
  cliente_nombre: string;
  cliente_apellido: string;
}

export function Dashboard() {
  const { hasPermission } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 0,
    citasCompletadas: 0,
    citasAgendadas: 0,
    citasCanceladas: 0,
    citasHoy: 0,
  });
  const [citasSemana, setCitasSemana] = useState<{ [key: string]: CitaConCliente[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hasPermission('read')) {
      loadDashboardData();
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      const [clientes, citas] = await Promise.all([
        api.getClientes(),
        api.getCitas(),
      ]);

      // Calcular estadísticas
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const mañana = new Date(hoy);
      mañana.setDate(mañana.getDate() + 1);

      const citasHoy = citas.filter((c: CitaConCliente) => {
        const citaFecha = new Date(c.fecha);
        return citaFecha >= hoy && citaFecha < mañana;
      }).length;

      setStats({
        totalClientes: clientes.length,
        citasCompletadas: citas.filter((c: CitaConCliente) => c.estado === 'completada').length,
        citasAgendadas: citas.filter((c: CitaConCliente) => c.estado === 'programada').length,
        citasCanceladas: citas.filter((c: CitaConCliente) => c.estado === 'cancelada').length,
        citasHoy,
      });

      // Agrupar citas por día de la semana
      const inicioSemana = startOfWeek(new Date(), { weekStartsOn: 1 });
      const finSemana = endOfWeek(new Date(), { weekStartsOn: 1 });
      const diasSemana = eachDayOfInterval({ start: inicioSemana, end: finSemana });

      const citasPorDia: { [key: string]: CitaConCliente[] } = {};
      diasSemana.forEach(dia => {
        const diaKey = format(dia, 'yyyy-MM-dd');
        citasPorDia[diaKey] = citas.filter((c: CitaConCliente) => {
          const citaFecha = new Date(c.fecha);
          return isSameDay(citaFecha, dia) && c.estado === 'programada';
        });
      });

      setCitasSemana(citasPorDia);
      setLoading(false);
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Cargando estadísticas...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Resumen general del sistema de citas
        </p>
      </div>

      {/* Tarjetas de Estadísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClientes}</div>
            <p className="text-xs text-muted-foreground">
              Registrados en el sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas Agendadas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.citasAgendadas}</div>
            <p className="text-xs text-muted-foreground">
              Pendientes de realizar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.citasCompletadas}</div>
            <p className="text-xs text-muted-foreground">
              Finalizadas exitosamente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Canceladas</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.citasCanceladas}</div>
            <p className="text-xs text-muted-foreground">
              Total de cancelaciones
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.citasHoy}</div>
            <p className="text-xs text-muted-foreground">
              Programadas para hoy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla Semanal de Citas */}
      <Card>
        <CardHeader>
          <CardTitle>Citas de la Semana</CardTitle>
          <CardDescription>
            Resumen de citas agendadas por día
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(citasSemana).map(([fecha, citas]) => {
              const dia = new Date(fecha + 'T00:00:00');
              const nombreDia = format(dia, 'EEEE', { locale: es });
              const fechaFormateada = format(dia, 'dd/MM/yyyy');

              return (
                <div key={fecha} className="border-b pb-4 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <h3 className="font-semibold capitalize">{nombreDia}</h3>
                      <p className="text-sm text-muted-foreground">{fechaFormateada}</p>
                    </div>
                    <Badge variant={citas.length > 0 ? 'default' : 'secondary'}>
                      {citas.length} {citas.length === 1 ? 'cita' : 'citas'}
                    </Badge>
                  </div>

                  {citas.length > 0 ? (
                    <div className="space-y-2 mt-3">
                      {citas.map((cita) => (
                        <div
                          key={cita.id}
                          className="flex items-center justify-between bg-muted/50 rounded-lg p-3"
                        >
                          <div>
                            <p className="font-medium">
                              {cita.cliente_nombre} {cita.cliente_apellido}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {cita.titulo}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">
                              {format(new Date(cita.fecha), 'HH:mm')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-2">
                      No hay citas agendadas
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
