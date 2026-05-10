import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as random from 'maath/random/dist/maath-random.esm';
import { useTheme } from './ThemeProvider';

function StarField(props: any) {
  const ref = useRef<any>(null);
  const [sphere] = useState(() => random.inSphere(new Float32Array(5000), { radius: 1.5 }));

  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.x -= delta / 10;
      ref.current.rotation.y -= delta / 15;
    }
  });

  return (
    <group rotation={[0, 0, Math.PI / 4]}>
      <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
        <PointMaterial transparent color="#3b82f6" size={0.005} sizeAttenuation={true} depthWrite={false} />
      </Points>
    </group>
  );
}

function GridPlane() {
  const gridRef = useRef<any>(null);

  useFrame((state, delta) => {
    if (gridRef.current) {
      gridRef.current.position.z = (gridRef.current.position.z + delta * 0.5) % 1;
    }
  });

  const planeGeo = useMemo(() => <planeGeometry args={[20, 20, 40, 40]} />, []);
  const bgGeo = useMemo(() => <planeGeometry args={[20, 20]} />, []);
  const gridMat = useMemo(() => <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.15} depthWrite={false} />, []);
  const bgMat = useMemo(() => <meshBasicMaterial color="#000000" transparent opacity={0.8} depthWrite={false} />, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} ref={gridRef}>
        {planeGeo}
        {gridMat}
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.01, 0]}>
        {bgGeo}
        {bgMat}
      </mesh>
    </group>
  );
}

function FloatingCandles() {
  const groupRef = useRef<any>(null);
  
  // Create random candles
  const candles = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
      position: [
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 5 - 2
      ] as [number, number, number],
      scale: Math.random() * 0.5 + 0.2,
      isUp: Math.random() > 0.5,
      speed: Math.random() * 0.2 + 0.1,
      rotationSpeed: (Math.random() - 0.5) * 0.02
    }));
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child: any, i: number) => {
        const candle = candles[i];
        child.position.y += Math.sin(state.clock.elapsedTime * candle.speed + i) * 0.01;
        child.rotation.y += candle.rotationSpeed;
      });
    }
  });

  const upMaterial = useMemo(() => <meshStandardMaterial color="#34d399" emissive="#34d399" emissiveIntensity={0.2} transparent opacity={0.6} />, []);
  const downMaterial = useMemo(() => <meshStandardMaterial color="#f87171" emissive="#f87171" emissiveIntensity={0.2} transparent opacity={0.6} />, []);
  const boxGeo = useMemo(() => <boxGeometry args={[0.2, 1, 0.2]} />, []);
  const lineGeo = useMemo(() => <boxGeometry args={[0.02, 1.8, 0.02]} />, []);

  return (
    <group ref={groupRef}>
      {candles.map((candle, i) => (
        <group key={i} position={candle.position} scale={candle.scale}>
          <mesh>
            {lineGeo}
            {candle.isUp ? upMaterial : downMaterial}
          </mesh>
          <mesh>
            {boxGeo}
            {candle.isUp ? upMaterial : downMaterial}
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function AnimatedBackground() {
  const { theme } = useTheme();

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden" aria-hidden="true">
      <Canvas 
        camera={{ position: [0, 0, 1] }} 
        dpr={[1, 1.5]} 
        performance={{ min: 0.5 }}
        gl={{ antialias: false }}
      >
        {/* Glow */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={0.5} />
        <StarField />
        <FloatingCandles />
        {/* Only show grid in darker themes or lower opacity */}
        <GridPlane />
      </Canvas>
    </div>
  );
}
