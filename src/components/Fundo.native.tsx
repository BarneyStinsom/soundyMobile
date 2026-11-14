// src/components/Fundo.native.tsx
// Fundo com gradiente + ondas animadas (mesmo desenho do scriptondas.js do site)
// Versão nativa: usa react-native Animated + react-native-svg
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, Path, RadialGradient, Rect, Stop } from 'react-native-svg';

const SEG = 400;      // largura de uma "ondulação" (o laço se repete a cada 400)
const AMP = 70;       // altura da ondulação
const TOTAL = 34;     // quantidade de linhas, igual ao site
const LAYERS = 6;     // as linhas são agrupadas em camadas com velocidades diferentes
const VB_H = 900;     // altura do desenho (mesmo viewBox 1600x900 do site)

type LayerProps = {
  paths: { d: string; opacity: number }[];
  maxX: number;
  scale: number;
  duration: number;
  offset: number;
};

const Layer = memo(function Layer({ paths, maxX, scale, duration, offset }: LayerProps) {
  const x = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    x.setValue(0);
    const loop = Animated.loop(
      Animated.timing(x, {
        toValue: -SEG * scale, // anda exatamente 1 período => loop sem emenda
        duration,
        easing: Easing.linear,
        useNativeDriver: Platform.OS !== 'web',
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [x, scale, duration]);

  return (
    <Animated.View
      // Android: rasteriza a camada UMA vez como textura da GPU e só desliza a textura.
      // Sem isso o Android redesenha dezenas de curvas SVG a cada frame, trava a UI
      // e as trocas de aba aparecem atrasadas (mostrando a tela anterior).
      renderToHardwareTextureAndroid
      shouldRasterizeIOS
      style={{
        position: 'absolute',
        top: 0,
        left: -offset * scale,
        width: maxX * scale,
        height: VB_H * scale,
        transform: [{ translateX: x }],
      }}
    >
      <Svg width={maxX * scale} height={VB_H * scale} viewBox={`0 0 ${maxX} ${VB_H}`}>
        {paths.map((p, i) => (
          <Path key={i} d={p.d} fill="none" stroke="#fff" strokeWidth={1.5} strokeOpacity={p.opacity} />
        ))}
      </Svg>
    </Animated.View>
  );
});

export default function Fundo() {
  const { width, height } = useWindowDimensions();

  // na web o Expo renderiza uma vez no servidor, onde a tela tem tamanho 0.
  // Só desenhamos as ondas depois de montar no cliente, para não dar erro de hidratação.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const scale = height > 0 ? height / VB_H : 1;
  const maxX = Math.ceil((width / scale + 2 * SEG) / SEG) * SEG;

  const layers = useMemo(() => {
    const result: { d: string; opacity: number }[][] = Array.from({ length: LAYERS }, () => []);
    for (let i = 0; i < TOTAL; i++) {
      const y = 60 + i * 24;
      let d = `M 0 ${y}`;
      for (let x = 0; x < maxX; x += SEG) {
        d += ` C ${x + SEG * 0.25} ${y - AMP}, ${x + SEG * 0.75} ${y + AMP}, ${x + SEG} ${y}`;
      }
      result[i % LAYERS].push({ d, opacity: 0.12 + (i % 12) * 0.045 });
    }
    return result;
  }, [maxX]);

  // No nativo, sempre renderiza (não precisa de mounted check)
  if (width === 0 || height === 0) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="bg" cx="50%" cy="20%" rx="90%" ry="90%">
            <Stop offset="0" stopColor="#000" />
            <Stop offset="1" stopColor="#5E052C" />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#bg)" />
      </Svg>

      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
        {layers.map((paths, i) => (
          <Layer
            key={i}
            paths={paths}
            maxX={maxX}
            scale={scale}
            duration={(9 + i * 2.6) * 1000}
            offset={(i * 67) % SEG}
          />
        ))}
      </View>
    </View>
  );
}