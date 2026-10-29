import { usePathname } from 'expo-router';
import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing } from 'react-native';

// Orden de las pestañas: define la dirección del deslizamiento (D-035).
const PATHS: Record<string, string> = { index: '/', historial: '/historial', resumen: '/resumen', ajustes: '/ajustes' };
const ORDER = Object.keys(PATHS);
let lastIndex = 0;

/** Envuelve el contenido de una pestaña: al enfocarse, desliza suavemente desde
 *  el lado del botón tocado (derecha si avanza, izquierda si retrocede). */
export function TabSlide({ route, children }: { route: string; children: ReactNode }) {
  const focused = usePathname() === PATHS[route];
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!focused) return;
    const i = ORDER.indexOf(route);
    const dir = i >= lastIndex ? 1 : -1;
    lastIndex = i;
    anim.setValue(dir * 48);
    Animated.timing(anim, { toValue: 0, duration: 240, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [focused, route, anim]);
  return (
    <Animated.View style={{ flex: 1, transform: [{ translateX: anim }], opacity: anim.interpolate({ inputRange: [-48, 0, 48], outputRange: [0.3, 1, 0.3] }) }}>
      {children}
    </Animated.View>
  );
}
