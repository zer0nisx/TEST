import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { Cita, Cliente } from '@/types';

const locales = { es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const COLORES = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
  '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e'
];

export function CitasModule() {
  const { user, hasPermission } = useAuth();
  const [citas, setCitas] = useState<any[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selectedCita, setSelectedCita] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    clienteId: '',
    cedula: '',
    titulo: '',
    descripcion: '',
    fecha: '',
    duracion: 60,
    color: '',
    estado: 'programada' as const,
  });

  useEffect(() => {
    loadCitas();
    loadClientes();
  }, []);

  const loadCitas = async () => {
    try {
      const data = await api.getCitas();
      setCitas(data.map((c: any) => ({
        ...c,
        start: new Date(c.fecha),
        end: new Date(new Date(c.fecha).getTime() + c.duracion * 60000),
        title: c.titulo,
      })));
    } catch (error) {
      toast.error('Error al cargar citas');
    }
  };

  const loadClientes = async () => {
    try {
      const data = await api.getClientes();
      setClientes(data);
    } catch (error) {
      toast.error('Error al cargar clientes');
    }
  };

  const handleSearchCedula = async (cedula: string) => {
    if (cedula.length < 5) return;

    try {
      const cliente = await api.getClienteByCedula(cedula);
      if (cliente) {
        setFormData({ ...formData, clienteId: cliente.id, cedula });
        toast.success('Cliente encontrado');
      } else {
        setFormData({ ...formData, clienteId: '', cedula });
        toast.info('Cliente no encontrado, deberá ser registrado');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Verificar conflictos
      const conflict = await api.checkConflict(
        formData.fecha,
        formData.duracion,
        selectedCita?.id
      );

      if (conflict.hasConflict) {
        toast.error('Ya existe una cita en ese horario');
        setLoading(false);
        return;
      }

      const citaData = {
        ...formData,
        color: formData.color || COLORES[Math.floor(Math.random() * COLORES.length)],
        createdBy: user?.id,
      };

      if (selectedCita) {
        await api.updateCita(selectedCita.id, citaData);
        toast.success('Cita actualizada');
      } else {
        await api.createCita(citaData);
        toast.success('Cita creada');
      }

      await loadCitas();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Error al guardar cita');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCita || !hasPermission('delete')) return;

    try {
      await api.deleteCita(selectedCita.id);
      toast.success('Cita eliminada');
      await loadCitas();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Error al eliminar cita');
    }
  };

  const resetForm = () => {
    setFormData({
      clienteId: '',
      cedula: '',
      titulo: '',
      descripcion: '',
      fecha: '',
      duracion: 60,
      color: '',
      estado: 'programada',
    });
    setSelectedCita(null);
    setIsCreating(false);
  };

  const handleSelectEvent = (event: any) => {
    setSelectedCita(event);
    setFormData({
      clienteId: event.cliente_id || event.clienteId,
      cedula: '',
      titulo: event.titulo || event.title,
      descripcion: event.descripcion || '',
      fecha: format(event.start, "yyyy-MM-dd'T'HH:mm"),
      duracion: event.duracion,
      color: event.color,
      estado: event.estado,
    });
    setIsCreating(false);
    setIsDialogOpen(true);
  };

  const handleSelectSlot = ({ start }: { start: Date }) => {
    if (!hasPermission('create')) {
      toast.error('No tienes permisos para crear citas');
      return;
    }

    setFormData({
      ...formData,
      fecha: format(start, "yyyy-MM-dd'T'HH:mm"),
    });
    setIsCreating(true);
    setIsDialogOpen(true);
  };

  const eventStyleGetter = (event: any) => {
    return {
      style: {
        backgroundColor: event.color || '#3b82f6',
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Calendario de Citas</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreating(true)} disabled={!hasPermission('create')}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Cita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isCreating ? 'Nueva Cita' : 'Detalles de la Cita'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Cédula del Cliente</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="V-12345678 o E-12345678"
                    value={formData.cedula}
                    onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                    onBlur={(e) => handleSearchCedula(e.target.value)}
                  />
                  <Select value={formData.clienteId} onValueChange={(v) => setFormData({ ...formData, clienteId: v })}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="O selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nombre} {c.apellido}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Título</Label>
                <Input
                  required
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ej: Consulta de rutina"
                />
              </div>

              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  placeholder="Detalles adicionales"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Fecha y Hora</Label>
                  <Input
                    type="datetime-local"
                    required
                    value={formData.fecha}
                    onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Duración (minutos)</Label>
                  <Input
                    type="number"
                    required
                    min="15"
                    step="15"
                    value={formData.duracion}
                    onChange={(e) => setFormData({ ...formData, duracion: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2 flex-wrap">
                    {COLORES.slice(0, 8).map((color) => (
                      <button
                        key={color}
                        type="button"
                        className="w-8 h-8 rounded-full border-2 border-white shadow-md hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => setFormData({ ...formData, color })}
                      />
                    ))}
                  </div>
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={formData.estado} onValueChange={(v: any) => setFormData({ ...formData, estado: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="programada">Programada</SelectItem>
                      <SelectItem value="completada">Completada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <div>
                  {!isCreating && hasPermission('delete') && (
                    <Button type="button" variant="destructive" onClick={handleDelete}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading || (isCreating ? !hasPermission('create') : !hasPermission('update'))}>
                    {loading ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card p-4 rounded-lg border" style={{ height: '600px' }}>
        <Calendar
          localizer={localizer}
          events={citas}
          startAccessor="start"
          endAccessor="end"
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable
          eventPropGetter={eventStyleGetter}
          messages={{
            next: 'Siguiente',
            previous: 'Anterior',
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día',
            agenda: 'Agenda',
            date: 'Fecha',
            time: 'Hora',
            event: 'Evento',
            noEventsInRange: 'No hay citas en este rango',
          }}
        />
      </div>
    </div>
  );
}
