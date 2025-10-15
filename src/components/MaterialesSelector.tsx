import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Search } from 'lucide-react';
import type { Producto } from '@/types';

interface MaterialSeleccionado {
  productoId: string;
  productoNombre: string;
  cantidad: number;
  unidadMedida: string;
  cantidadDisponible: number;
}

interface MaterialesSelectorProps {
  productos: Producto[];
  materialesSeleccionados: MaterialSeleccionado[];
  onMaterialesChange: (materiales: MaterialSeleccionado[]) => void;
}

export function MaterialesSelector({ productos, materialesSeleccionados, onMaterialesChange }: MaterialesSelectorProps) {
  const [busqueda, setBusqueda] = useState('');
  const [cantidadTemp, setCantidadTemp] = useState<{ [key: string]: string }>({});

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const handleAgregarMaterial = (producto: Producto) => {
    const cantidad = Number(cantidadTemp[producto.id] || 0);

    if (cantidad <= 0) {
      return;
    }

    if (cantidad > producto.cantidadTotal) {
      alert(`Solo hay ${producto.cantidadTotal} ${producto.unidadMedida} disponibles`);
      return;
    }

    const yaExiste = materialesSeleccionados.find(m => m.productoId === producto.id);

    if (yaExiste) {
      const nuevaCantidad = yaExiste.cantidad + cantidad;
      if (nuevaCantidad > producto.cantidadTotal) {
        alert(`Solo hay ${producto.cantidadTotal} ${producto.unidadMedida} disponibles`);
        return;
      }

      onMaterialesChange(
        materialesSeleccionados.map(m =>
          m.productoId === producto.id
            ? { ...m, cantidad: nuevaCantidad }
            : m
        )
      );
    } else {
      onMaterialesChange([
        ...materialesSeleccionados,
        {
          productoId: producto.id,
          productoNombre: producto.nombre,
          cantidad,
          unidadMedida: producto.unidadMedida,
          cantidadDisponible: producto.cantidadTotal,
        },
      ]);
    }

    setCantidadTemp({ ...cantidadTemp, [producto.id]: '' });
  };

  const handleEliminarMaterial = (productoId: string) => {
    onMaterialesChange(materialesSeleccionados.filter(m => m.productoId !== productoId));
  };

  const handleActualizarCantidad = (productoId: string, nuevaCantidad: number) => {
    const material = materialesSeleccionados.find(m => m.productoId === productoId);
    if (!material) return;

    if (nuevaCantidad > material.cantidadDisponible) {
      alert(`Solo hay ${material.cantidadDisponible} ${material.unidadMedida} disponibles`);
      return;
    }

    onMaterialesChange(
      materialesSeleccionados.map(m =>
        m.productoId === productoId
          ? { ...m, cantidad: nuevaCantidad }
          : m
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Buscador de productos */}
      <div className="space-y-2">
        <Label>Buscar Producto</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Lista de productos disponibles */}
      {busqueda && (
        <div className="border rounded-lg max-h-60 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Disponible</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    No se encontraron productos
                  </TableCell>
                </TableRow>
              ) : (
                productosFiltrados.map((producto) => (
                  <TableRow key={producto.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{producto.nombre}</p>
                        {producto.descripcion && (
                          <p className="text-xs text-muted-foreground">{producto.descripcion}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={producto.cantidadTotal > 0 ? 'default' : 'destructive'}>
                        {producto.cantidadTotal} {producto.unidadMedida}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max={producto.cantidadTotal}
                        placeholder="0"
                        value={cantidadTemp[producto.id] || ''}
                        onChange={(e) => setCantidadTemp({ ...cantidadTemp, [producto.id]: e.target.value })}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => handleAgregarMaterial(producto)}
                        disabled={!cantidadTemp[producto.id] || Number(cantidadTemp[producto.id]) <= 0}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Materiales seleccionados */}
      {materialesSeleccionados.length > 0 && (
        <div className="space-y-2">
          <Label>Materiales Seleccionados ({materialesSeleccionados.length})</Label>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {materialesSeleccionados.map((material) => (
                  <TableRow key={material.productoId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{material.productoNombre}</p>
                        <p className="text-xs text-muted-foreground">
                          Disponible: {material.cantidadDisponible} {material.unidadMedida}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max={material.cantidadDisponible}
                          value={material.cantidad}
                          onChange={(e) => handleActualizarCantidad(material.productoId, Number(e.target.value))}
                          className="w-24"
                        />
                        <span className="text-sm text-muted-foreground">{material.unidadMedida}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEliminarMaterial(material.productoId)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
