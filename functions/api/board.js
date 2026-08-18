// Cloudflare Pages Function — API del tablero de planificación semanal
// Requiere un binding de KV llamado BOARD_KV (Settings > Functions > KV namespace bindings)

const DEFAULT_DATA = {
  tasks: [],
  tecnicos: ['Felipe Yañez', 'Alain Ramírez', 'Sabino Aliste', 'Hernán García']
};

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store'
};

export async function onRequestGet(context) {
  const stored = await context.env.BOARD_KV.get('board-data');
  return new Response(stored || JSON.stringify(DEFAULT_DATA), {
    headers: JSON_HEADERS
  });
}

export async function onRequestPost(context) {
  const body = await context.request.text();

  // Guarda: no aceptar payloads vacíos o malformados
  let data;
  try {
    data = JSON.parse(body);
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'JSON inválido' }), {
      status: 400,
      headers: JSON_HEADERS
    });
  }

  if (!data || !Array.isArray(data.tasks)) {
    return new Response(JSON.stringify({ ok: false, error: 'Falta el arreglo tasks' }), {
      status: 400,
      headers: JSON_HEADERS
    });
  }

  // Respaldo de la versión anterior antes de sobrescribir
  const anterior = await context.env.BOARD_KV.get('board-data');
  if (anterior) {
    await context.env.BOARD_KV.put('board-data-prev', anterior);
  }

  await context.env.BOARD_KV.put('board-data', body);

  return new Response(JSON.stringify({ ok: true, tasks: data.tasks.length }), {
    headers: JSON_HEADERS
  });
}
