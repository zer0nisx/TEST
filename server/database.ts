import { Database } from 'bun:sqlite';

const db = new Database('agenda-citas.db', { create: true });

// Crear tablas
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
    custom_permissions TEXT,
    created_at TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS clientes (
    id TEXT PRIMARY KEY,
    cedula TEXT UNIQUE NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('venezolano', 'extranjero')),
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    telefono TEXT NOT NULL,
    email TEXT,
    direccion TEXT,
    notas TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS citas (
    id TEXT PRIMARY KEY,
    cliente_id TEXT NOT NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    fecha TEXT NOT NULL,
    duracion INTEGER NOT NULL,
    color TEXT,
    estado TEXT NOT NULL CHECK(estado IN ('programada', 'completada', 'cancelada')),
    created_by TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS productos (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    unidad_medida TEXT NOT NULL,
    cantidad_total REAL NOT NULL DEFAULT 0,
    cantidad_minima REAL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS lotes (
    id TEXT PRIMARY KEY,
    producto_id TEXT NOT NULL,
    cantidad REAL NOT NULL,
    fecha_ingreso TEXT NOT NULL,
    fecha_vencimiento TEXT,
    numero_lote TEXT,
    proveedor TEXT,
    notas TEXT,
    FOREIGN KEY (producto_id) REFERENCES productos(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS materiales_usados (
    id TEXT PRIMARY KEY,
    producto_id TEXT NOT NULL,
    cantidad REAL NOT NULL,
    lote_id TEXT,
    cita_id TEXT,
    fecha TEXT NOT NULL,
    notas TEXT,
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (lote_id) REFERENCES lotes(id),
    FOREIGN KEY (cita_id) REFERENCES citas(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id TEXT PRIMARY KEY,
    producto_id TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('entrada', 'salida')),
    cantidad REAL NOT NULL,
    lote_id TEXT,
    cita_id TEXT,
    asignado_a_cita INTEGER NOT NULL DEFAULT 0,
    motivo TEXT,
    realizado_por TEXT NOT NULL,
    fecha TEXT NOT NULL,
    FOREIGN KEY (producto_id) REFERENCES productos(id),
    FOREIGN KEY (lote_id) REFERENCES lotes(id),
    FOREIGN KEY (cita_id) REFERENCES citas(id),
    FOREIGN KEY (realizado_por) REFERENCES users(id)
  )
`);

// Función para hashear contraseñas
function hashPassword(password: string): string {
  const hasher = new Bun.CryptoHasher('sha256');
  hasher.update(password);
  return hasher.digest('hex');
}

// Insertar usuarios por defecto si no existen
const adminExists = db.query('SELECT id FROM users WHERE username = ?').get('admin');
if (!adminExists) {
  const adminId = crypto.randomUUID();
  const hashedPassword = hashPassword('123456');
  db.run(
    'INSERT INTO users (id, username, password, role, created_at) VALUES (?, ?, ?, ?, ?)',
    [adminId, 'admin', hashedPassword, 'admin', new Date().toISOString()]
  );

  const userId = crypto.randomUUID();
  db.run(
    'INSERT INTO users (id, username, password, role, custom_permissions, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, 'usuario', hashedPassword, 'user', JSON.stringify(['create', 'read']), new Date().toISOString()]
  );
}

export { hashPassword };

export default db;
