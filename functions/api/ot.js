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

    // 3. Búsqueda segura: exige que el folio almacenado exista
    const idx = data.tasks.findIndex(t => t.folio && t.folio === ot.folio);

    const tarea = {
      id: 'ot_' + ot.folio,
      folio: ot.folio,
      fecha: ot.fecha,
      tecnico: ot.tecnico,
      cliente: ot.cliente,
      actividad: (ot.sitio || '') + (ot.ventana ? ' — ' + ot.ventana : ''),
      descripcion: ot.descripcion || '',
      estado: ot.estado || 'Pendiente',
      url: ot.url || ''
    };

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
