import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
// @ts-ignore
import * as random from 'maath/random/dist/maath-random.esm';
import * as THREE from 'three';
import { useTheme } from './ThemeProvider';
import generatedLogo from '../assets/images/tradewhale_premium_logo_1779203248170.png';

function LogoFlakes() {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  
  useEffect(() => {
    new THREE.TextureLoader().load(generatedLogo, (tex) => {
      // @ts-ignore
      if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
      setTexture(tex);
    });
  }, []);

  const groupRef = useRef<THREE.Group>(null);
  const count = 50;

  const flakes = useMemo(() => {
    return Array.from({ length: count }).map(() => ({
      position: [
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 15,
        (Math.random() - 0.5) * 8 - 2
      ] as [number, number, number],
      rotation: [
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      ] as [number, number, number],
      scale: Math.random() * 0.4 + 0.1,
      speedXYZ: [
        (Math.random() - 0.5) * 0.2,
        -(Math.random() * 0.2 + 0.1),
        (Math.random() - 0.5) * 0.2
      ],
      rotSpeed: [
        (Math.random() - 0.5) * 0.015,
        (Math.random() - 0.5) * 0.015,
        (Math.random() - 0.5) * 0.015
      ]
    }));
  }, [count]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child: any, i: number) => {
        const flake = flakes[i];
        
        child.position.y += flake.speedXYZ[1] * delta * 2;
        child.position.x += flake.speedXYZ[0] * delta * 2;
        child.position.z += flake.speedXYZ[2] * delta * 2;
        
        child.rotation.x += flake.rotSpeed[0];
        child.rotation.y += flake.rotSpeed[1];
        child.rotation.z += flake.rotSpeed[2];
        
        // Wrap around bounds
        if (child.position.y < -8) child.position.y = 8;
        if (child.position.x > 8) child.position.x = -8;
        if (child.position.x < -8) child.position.x = 8;
        if (child.position.z > 2) child.position.z = -10;
        if (child.position.z < -10) child.position.z = 2;
      });
    }
  });

  if (!texture) return null;

  return (
    <group ref={groupRef}>
      {flakes.map((flake, i) => (
        <mesh key={i} position={flake.position} rotation={flake.rotation} scale={flake.scale}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial 
            map={texture} 
            transparent 
            opacity={0.15} 
            side={THREE.DoubleSide}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

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
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden flex items-center justify-center" aria-hidden="true">
      <div className="absolute inset-0">
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
          <LogoFlakes />
          <FloatingCandles />
          {/* Only show grid in darker themes or lower opacity */}
          <GridPlane />
        </Canvas>
      </div>
      
      {/* Huge Stunning 3D Floating Logo */}
      <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] dark:opacity-20 mix-blend-normal dark:mix-blend-screen pointer-events-none">
        <img 
          src={generatedLogo}
          alt=""
          className="w-[80vw] max-w-[800px] object-contain drop-shadow-[0_0_100px_rgba(56,189,248,0.4)]"
          style={{
            animation: "floatLogo 15s ease-in-out infinite, spinLogo 30s linear infinite",
            maskImage: "radial-gradient(circle at center, black 30%, transparent 70%)",
            WebkitMaskImage: "radial-gradient(circle at center, black 30%, transparent 70%)"
          }}
        />
      </div>
      
      <style>{`
        @keyframes floatLogo {
          0%, 100% { transform: translateY(0) scale(1) rotateX(10deg); filter: blur(4px) brightness(1); }
          50% { transform: translateY(-30px) scale(1.05) rotateX(-10deg); filter: blur(2px) brightness(1.2); }
        }
        @keyframes spinLogo {
          0% { transform: rotateY(0deg) translateZ(-100px); }
          100% { transform: rotateY(360deg) translateZ(-100px); }
        }
      `}</style>
    </div>
  );
}
