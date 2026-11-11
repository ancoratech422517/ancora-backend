import { useRef, useState, useEffect } from "react";
/* Graficos em SVG puro (sem dependencias) – cores fixas para o "Exportar SVG" funcionar fora da app */
export const kz = n => "KZ " + Math.round(+n || 0).toLocaleString("de-DE");
export const short = n => n >= 1e6 ? (n / 1e6).toFixed(1) + "M" : n >= 1e3 ? Math.round(n / 1e3) + "k" : Math.round(n);
const NS = "http://www.w3.org/2000/svg", PAL = ["#0d9488", "#f59e0b", "#6366f1", "#ef4444", "#14b8a6", "#94a3b8"], G = "#64748b";

/* mede o próprio SVG para o viewBox acompanhar o ecrã */
function useBox(w0, h0) {
  const ref = useRef(null), [s, setS] = useState([w0, h0]);
  useEffect(() => {
    const el = ref.current; if (!el || !window.ResizeObserver) return;
    const f = () => { const r = el.getBoundingClientRect(); if (r.width > 40 && r.height > 40) setS([Math.round(r.width), Math.round(r.height)]); };
    f(); const o = new ResizeObserver(f); o.observe(el); return () => o.disconnect();
  }, []);
  return [ref, ...s];
}

export function AreaChart({ data, id }) {
  const [ref, W, H] = useBox(640, 260), p = W < 420 ? 34 : 40, mx = Math.max(1, ...data.flatMap(x => [x.r, x.d]));
  const X = i => p + i * (W - 2 * p) / Math.max(1, data.length - 1), Y = v => H - p - v / mx * (H - 2 * p);
  const line = k => data.map((x, i) => `${i ? "L" : "M"}${X(i)},${Y(x[k])}`).join("");
  const col = { r: PAL[0], d: PAL[1] };
  return (
    <svg ref={ref} data-chart={id} viewBox={`0 0 ${W} ${H}`} xmlns={NS} fontFamily="sans-serif">
      {[0, 1, 2, 3].map(i => <g key={i}><line x1={p} x2={W - p} y1={Y(mx * i / 3)} y2={Y(mx * i / 3)} stroke="#e2e8f0" /><text x={p - 6} y={Y(mx * i / 3) + 4} fontSize="10" textAnchor="end" fill={G}>{short(mx * i / 3)}</text></g>)}
      {["r", "d"].map(k => <g key={k}>
        <path d={`${line(k)}L${X(data.length - 1)},${Y(0)}L${X(0)},${Y(0)}Z`} fill={col[k]} opacity=".12" />
        <path d={line(k)} fill="none" stroke={col[k]} strokeWidth="2.5" />
        {data.map((x, i) => <circle key={i} cx={X(i)} cy={Y(x[k])} r="3.5" fill="#fff" stroke={col[k]} strokeWidth="2"><title>{x.m}: {kz(x[k])}</title></circle>)}
      </g>)}
      {data.map((x, i) => <text key={i} x={X(i)} y={H - 14} fontSize="11" textAnchor="middle" fill={G}>{x.m}</text>)}
    </svg>
  );
}

export function BarChart({ data, id, fmt = v => v }) {
  const [ref, W, H] = useBox(400, 220), p = 30, mx = Math.max(1, ...data.map(x => x.valor)), bw = (W - 2 * p) / Math.max(1, data.length);
  return (
    <svg ref={ref} data-chart={id} viewBox={`0 0 ${W} ${H}`} xmlns={NS} fontFamily="sans-serif">
      {data.map((x, i) => { const h = x.valor / mx * (H - 2 * p - 16), cx = p + i * bw + bw / 2; return (
        <g key={i}>
          <rect x={cx - bw * .3} y={H - p - h} width={bw * .6} height={h} rx="6" fill={PAL[i % PAL.length]}><title>{x.nome}: {fmt(x.valor)}</title></rect>
          <text x={cx} y={H - p - h - 6} fontSize="12" fontWeight="700" textAnchor="middle" fill="#0f172a">{fmt(x.valor)}</text>
          <text x={cx} y={H - 10} fontSize="11" textAnchor="middle" fill={G}>{bw < 80 && x.nome.length > 9 ? x.nome.slice(0, 8) + "…" : x.nome}</text>
        </g>); })}
    </svg>
  );
}

export function Donut({ data, id }) {
  const tot = data.reduce((s, x) => s + x.valor, 0), R = 58, L = 2 * Math.PI * R; let o = 0;
  return (
    <svg data-chart={id} viewBox="0 0 320 170" xmlns={NS} fontFamily="sans-serif">
      <g transform="translate(85 85) rotate(-90)">
        {data.map((x, i) => { const l = tot ? x.valor / tot * L : 0, e = <circle key={i} r={R} fill="none" stroke={PAL[i % PAL.length]} strokeWidth="22" strokeDasharray={`${l} ${L - l}`} strokeDashoffset={-o} />; o += l; return e; })}
      </g>
      <text x="85" y="94" textAnchor="middle" fontSize="26" fontWeight="700" fill="#0f172a">{tot}</text>
      {data.map((x, i) => <g key={i}><rect x="185" y={42 + i * 26} width="12" height="12" rx="3" fill={PAL[i % PAL.length]} /><text x="205" y={53 + i * 26} fontSize="13" fill="#0f172a">{x.nome} ({x.valor})</text></g>)}
    </svg>
  );
}

/* botao "Exportar SVG": descarrega cada grafico visivel */
export function exportSvgs() {
  const l = document.querySelectorAll("svg[data-chart]");
  if (!l.length) return alert("Não há gráficos nesta página. Abra o Dashboard ou os Relatórios.");
  l.forEach(s => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(s)], { type: "image/svg+xml" }));
    a.download = `ancora-${s.dataset.chart}.svg`; a.click(); URL.revokeObjectURL(a.href);
  });
}
