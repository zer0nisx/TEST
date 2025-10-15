import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Package, ArrowUpCircle, ArrowDownCircle, Trash2 } from 'lucide-react';
import type { Producto, UnidadMedida } from '@/types';
import { format } from 'date-fns';
import { MaterialesSelector } from '@/components/MaterialesSelector';

const UNIDADES: UnidadMedida[] = ['litros', 'kg', 'gramos', 'unidades', 'ml', 'mg', 'lb', 'oz'];

export function InventarioModule() {
  const { user, hasPermission } = useAuth();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [selectedProducto, setSelectedProducto] = useState<Producto | null>(null);
  const [citas, setCitas] = useState<any[]>([]);

  const [isProductoDialogOpen, setIsProductoDialogOpen] = useState(false);
  const [isLoteDialogOpen, setIsLoteDialogOpen] = useState(false);
  const [isMovimientoDialogOpen, setIsMovimientoDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [productoForm, setProductoForm] = useState({
    nombre: '',
    descripcion: '',
    unidadMedida: 'unidades' as UnidadMedida,
    cantidadMinima: '',
  });

  const [loteForm, setLoteForm] = useState({
    productoId: '',
    cantidad: '',
    fechaIngreso: new Date().toISOString().split('T')[0],
    fechaVencimiento: '',
    numeroLote: '',
    proveedor: '',
    notas: '',
  });

  const [movimientoForm, setMovimientoForm] = useState({
    citaId: '',
    asignadoACita: false,
    motivo: '',
  });

  const [materialesSeleccionados, setMaterialesSeleccionados] = useState<Array<{
    productoId: string;
    productoNombre: string;
    cantidad: number;
    unidadMedida: string;
    cantidadDisponible: number;
  }>>([]);

  useEffect(() => {
    loadProductos();
    loadMovimientos();
    loadCitas();
  }, []);

  const loadProductos = async () => {
    try {
      const data = await api.getProductos();
      setProductos(data);
    } catch (error) {
      toast.error('Error al cargar productos');
    }
  };

  const loadMovimientos = async () => {
    try {
      const data = await api.getMovimientos();
      setMovimientos(data);
    } catch (error) {
      toast.error('Error al cargar movimientos');
    }
  };

  const loadCitas = async () => {
    try {
      const data = await api.getCitas();
      setCitas(data.filter((c: any) => c.estado === 'programada'));
    } catch (error) {
      console.error('Error al cargar citas');
    }
  };

  const handleCreateProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.createProducto({
        ...productoForm,
        cantidadMinima: productoForm.cantidadMinima ? Number(productoForm.cantidadMinima) : null,
        cantidadTotal: 0,
      });
      toast.success('Producto creado');
      await loadProductos();
      setIsProductoDialogOpen(false);
      resetProductoForm();
    } catch (error) {
      toast.error('Error al crear producto');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLote = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.createLote({
        ...loteForm,
        cantidad: Number(loteForm.cantidad),
        fechaVencimiento: loteForm.fechaVencimiento || null,
      });
      toast.success('Lote ingresado');
      await loadProductos();
      await loadMovimientos();
      setIsLoteDialogOpen(false);
      resetLoteForm();
    } catch (error) {
      toast.error('Error al ingresar lote');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();

    if (materialesSeleccionados.length === 0) {
      toast.error('Debes seleccionar al menos un material');
      return;
    }

    setLoading(true);

    try {
      // Registrar cada material como un movimiento
      for (const material of materialesSeleccionados) {
        await api.createMovimiento({
          productoId: material.productoId,
          tipo: 'salida',
          cantidad: material.cantidad,
          loteId: null,
          citaId: movimientoForm.asignadoACita ? movimientoForm.citaId : null,
          asignadoACita: movimientoForm.asignadoACita,
          motivo: movimientoForm.motivo,
          realizadoPor: user?.id,
        });
      }

      toast.success(`${materialesSeleccionados.length} material(es) registrado(s)`);
      await loadProductos();
      await loadMovimientos();
      setIsMovimientoDialogOpen(false);
      resetMovimientoForm();
      setMaterialesSeleccionados([]);
    } catch (error) {
      toast.error('Error al registrar movimientos');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProducto = async (id: string) => {
    if (!hasPermission('delete')) return;

    try {
      await api.deleteProducto(id);
      toast.success('Producto eliminado');
      await loadProductos();
    } catch (error) {
      toast.error('Error al eliminar producto');
    }
  };

  const resetProductoForm = () => {
    setProductoForm({
      nombre: '',
      descripcion: '',
      unidadMedida: 'unidades',
      cantidadMinima: '',
    });
  };

  const resetLoteForm = () => {
    setLoteForm({
      productoId: '',
      cantidad: '',
      fechaIngreso: new Date().toISOString().split('T')[0],
      fechaVencimiento: '',
      numeroLote: '',
      proveedor: '',
      notas: '',
    });
  };

  const resetMovimientoForm = () => {
    setMovimientoForm({
      citaId: '',
      asignadoACita: false,
      motivo: '',
    });
    setMaterialesSeleccionados([]);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Gestión de Inventario</h2>
        <div className="flex gap-2">
          <Dialog open={isProductoDialogOpen} onOpenChange={setIsProductoDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!hasPermission('create')}>
                <Package className="mr-2 h-4 w-4" />
                Nuevo Producto
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Producto</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateProducto} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nombre *</Label>
                  <Input
                    required
                    value={productoForm.nombre}
                    onChange={(e) => setProductoForm({ ...productoForm, nombre: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descripción</Label>
                  <Textarea
                    value={productoForm.descripcion}
                    onChange={(e) => setProductoForm({ ...productoForm, descripcion: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Unidad de Medida *</Label>
                    <Select
                      value={productoForm.unidadMedida}
                      onValueChange={(v: UnidadMedida) => setProductoForm({ ...productoForm, unidadMedida: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {UNIDADES.map((u) => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Cantidad Mínima</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={productoForm.cantidadMinima}
                      onChange={(e) => setProductoForm({ ...productoForm, cantidadMinima: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsProductoDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    Crear
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isLoteDialogOpen} onOpenChange={setIsLoteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={!hasPermission('create')}>
                <ArrowUpCircle className="mr-2 h-4 w-4" />
                Ingresar Lote
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ingresar Lote</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateLote} className="space-y-4">
                <div className="space-y-2">
                  <Label>Producto *</Label>
                  <Select
                    value={loteForm.productoId}
                    onValueChange={(v) => setLoteForm({ ...loteForm, productoId: v })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {productos.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nombre} ({p.unidadMedida})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Cantidad *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      value={loteForm.cantidad}
                      onChange={(e) => setLoteForm({ ...loteForm, cantidad: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha Ingreso *</Label>
                    <Input
                      type="date"
                      required
                      value={loteForm.fechaIngreso}
                      onChange={(e) => setLoteForm({ ...loteForm, fechaIngreso: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Número de Lote</Label>
                    <Input
                      value={loteForm.numeroLote}
                      onChange={(e) => setLoteForm({ ...loteForm, numeroLote: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Fecha Vencimiento</Label>
                    <Input
                      type="date"
                      value={loteForm.fechaVencimiento}
                      onChange={(e) => setLoteForm({ ...loteForm, fechaVencimiento: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Proveedor</Label>
                  <Input
                    value={loteForm.proveedor}
                    onChange={(e) => setLoteForm({ ...loteForm, proveedor: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Notas</Label>
                  <Textarea
                    value={loteForm.notas}
                    onChange={(e) => setLoteForm({ ...loteForm, notas: e.target.value })}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsLoteDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    Ingresar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isMovimientoDialogOpen} onOpenChange={setIsMovimientoDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" disabled={!hasPermission('create')}>
                <ArrowDownCircle className="mr-2 h-4 w-4" />
                Sacar Materiales
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Registrar Salida de Materiales</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateMovimiento} className="space-y-4">
                <MaterialesSelector
                  productos={productos}
                  materialesSeleccionados={materialesSeleccionados}
                  onMaterialesChange={setMaterialesSeleccionados}
                />

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="asignar-cita"
                    checked={movimientoForm.asignadoACita}
                    onChange={(e) => setMovimientoForm({ ...movimientoForm, asignadoACita: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="asignar-cita">Asignar a una cita</Label>
                </div>

                {movimientoForm.asignadoACita && (
                  <div className="space-y-2">
                    <Label>Cita</Label>
                    <Select
                      value={movimientoForm.citaId}
                      onValueChange={(v) => setMovimientoForm({ ...movimientoForm, citaId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una cita" />
                      </SelectTrigger>
                      <SelectContent>
                        {citas.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.titulo} - {format(new Date(c.fecha), 'dd/MM/yyyy HH:mm')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Motivo</Label>
                  <Textarea
                    value={movimientoForm.motivo}
                    onChange={(e) => setMovimientoForm({ ...movimientoForm, motivo: e.target.value })}
                    placeholder="Razón de la salida de los materiales"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsMovimientoDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading || materialesSeleccionados.length === 0}>
                    Registrar ({materialesSeleccionados.length} {materialesSeleccionados.length === 1 ? 'material' : 'materiales'})
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="productos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="productos">Productos</TabsTrigger>
          <TabsTrigger value="movimientos">Movimientos</TabsTrigger>
        </TabsList>

        <TabsContent value="productos" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {productos.map((producto) => {
              const bajoCantidad = producto.cantidadMinima && producto.cantidadTotal < producto.cantidadMinima;

              return (
                <Card key={producto.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{producto.nombre}</CardTitle>
                        <p className="text-sm text-muted-foreground">{producto.descripcion}</p>
                      </div>
                      {hasPermission('delete') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProducto(producto.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Cantidad Total:</span>
                        <Badge variant={bajoCantidad ? 'destructive' : 'default'}>
                          {producto.cantidadTotal} {producto.unidadMedida}
                        </Badge>
                      </div>
                      {producto.cantidadMinima && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Cantidad Mínima:</span>
                          <span className="text-sm">{producto.cantidadMinima} {producto.unidadMedida}</span>
                        </div>
                      )}
                      {producto.lotes && producto.lotes.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm font-semibold mb-2">Lotes ({producto.lotes.length}):</p>
                          <div className="space-y-1">
                            {producto.lotes.map((lote: any) => (
                              <div key={lote.id} className="text-xs text-muted-foreground">
                                {lote.numeroLote || 'S/N'}: {lote.cantidad} {producto.unidadMedida}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="movimientos">
          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Producto</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Motivo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movimientos.map((mov) => (
                    <TableRow key={mov.id}>
                      <TableCell>{format(new Date(mov.fecha), 'dd/MM/yyyy HH:mm')}</TableCell>
                      <TableCell>
                        <Badge variant={mov.tipo === 'entrada' ? 'default' : 'secondary'}>
                          {mov.tipo === 'entrada' ? 'Entrada' : 'Salida'}
                        </Badge>
                      </TableCell>
                      <TableCell>{mov.producto_nombre}</TableCell>
                      <TableCell>{mov.cantidad}</TableCell>
                      <TableCell>{mov.usuario}</TableCell>
                      <TableCell className="max-w-xs truncate">{mov.motivo || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
