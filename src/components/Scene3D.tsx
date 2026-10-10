import { Suspense, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Grid, Html, Line, OrbitControls, Stars } from '@react-three/drei';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';
import type { LatLng, RankedHospital } from '../types';
import { toLocalKm } from '../lib/geo';

type NodeState = 'best' | 'ok' | 'bad';
const COLORS: Record<NodeState, string> = { best: '#22d3ee', ok: '#7aa2ff', bad: '#8a3446' };

interface SceneNode { r: RankedHospital; pos: THREE.Vector3; state: NodeState }

function PulseRing({ color, radius = 0.7, speed = 0.7 }: { color: string; radius?: number; speed?: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const t = (clock.elapsedTime * speed) % 1;
    m.scale.setScalar(1 + t * 1.9);
    (m.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - t);
  });
  return (
    <mesh ref={ref} rotation-x={-Math.PI / 2} position-y={0.03}>
      <ringGeometry args={[radius, radius + 0.05, 64]} />
      <meshBasicMaterial color={color} transparent depthWrite={false} />
    </mesh>
  );
}

function Patient() {
  return (
    <group>
      <mesh position-y={0.28}>
        <sphereGeometry args={[0.2, 32, 32]} />
        <meshStandardMaterial color="#ff3b57" emissive="#ff3b57" emissiveIntensity={2.2} />
      </mesh>
      <mesh position-y={1.6}>
        <cylinderGeometry args={[0.015, 0.015, 3.2, 8]} />
        <meshBasicMaterial color="#ff3b57" transparent opacity={0.5} />
      </mesh>
      <PulseRing color="#ff3b57" radius={0.35} speed={0.9} />
      <Html position={[0, 0.95, 0]} center style={{ pointerEvents: 'none' }}>
        <div className="rounded-full bg-brand px-2.5 py-0.5 text-[11px] font-bold text-white shadow-lg">Patient</div>
      </Html>
    </group>
  );
}

function Pillar({ node, selected, onSelect }: { node: SceneNode; selected: boolean; onSelect: (id: string) => void }) {
  const { r, pos, state } = node;
  const [hover, setHover] = useState(false);
  const mesh = useRef<THREE.Mesh>(null);
  const h = 0.55 + (r.hospital.loadPct / 100) * 2.1;
  const color = COLORS[state];

  useFrame((_, dt) => {
    const m = mesh.current;
    if (!m) return;
    const target = hover || selected ? 1.18 : 1;
    m.scale.x = THREE.MathUtils.damp(m.scale.x, target, 8, dt);
    m.scale.z = m.scale.x;
  });

  return (
    <group position={pos}>
      <mesh
        ref={mesh}
        position-y={h / 2}
        onClick={(e) => { e.stopPropagation(); onSelect(r.hospital.id); }}
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = 'auto'; }}
      >
        <cylinderGeometry args={[0.34, 0.34, h, 6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={state === 'best' ? 1.7 : selected ? 1 : 0.45} metalness={0.35} roughness={0.3} transparent opacity={0.94} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.02}>
        <ringGeometry args={[0.5, 0.56, 48]} />
        <meshBasicMaterial color={color} transparent opacity={selected ? 1 : 0.55} />
      </mesh>
      {state === 'best' && <PulseRing color={color} radius={0.6} />}
      <Html position={[0, h + 0.6, 0]} center style={{ pointerEvents: 'none' }} zIndexRange={[20, 0]}>
        <div className={`whitespace-nowrap rounded-xl px-2.5 py-1 text-center text-[11px] leading-tight shadow-xl ring-1 ring-inset ${state === 'best' ? 'bg-signal/90 text-slate-950 ring-white/40' : 'bg-slate-900/85 text-slate-100 ring-white/15'}`}>
          <div className="font-bold">{r.hospital.name.split(' ').slice(0, 2).join(' ')}</div>
          <div className="opacity-80">{r.etaMin} min · {r.hospital.loadPct}% load</div>
        </div>
      </Html>
    </group>
  );
}

function Route({ to }: { to: THREE.Vector3 }) {
  const curve = useMemo(() => {
    const from = new THREE.Vector3(0, 0.25, 0);
    const end = new THREE.Vector3(to.x, 0.25, to.z);
    const mid = from.clone().lerp(end, 0.5).setY(1.7);
    return new THREE.QuadraticBezierCurve3(from, mid, end);
  }, [to]);
  const points = useMemo(() => curve.getPoints(56), [curve]);
  const dots = [useRef<THREE.Mesh>(null), useRef<THREE.Mesh>(null)];
  useFrame(({ clock }) => {
    dots.forEach((d, i) => d.current?.position.copy(curve.getPoint((clock.elapsedTime * 0.28 + i * 0.5) % 1)));
  });
  return (
    <group>
      <Line points={points} color="#22d3ee" lineWidth={2.4} dashed dashSize={0.22} gapSize={0.14} transparent opacity={0.9} />
      {dots.map((d, i) => (
        <mesh key={i} ref={d}>
          <sphereGeometry args={[0.09, 16, 16]} />
          <meshBasicMaterial color="#d9fbff" />
        </mesh>
      ))}
    </group>
  );
}

interface Props {
  origin: LatLng;
  ranked: RankedHospital[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  triageActive: boolean;
}

export function Scene3D({ origin, ranked, selectedId, onSelect, triageActive }: Props) {
  const nodes = useMemo<SceneNode[]>(() => {
    const pts = ranked.map((r) => ({ r, ...toLocalKm(origin, r.hospital) }));
    const ext = Math.max(1, ...pts.flatMap((p) => [Math.abs(p.x), Math.abs(p.z)]));
    const k = 4.6 / ext;
    return pts.map((p, i) => ({
      r: p.r,
      pos: new THREE.Vector3(p.x * k, 0, p.z * k),
      state: (p.r.suitable ? (i === 0 && triageActive ? 'best' : 'ok') : 'bad') as NodeState,
    }));
  }, [ranked, origin, triageActive]);

  const best = nodes.find((n) => n.state === 'best');

  return (
    <div className="glass relative h-full min-h-[260px] overflow-hidden rounded-3xl">
      <Canvas camera={{ position: [0, 8.6, 12.8], fov: 42 }} dpr={[1, 2]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
        <color attach="background" args={['#060912']} />
        <fog attach="fog" args={['#060912', 13, 30]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[0, 9, 0]} intensity={80} color="#ff7a8c" />
        <pointLight position={[8, 4, -6]} intensity={40} color="#22d3ee" />
        <Suspense fallback={null}>
          <Stars radius={60} depth={30} count={1800} factor={3} fade speed={0.6} />
          <Grid position={[0, -0.01, 0]} args={[40, 40]} cellSize={0.6} sectionSize={3} cellColor="#16213d" sectionColor="#27407a" fadeDistance={26} fadeStrength={1.4} infiniteGrid />
          <Patient />
          {nodes.map((n) => <Pillar key={n.r.hospital.id} node={n} selected={n.r.hospital.id === selectedId} onSelect={onSelect} />)}
          {best && <Route to={best.pos} />}
          <EffectComposer multisampling={0}>
            <Bloom intensity={0.85} luminanceThreshold={0.22} mipmapBlur />
          </EffectComposer>
        </Suspense>
        <OrbitControls makeDefault enablePan={false} autoRotate autoRotateSpeed={0.45} minDistance={7} maxDistance={20} maxPolarAngle={Math.PI / 2.15} />
      </Canvas>

      <div className="pointer-events-none absolute left-4 top-3 text-xs text-slate-300">
        <div className="font-display text-sm font-semibold text-white">Live hospital map</div>
        <div className="text-slate-400">Tower height shows current load. Drag to rotate, click a tower to inspect.</div>
      </div>
      <div className="pointer-events-none absolute bottom-3 left-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-300">
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: COLORS.best }} />Recommended</span>
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: COLORS.ok }} />Suitable</span>
        <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full" style={{ background: COLORS.bad }} />Missing a required facility</span>
      </div>
    </div>
  );
}
