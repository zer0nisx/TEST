import db from './database';

const server = Bun.serve({
  port: 3001,
  async fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;

    // CORS headers
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
      return new Response(null, { headers });
    }

    try {
      // AUTH ROUTES
      if (path === '/api/auth/login' && req.method === 'POST') {
        const { username, password } = await req.json();
        const user = db.query('SELECT * FROM users WHERE username = ? AND password = ?').get(username, password) as any;

        if (user) {
          const { password: _, ...userWithoutPassword } = user;
          return new Response(JSON.stringify({
            success: true,
            user: {
              ...userWithoutPassword,
              customPermissions: user.custom_permissions ? JSON.parse(user.custom_permissions) : undefined
            }
          }), { headers });
        }
        return new Response(JSON.stringify({ success: false, message: 'Credenciales inválidas' }), { status: 401, headers });
      }

      // CLIENTES ROUTES
      if (path === '/api/clientes' && req.method === 'GET') {
        const clientes = db.query('SELECT * FROM clientes ORDER BY created_at DESC').all();
        return new Response(JSON.stringify(clientes), { headers });
      }

      if (path === '/api/clientes' && req.method === 'POST') {
        const cliente = await req.json();
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        db.run(
          `INSERT INTO clientes (id, cedula, tipo, nombre, apellido, telefono, email, direccion, notas, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, cliente.cedula, cliente.tipo, cliente.nombre, cliente.apellido, cliente.telefono,
           cliente.email || null, cliente.direccion || null, cliente.notas || null, now, now]
        );

        const newCliente = db.query('SELECT * FROM clientes WHERE id = ?').get(id);
        return new Response(JSON.stringify(newCliente), { headers });
      }

      if (path.startsWith('/api/clientes/cedula/') && req.method === 'GET') {
        const cedula = path.split('/').pop();
        const cliente = db.query('SELECT * FROM clientes WHERE cedula = ?').get(cedula);
        return new Response(JSON.stringify(cliente || null), { headers });
      }

      if (path.startsWith('/api/clientes/') && req.method === 'PUT') {
        const id = path.split('/').pop();
        const updates = await req.json();
        const now = new Date().toISOString();

        db.run(
          `UPDATE clientes SET nombre = ?, apellido = ?, telefono = ?, email = ?,
           direccion = ?, notas = ?, updated_at = ? WHERE id = ?`,
          [updates.nombre, updates.apellido, updates.telefono, updates.email || null,
           updates.direccion || null, updates.notas || null, now, id]
        );

        const updated = db.query('SELECT * FROM clientes WHERE id = ?').get(id);
        return new Response(JSON.stringify(updated), { headers });
      }

      if (path.startsWith('/api/clientes/') && req.method === 'DELETE') {
        const id = path.split('/').pop();
        db.run('DELETE FROM clientes WHERE id = ?', [id]);
        return new Response(JSON.stringify({ success: true }), { headers });
      }

      // CITAS ROUTES
      if (path === '/api/citas' && req.method === 'GET') {
        const citas = db.query(`
          SELECT c.*, cl.nombre as cliente_nombre, cl.apellido as cliente_apellido
          FROM citas c
          LEFT JOIN clientes cl ON c.cliente_id = cl.id
          ORDER BY c.fecha ASC
        `).all();

        // Obtener materiales usados para cada cita
        const citasConMateriales = citas.map((cita: any) => {
          const materiales = db.query('SELECT * FROM materiales_usados WHERE cita_id = ?').all(cita.id);
          return { ...cita, materialesUsados: materiales };
        });

        return new Response(JSON.stringify(citasConMateriales), { headers });
      }

      if (path === '/api/citas' && req.method === 'POST') {
        const cita = await req.json();
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        db.run(
          `INSERT INTO citas (id, cliente_id, titulo, descripcion, fecha, duracion, color, estado, created_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, cita.clienteId, cita.titulo, cita.descripcion || null, cita.fecha, cita.duracion,
           cita.color || null, cita.estado || 'programada', cita.createdBy, now, now]
        );

        const newCita = db.query('SELECT * FROM citas WHERE id = ?').get(id);
        return new Response(JSON.stringify(newCita), { headers });
      }

      if (path.startsWith('/api/citas/') && req.method === 'PUT') {
        const id = path.split('/').pop();
        const updates = await req.json();
        const now = new Date().toISOString();

        db.run(
          `UPDATE citas SET titulo = ?, descripcion = ?, fecha = ?, duracion = ?,
           color = ?, estado = ?, updated_at = ? WHERE id = ?`,
          [updates.titulo, updates.descripcion || null, updates.fecha, updates.duracion,
           updates.color || null, updates.estado, now, id]
        );

        const updated = db.query('SELECT * FROM citas WHERE id = ?').get(id);
        return new Response(JSON.stringify(updated), { headers });
      }

      if (path.startsWith('/api/citas/') && req.method === 'DELETE') {
        const id = path.split('/').pop();
        db.run('DELETE FROM materiales_usados WHERE cita_id = ?', [id]);
        db.run('DELETE FROM citas WHERE id = ?', [id]);
        return new Response(JSON.stringify({ success: true }), { headers });
      }

      // Verificar conflictos de horario
      if (path === '/api/citas/check-conflict' && req.method === 'POST') {
        const { fecha, duracion, excludeId } = await req.json();
        const fechaInicio = new Date(fecha);
        const fechaFin = new Date(fechaInicio.getTime() + duracion * 60000);

        let query = `
          SELECT * FROM citas
          WHERE estado != 'cancelada'
          AND datetime(fecha) < datetime(?)
          AND datetime(fecha, '+' || duracion || ' minutes') > datetime(?)
        `;

        const params: any[] = [fechaFin.toISOString(), fechaInicio.toISOString()];

        if (excludeId) {
          query += ' AND id != ?';
          params.push(excludeId);
        }

        const conflicts = db.query(query).all(...params);
        return new Response(JSON.stringify({ hasConflict: conflicts.length > 0, conflicts }), { headers });
      }

      // PRODUCTOS ROUTES
      if (path === '/api/productos' && req.method === 'GET') {
        const productos = db.query('SELECT * FROM productos ORDER BY nombre ASC').all();
        const productosConLotes = productos.map((p: any) => {
          const lotes = db.query('SELECT * FROM lotes WHERE producto_id = ?').all(p.id);
          return { ...p, lotes };
        });
        return new Response(JSON.stringify(productosConLotes), { headers });
      }

      if (path === '/api/productos' && req.method === 'POST') {
        const producto = await req.json();
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        db.run(
          `INSERT INTO productos (id, nombre, descripcion, unidad_medida, cantidad_total, cantidad_minima, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, producto.nombre, producto.descripcion || null, producto.unidadMedida,
           producto.cantidadTotal || 0, producto.cantidadMinima || null, now, now]
        );

        const newProducto = db.query('SELECT * FROM productos WHERE id = ?').get(id);
        return new Response(JSON.stringify(newProducto), { headers });
      }

      if (path.startsWith('/api/productos/') && req.method === 'DELETE') {
        const id = path.split('/').pop();
        db.run('DELETE FROM lotes WHERE producto_id = ?', [id]);
        db.run('DELETE FROM productos WHERE id = ?', [id]);
        return new Response(JSON.stringify({ success: true }), { headers });
      }

      // LOTES ROUTES
      if (path === '/api/lotes' && req.method === 'POST') {
        const lote = await req.json();
        const id = crypto.randomUUID();

        db.run(
          `INSERT INTO lotes (id, producto_id, cantidad, fecha_ingreso, fecha_vencimiento, numero_lote, proveedor, notas)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, lote.productoId, lote.cantidad, lote.fechaIngreso, lote.fechaVencimiento || null,
           lote.numeroLote || null, lote.proveedor || null, lote.notas || null]
        );

        // Actualizar cantidad total del producto
        db.run(
          'UPDATE productos SET cantidad_total = cantidad_total + ? WHERE id = ?',
          [lote.cantidad, lote.productoId]
        );

        const newLote = db.query('SELECT * FROM lotes WHERE id = ?').get(id);
        return new Response(JSON.stringify(newLote), { headers });
      }

      // MOVIMIENTOS INVENTARIO
      if (path === '/api/movimientos' && req.method === 'POST') {
        const mov = await req.json();
        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        db.run(
          `INSERT INTO movimientos_inventario (id, producto_id, tipo, cantidad, lote_id, cita_id, asignado_a_cita, motivo, realizado_por, fecha)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [id, mov.productoId, mov.tipo, mov.cantidad, mov.loteId || null, mov.citaId || null,
           mov.asignadoACita ? 1 : 0, mov.motivo || null, mov.realizadoPor, now]
        );

        // Actualizar cantidad del producto
        const multiplicador = mov.tipo === 'entrada' ? 1 : -1;
        db.run(
          'UPDATE productos SET cantidad_total = cantidad_total + ? WHERE id = ?',
          [mov.cantidad * multiplicador, mov.productoId]
        );

        // Si está asignado a una cita, registrar material usado
        if (mov.asignadoACita && mov.citaId) {
          const matId = crypto.randomUUID();
          db.run(
            `INSERT INTO materiales_usados (id, producto_id, cantidad, lote_id, cita_id, fecha, notas)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [matId, mov.productoId, mov.cantidad, mov.loteId || null, mov.citaId, now, mov.motivo || null]
          );
        }

        const newMov = db.query('SELECT * FROM movimientos_inventario WHERE id = ?').get(id);
        return new Response(JSON.stringify(newMov), { headers });
      }

      if (path === '/api/movimientos' && req.method === 'GET') {
        const movimientos = db.query(`
          SELECT m.*, p.nombre as producto_nombre, u.username as usuario
          FROM movimientos_inventario m
          LEFT JOIN productos p ON m.producto_id = p.id
          LEFT JOIN users u ON m.realizado_por = u.id
          ORDER BY m.fecha DESC
        `).all();
        return new Response(JSON.stringify(movimientos), { headers });
      }

      // HISTORIAL CLIENTE
      if (path.startsWith('/api/clientes/') && path.endsWith('/historial') && req.method === 'GET') {
        const id = path.split('/')[3];
        const citas = db.query(`
          SELECT c.*,
          (SELECT json_group_array(json_object(
            'id', m.id,
            'productoId', m.producto_id,
            'cantidad', m.cantidad,
            'productoNombre', p.nombre,
            'unidadMedida', p.unidad_medida
          ))
          FROM materiales_usados m
          LEFT JOIN productos p ON m.producto_id = p.id
          WHERE m.cita_id = c.id) as materiales
          FROM citas c
          WHERE c.cliente_id = ?
          ORDER BY c.fecha DESC
        `).all(id);

        return new Response(JSON.stringify(citas), { headers });
      }

      return new Response('Not Found', { status: 404, headers });
    } catch (error: any) {
      console.error('Error:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers });
    }
  },
});

console.log(`🚀 Server running on http://localhost:${server.port}`);
