import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Search, Eye, Edit, Trash2, Calendar } from 'lucide-react';
import type { Cliente } from '@/types';
import { format } from 'date-fns';

export function ClientesModule() {
  const { hasPermission } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [selectedCliente, setSelectedCliente] = useState<Cliente | null>(null);
  const [historial, setHistorial] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isHistorialOpen, setIsHistorialOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<{
    cedula: string;
    tipo: 'venezolano' | 'extranjero';
    nombre: string;
    apellido: string;
    telefono: string;
    email: string;
    direccion: string;
    notas: string;
  }>({
    cedula: '',
    tipo: 'venezolano',
    nombre: '',
    apellido: '',
    telefono: '',
    email: '',
    direccion: '',
    notas: '',
  });

  useEffect(() => {
    loadClientes();
  }, []);

  useEffect(() => {
    const filtered = clientes.filter((c) =>
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cedula.includes(searchTerm) ||
      c.telefono.includes(searchTerm)
    );
    setFilteredClientes(filtered);
  }, [searchTerm, clientes]);

  const loadClientes = async () => {
    try {
      const data = await api.getClientes();
      setClientes(data);
      setFilteredClientes(data);
    } catch (error) {
      toast.error('Error al cargar clientes');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (selectedCliente) {
        await api.updateCliente(selectedCliente.id, formData);
        toast.success('Cliente actualizado');
      } else {
        await api.createCliente(formData);
        toast.success('Cliente creado');
      }

      await loadClientes();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Error al guardar cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedCliente || !hasPermission('delete')) return;

    try {
      await api.deleteCliente(selectedCliente.id);
      toast.success('Cliente eliminado');
      await loadClientes();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar cliente');
    }
  };

  const loadHistorial = async (cliente: Cliente) => {
    try {
      const data = await api.getClienteHistorial(cliente.id);
      setHistorial(data);
      setSelectedCliente(cliente);
      setIsHistorialOpen(true);
    } catch (error) {
      toast.error('Error al cargar historial');
    }
  };

  const resetForm = () => {
    setFormData({
      cedula: '',
      tipo: 'venezolano',
      nombre: '',
      apellido: '',
      telefono: '',
      email: '',
      direccion: '',
      notas: '',
    });
    setSelectedCliente(null);
    setIsCreating(false);
  };

  const handleEdit = (cliente: Cliente) => {
    setSelectedCliente(cliente);
    setFormData({
      cedula: cliente.cedula,
      tipo: cliente.tipo,
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      telefono: cliente.telefono,
      email: cliente.email || '',
      direccion: cliente.direccion || '',
      notas: cliente.notas || '',
    });
    setIsCreating(false);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Gestión de Clientes</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreating(true)} disabled={!hasPermission('create')}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isCreating ? 'Nuevo Cliente' : 'Editar Cliente'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Cédula *</Label>
                  <Input
                    required
                    placeholder="V-12345678 o E-12345678"
                    value={formData.cedula}
                    onChange={(e) => setFormData({ ...formData, cedula: e.target.value })}
                    disabled={!isCreating}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo *</Label>
                  <Select value={formData.tipo} onValueChange={(v: any) => setFormData({ ...formData, tipo: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="venezolano">Venezolano</SelectItem>
                      <SelectItem value="extranjero">Extranjero</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Apellido *</Label>
                  <Input
                    required
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Teléfono *</Label>
                  <Input
                    required
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Notas</Label>
                <Textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Información adicional del cliente"
                />
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
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Guardando...' : 'Guardar'}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, cédula o teléfono..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cédula</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClientes.map((cliente) => (
                <TableRow key={cliente.id}>
                  <TableCell className="font-medium">{cliente.cedula}</TableCell>
                  <TableCell>{cliente.nombre} {cliente.apellido}</TableCell>
                  <TableCell>{cliente.telefono}</TableCell>
                  <TableCell>{cliente.email || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => loadHistorial(cliente)}
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                      {hasPermission('update') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(cliente)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isHistorialOpen} onOpenChange={setIsHistorialOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Historial de {selectedCliente?.nombre} {selectedCliente?.apellido}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {historial.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No hay citas registradas</p>
            ) : (
              historial.map((cita) => {
                const materiales = cita.materiales ? JSON.parse(cita.materiales) : [];
                return (
                  <Card key={cita.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{cita.titulo}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(cita.fecha), 'dd/MM/yyyy HH:mm')} - {cita.duracion} min
                      </p>
                    </CardHeader>
                    <CardContent>
                      {cita.descripcion && (
                        <p className="text-sm mb-4">{cita.descripcion}</p>
                      )}
                      {materiales && materiales.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-2">Materiales Usados:</h4>
                          <ul className="list-disc list-inside space-y-1">
                            {materiales.map((m: any, i: number) => (
                              <li key={i} className="text-sm">
                                {m.productoNombre}: {m.cantidad} {m.unidadMedida}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
