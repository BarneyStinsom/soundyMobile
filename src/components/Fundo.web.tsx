// src/components/Fundo.web.tsx
// Versão WEB do fundo: mesma técnica do site (SVG + animação em CSS).
// O Expo usa este arquivo no navegador e o Fundo.tsx no celular.

const SEG = 400;
const AMP = 70;
const TOTAL = 34;

// mesmo desenho do scriptondas.js (gerado sempre igual, sem depender do tamanho da tela)
const PATHS = Array.from({ length: TOTAL }, (_, i) => {
  const y = 260 + i * 20;
  let d = `M -400 ${y}`;
  for (let x = -400; x < 2000; x += SEG) {
    d += ` C ${x + SEG * 0.25} ${y - AMP}, ${x + SEG * 0.75} ${y + AMP}, ${x + SEG} ${y}`;
  }
  return {
    d,
    duration: 9 + i * 0.5,
    delay: -i * 0.6,
    opacity: 0.12 + (i % 12) * 0.045,
  };
});

const CSS = `
@keyframes fluir-ondas {
  from { transform: translateX(0); }
  to   { transform: translateX(-${SEG}px); }
}
.onda-app {
  fill: none;
  stroke: #fff;
  stroke-width: 1.2;
  animation-name: fluir-ondas;
  animation-timing-function: linear;
  animation-iteration-count: infinite;
}
@media (prefers-reduced-motion: reduce) {
  .onda-app { animation: none; }
}
`;

export default function Fundo() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 20%, #000000 0%, #5E052C 100%)',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        style={{ width: '100%', height: '170%', display: 'block' }}
      >
        {PATHS.map((p, i) => (
          <path
            key={i}
            d={p.d}
            className="onda-app"
            style={{
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              opacity: p.opacity,
            }}
          />
        ))}
      </svg>
    </div>
  );
}