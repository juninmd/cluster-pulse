// Self-contained dashboard page. Polls /api/status and renders a status grid.
export const dashboardHtml = /* html */ `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>cluster-pulse</title>
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 14px/1.5 ui-sans-serif, system-ui, sans-serif; background: #0b0f17; color: #e5e7eb; }
  header { padding: 20px 24px; border-bottom: 1px solid #1f2937; display: flex; align-items: baseline; gap: 12px; }
  header h1 { margin: 0; font-size: 18px; letter-spacing: .3px; }
  header .sub { color: #6b7280; font-size: 12px; }
  main { padding: 20px 24px; display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 14px; }
  .card { background: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 14px 16px; }
  .row { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
  .name { font-weight: 600; }
  .dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
  .up { background: #22c55e; box-shadow: 0 0 8px #22c55e88; }
  .down { background: #ef4444; box-shadow: 0 0 8px #ef444488; }
  .unknown { background: #6b7280; }
  .meta { color: #9ca3af; font-size: 12px; margin-top: 6px; display: flex; gap: 14px; flex-wrap: wrap; }
  .spark { display: flex; gap: 2px; margin-top: 10px; height: 22px; align-items: flex-end; }
  .spark i { width: 4px; border-radius: 1px; background: #22c55e; }
  .spark i.d { background: #ef4444; height: 6px !important; }
  .tls-warn { color: #f59e0b; }
  .tls-crit { color: #ef4444; }
  a { color: #60a5fa; text-decoration: none; }
  .empty { grid-column: 1/-1; color: #6b7280; text-align: center; padding: 40px; }
  footer { padding: 12px 24px; color: #4b5563; font-size: 12px; }
</style>
</head>
<body>
<header>
  <h1>🌐 cluster-pulse</h1>
  <span class="sub" id="sub">carregando…</span>
</header>
<main id="grid"><div class="empty">carregando…</div></main>
<footer>atualiza a cada 15s · <a href="/api/status">/api/status</a></footer>
<script>
function spark(history) {
  return '<div class="spark">' + history.slice(-30).map(function(up){
    var h = up ? (8 + Math.round(Math.random()*10)) : 6;
    return '<i class="' + (up?'':'d') + '" style="height:' + h + 'px"></i>';
  }).join('') + '</div>';
}
function esc(s) {
  return String(s).replace(/[&<>"']/g, function(c){ return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; });
}
function tlsLabel(d) {
  if (d === null || d === undefined) return '';
  var cls = d <= 7 ? 'tls-crit' : d <= 14 ? 'tls-warn' : '';
  return '<span class="' + cls + '">TLS ' + d + 'd</span>';
}
async function load() {
  try {
    var res = await fetch('/api/status');
    var data = await res.json();
    var grid = document.getElementById('grid');
    document.getElementById('sub').textContent = data.targets.length + ' alvos · ' +
      data.targets.filter(function(t){return t.up;}).length + ' up';
    if (!data.targets.length) { grid.innerHTML = '<div class="empty">Nenhum TARGETS configurado.</div>'; return; }
    grid.innerHTML = data.targets.map(function(t){
      var cls = t.up === null ? 'unknown' : t.up ? 'up' : 'down';
      return '<div class="card">' +
        '<div class="row"><span class="name"><span class="dot ' + cls + '"></span> ' + esc(t.name) + '</span>' +
        '<span class="meta">' + (t.up ? t.latencyMs + 'ms' : esc(t.error || 'down')) + '</span></div>' +
        '<div class="meta"><span>HTTP ' + (t.status||'-') + '</span><span>uptime ' + t.uptimePct + '%</span>' + tlsLabel(t.tlsDaysLeft) + '</div>' +
        spark(t.history) +
      '</div>';
    }).join('');
  } catch (e) {
    document.getElementById('sub').textContent = 'erro ao carregar';
  }
}
load();
setInterval(load, 15000);
</script>
</body>
</html>`;
