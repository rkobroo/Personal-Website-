export async function onRequestGet(ctx) {
  const ns = ctx.env.VISITORS;
  if (!ns) {
    return new Response(JSON.stringify({ count: 0, error: 'KV not bound' }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
  }

  const key = 'total';
  let count = parseInt(await ns.get(key) || '0', 10);
  count += 1;
  await ns.put(key, count.toString());

  return new Response(JSON.stringify({ count }),
    { status: 200, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });
}
