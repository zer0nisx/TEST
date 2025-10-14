// Tipos de Usuario y Autenticación
export type UserRole = 'admin' | 'user';

export type Permission = 'create' | 'read' | 'update' | 'delete';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  customPermissions?: Permission[];
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// Tipos de Cliente
export interface Cliente {
  id: string;
  cedula: string;
  tipo: 'venezolano' | 'extranjero';
  nombre: string;
  apellido: string;
  telefono: string;
  email?: string;
  direccion?: string;
  notas?: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos de Cita
export interface Cita {
  id: string;
  clienteId: string;
  titulo: string;
  descripcion?: string;
  fecha: string; // ISO string
  duracion: number; // minutos
  color?: string;
  materialesUsados?: MaterialUsado[];
  estado: 'programada' | 'completada' | 'cancelada';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Tipos de Inventario
export type UnidadMedida = 'litros' | 'kg' | 'gramos' | 'unidades' | 'ml' | 'mg' | 'lb' | 'oz';

export interface Producto {
  id: string;
  nombre: string;
  descripcion?: string;
  unidadMedida: UnidadMedida;
  cantidadTotal: number;
  cantidadMinima?: number;
  lotes: Lote[];
  createdAt: string;
  updatedAt: string;
}

export interface Lote {
  id: string;
  productoId: string;
  cantidad: number;
  fechaIngreso: string;
  fechaVencimiento?: string;
  numeroLote?: string;
  proveedor?: string;
  notas?: string;
}

export interface MaterialUsado {
  productoId: string;
  cantidad: number;
  loteId?: string;
  citaId?: string;
  fecha: string;
  notas?: string;
}

export interface MovimientoInventario {
  id: string;
  productoId: string;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  loteId?: string;
  citaId?: string;
  asignadoACita: boolean;
  motivo?: string;
  realizadoPor: string;
  fecha: string;
}
