const API_URL = 'http://localhost:3001/api';

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
    throw new Error(error.message || 'Error en la petición');
  }

  return response.json();
}

export const api = {
  // Auth
  login: (username: string, password: string) =>
    fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  // Clientes
  getClientes: () => fetchAPI('/clientes'),
  getClienteByCedula: (cedula: string) => fetchAPI(`/clientes/cedula/${cedula}`),
  createCliente: (cliente: any) =>
    fetchAPI('/clientes', {
      method: 'POST',
      body: JSON.stringify(cliente),
    }),
  updateCliente: (id: string, updates: any) =>
    fetchAPI(`/clientes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteCliente: (id: string) =>
    fetchAPI(`/clientes/${id}`, {
      method: 'DELETE',
    }),
  getClienteHistorial: (id: string) => fetchAPI(`/clientes/${id}/historial`),

  // Citas
  getCitas: () => fetchAPI('/citas'),
  createCita: (cita: any) =>
    fetchAPI('/citas', {
      method: 'POST',
      body: JSON.stringify(cita),
    }),
  updateCita: (id: string, updates: any) =>
    fetchAPI(`/citas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),
  deleteCita: (id: string) =>
    fetchAPI(`/citas/${id}`, {
      method: 'DELETE',
    }),
  checkConflict: (fecha: string, duracion: number, excludeId?: string) =>
    fetchAPI('/citas/check-conflict', {
      method: 'POST',
      body: JSON.stringify({ fecha, duracion, excludeId }),
    }),

  // Productos
  getProductos: () => fetchAPI('/productos'),
  createProducto: (producto: any) =>
    fetchAPI('/productos', {
      method: 'POST',
      body: JSON.stringify(producto),
    }),
  deleteProducto: (id: string) =>
    fetchAPI(`/productos/${id}`, {
      method: 'DELETE',
    }),

  // Lotes
  createLote: (lote: any) =>
    fetchAPI('/lotes', {
      method: 'POST',
      body: JSON.stringify(lote),
    }),

  // Movimientos
  getMovimientos: () => fetchAPI('/movimientos'),
  createMovimiento: (movimiento: any) =>
    fetchAPI('/movimientos', {
      method: 'POST',
      body: JSON.stringify(movimiento),
    }),
};
