// Cloudflare Pages Function — API del tablero de planificación semanal
// Requiere un binding de KV llamado BOARD_KV (Settings > Functions > KV namespace bindings)

const DEFAULT_DATA = {
  tasks: [],
  tecnicos: ['Hernán', 'Felipe', 'Sabino', 'Alain', 'Beto']
};

export async function onRequestGet(context) {
  const stored = await context.env.BOARD_KV.get('board-data');
  return new Response(stored || JSON.stringify(DEFAULT_DATA), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function onRequestPost(context) {
  const body = await context.request.text();
  await context.env.BOARD_KV.put('board-data', body);
  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
