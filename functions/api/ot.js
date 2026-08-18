export async function onRequestPost(context) {
  try {
    // 1. Validación de token compartido
    const token = context.request.headers.get('x-ot-token');
    if (!token || token !== context.env.OT_TOKEN) {
      return new Response(JSON.stringify({ ok: false, error: 'no autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const ot = await context.request.json();

    // 2. Sin folio no se procesa: evita colisiones de tarjetas
    if (!ot.folio) {
      return new Response(JSON.stringify({ ok: false, error: 'falta folio' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const stored = await context.env.BOARD_KV.get('board-data');
    const data = stored ? JSON.parse(stored) : { tasks: [], tecnicos: [] };
    if (!Array.isArray(data.tasks)) data.tasks = [];

    // 3. Búsqueda por id o por folio
    const idOT = 'ot_' + ot.folio;
    const idx = data.tasks.findIndex(t => t.id === idOT || (t.folio && t.folio === ot.folio));

    // 4. Solo se escriben los campos que efectivamente llegaron en el payload
    const tarea = { id: idOT, folio: ot.folio };
    if (ot.fecha !== undefined) tarea.fecha = ot.fecha;
    if (ot.tecnico !== undefined) tarea.tecnico = ot.tecnico;
    if (ot.cliente !== undefined) tarea.cliente = ot.cliente;
    if (ot.sitio !== undefined || ot.ventana !== undefined) {
      tarea.actividad = (ot.sitio || '') + (ot.ventana ? ' — ' + ot.ventana : '');
    }
    if (ot.descripcion !== undefined) tarea.descripcion = ot.descripcion;
    if (ot.url !== undefined) tarea.url = ot.url;
    tarea.estado = ot.estado || (idx >= 0 ? data.tasks[idx].estado : 'Pendiente');

    if (idx >= 0) {
      data.tasks[idx] = { ...data.tasks[idx], ...tarea };
    } else {
      data.tasks.push(tarea);
    }

    await context.env.BOARD_KV.put('board-data', JSON.stringify(data));

    return new Response(JSON.stringify({ ok: true, folio: ot.folio }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
