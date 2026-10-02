import React, { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { RotateCcw, Lightbulb, Gauge, Cog, Ruler, Download } from 'lucide-react';

type StudyParams = {
  sunTeeth: number;
  planetTeeth: number;
  moduleMm: number;
  inputRpm: number;
  inputTorqueNm: number;
};

function Gear({ radius, teeth, thickness, y, color }: { radius: number; teeth: number; thickness: number; y: number; color: string }) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]} position={[0, y, 0]}>
      <mesh>
        <cylinderGeometry args={[radius, radius, thickness, 72]} />
        <meshPhysicalMaterial color={color} metalness={0.88} roughness={0.24} clearcoat={0.22} />
      </mesh>
      {Array.from({ length: teeth }).map((_, i) => {
        const a = (i / teeth) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * (radius + 0.045), 0, Math.sin(a) * (radius + 0.045)]} rotation={[0, 0, a]}>
            <boxGeometry args={[0.07, thickness, 0.055]} />
            <meshPhysicalMaterial color={color} metalness={0.9} roughness={0.22} />
          </mesh>
        );
      })}
    </group>
  );
}

function PlanetaryPreview({ params }: { params: StudyParams }) {
  const derived = useMemo(() => {
    const ringTeeth = params.sunTeeth + params.planetTeeth * 2;
    const sunPitch = params.sunTeeth * params.moduleMm;
    const planetPitch = params.planetTeeth * params.moduleMm;
    const ringPitch = ringTeeth * params.moduleMm;
    const ratio = 1 + ringTeeth / params.sunTeeth;
    return { ringTeeth, sunPitch, planetPitch, ringPitch, ratio };
  }, [params]);

  const scale = Math.max(0.012, params.moduleMm / 6);

  return (
    <group scale={scale}>
      <Gear radius={derived.ringPitch / 20} teeth={Math.min(72, derived.ringTeeth)} thickness={0.22} y={0} color="#4b5563" />
      <Gear radius={derived.sunPitch / 20} teeth={Math.min(48, params.sunTeeth)} thickness={0.30} y={0.18} color="#d1d5db" />
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2;
        const orbit = (derived.sunPitch + derived.planetPitch) / 40;
        return (
          <group key={i} position={[Math.cos(a) * orbit, -0.02, Math.sin(a) * orbit]}>
            <Gear radius={derived.planetPitch / 20} teeth={Math.min(48, params.planetTeeth)} thickness={0.24} y={0} color="#9ca3af" />
          </group>
        );
      })}
      <mesh position={[0, 0.34, 0]}>
        <cylinderGeometry args={[Math.max(0.08, derived.sunPitch / 65), Math.max(0.08, derived.sunPitch / 65), 0.42, 32]} />
        <meshPhysicalMaterial color="#64748b" metalness={0.95} roughness={0.18} />
      </mesh>
    </group>
  );
}

export function ParametricInnovationLab() {
  const [params, setParams] = useState<StudyParams>({
    sunTeeth: 24,
    planetTeeth: 18,
    moduleMm: 2.0,
    inputRpm: 3000,
    inputTorqueNm: 150,
  });

  const derived = useMemo(() => {
    const ringTeeth = params.sunTeeth + params.planetTeeth * 2;
    const ratio = 1 + ringTeeth / params.sunTeeth;
    const carrierRpm = params.inputRpm / ratio;
    const idealCarrierTorque = params.inputTorqueNm * ratio;
    const approximatePitchDiameterMm = params.sunTeeth * params.moduleMm;
    const ringPitchDiameterMm = ringTeeth * params.moduleMm;
    const centerDistanceMm = (params.sunTeeth + params.planetTeeth) * params.moduleMm / 2;

    return {
      ringTeeth,
      ratio,
      carrierRpm,
      idealCarrierTorque,
      approximatePitchDiameterMm,
      ringPitchDiameterMm,
      centerDistanceMm,
    };
  }, [params]);

  const setValue = <K extends keyof StudyParams>(key: K, value: StudyParams[K]) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const reset = () => setParams({
    sunTeeth: 24,
    planetTeeth: 18,
    moduleMm: 2.0,
    inputRpm: 3000,
    inputTorqueNm: 150,
  });

  const exportStudy = () => {
    const payload = {
      study: 'Planetary Gearset Innovation Study',
      parameters: params,
      derived,
      note: 'This preview exposes the design equations; it is not a certified manufacturing drawing.'
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'advis-planetary-design-study.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-4 h-full min-h-0">
      <div className="flex items-start justify-between gap-3 border-b border-cyan-500/20 pb-3">
        <div>
          <h3 className="text-cyan-300 font-bold tracking-wider text-base flex items-center gap-2">
            <Lightbulb size={18} />
            INNOVATION LAB // PARAMETRIC PLANETARY STUDY
          </h3>
          <p className="text-xs text-cyan-400/65 font-mono mt-1 max-w-3xl">
            Change a design variable, watch the geometry update, and see the resulting kinematic relationship. This is the bridge from viewing a model to experimenting with one.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="px-2.5 py-2 rounded-lg border border-cyan-500/30 bg-slate-950/70 text-cyan-300 text-xs flex items-center gap-1.5">
            <RotateCcw size={13} />
            RESET
          </button>
          <button onClick={exportStudy} className="px-2.5 py-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 text-xs flex items-center gap-1.5">
            <Download size={13} />
            EXPORT STUDY
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[280px_1fr_300px] gap-3 flex-1 min-h-0">
        <div className="rounded-xl border border-cyan-500/20 bg-slate-950/75 p-4 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-widest text-cyan-400/60 mb-3">Design variables</div>
          {[
            { key: 'sunTeeth', label: 'Sun teeth', min: 12, max: 40, step: 2 },
            { key: 'planetTeeth', label: 'Planet teeth', min: 8, max: 30, step: 1 },
            { key: 'moduleMm', label: 'Module (mm)', min: 0.5, max: 5, step: 0.1 },
            { key: 'inputRpm', label: 'Input RPM', min: 100, max: 10000, step: 100 },
            { key: 'inputTorqueNm', label: 'Input torque (N·m)', min: 10, max: 1000, step: 10 },
          ].map((control) => (
            <label key={control.key} className="block mb-4">
              <div className="flex justify-between text-[10px] font-mono text-cyan-300 mb-1.5">
                <span>{control.label}</span>
                <span>{String(params[control.key as keyof StudyParams])}</span>
              </div>
              <input
                type="range"
                min={control.min}
                max={control.max}
                step={control.step}
                value={params[control.key as keyof StudyParams]}
                onChange={(event) => setValue(control.key as keyof StudyParams, Number(event.target.value) as never)}
                className="w-full accent-cyan-400"
              />
            </label>
          ))}
          <div className="pt-3 border-t border-cyan-500/10 text-[10px] leading-relaxed text-cyan-400/60">
            Ring teeth is constrained by the planetary relation: <span className="text-cyan-200">Nr = Ns + 2Np</span>.
          </div>
        </div>

        <div className="rounded-xl overflow-hidden border border-cyan-500/20 bg-slate-950 min-h-[380px]">
          <Canvas camera={{ position: [2.8, 2.4, 3.5], fov: 42 }} dpr={[1, 1.7]}>
            <color attach="background" args={['#020617']} />
            <ambientLight intensity={0.5} />
            <directionalLight position={[4, 6, 3]} intensity={2} />
            <directionalLight position={[-3, 2, -4]} intensity={0.8} />
            <Environment preset="studio" />
            <PlanetaryPreview params={params} />
            <gridHelper args={[5, 20, '#0e7490', '#164e63']} position={[0, -0.8, 0]} />
            <ContactShadows position={[0, -0.8, 0]} opacity={0.4} scale={7} blur={2.2} far={4} />
            <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
          </Canvas>
        </div>

        <div className="rounded-xl border border-cyan-500/20 bg-slate-950/75 p-4 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-widest text-cyan-400/60 mb-3">Calculated consequences</div>
          <div className="space-y-2">
            {[
              ['Ring teeth', derived.ringTeeth.toFixed(0), 'teeth'],
              ['Speed ratio', derived.ratio.toFixed(3), ':1'],
              ['Carrier speed', derived.carrierRpm.toFixed(1), 'RPM'],
              ['Ideal carrier torque', derived.idealCarrierTorque.toFixed(1), 'N·m'],
              ['Sun pitch diameter', derived.approximatePitchDiameterMm.toFixed(2), 'mm'],
              ['Ring pitch diameter', derived.ringPitchDiameterMm.toFixed(2), 'mm'],
              ['Center distance', derived.centerDistanceMm.toFixed(2), 'mm'],
            ].map(([label, value, unit]) => (
              <div key={label} className="rounded-lg bg-slate-900/80 border border-cyan-500/10 px-3 py-2">
                <div className="text-[9px] text-cyan-400/55 uppercase">{label}</div>
                <div className="text-sm text-cyan-100 font-bold mt-0.5">{value} <span className="text-[10px] text-cyan-400/60">{unit}</span></div>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-[10px] text-amber-200/80 leading-relaxed">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold mb-1">
              <Gauge size={12} />
              WHAT CHANGED?
            </div>
            Increasing module scales the pitch diameters. Changing tooth counts changes the ratio and therefore the output speed/torque relationship in this simplified study.
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg border border-cyan-500/10 bg-slate-900/60 p-2">
              <div className="text-[9px] text-cyan-400/50 flex items-center gap-1"><Cog size={11} /> TOPOLOGY</div>
              <div className="text-[10px] text-cyan-200 mt-1">{derived.ringTeeth + params.sunTeeth + params.planetTeeth * 3} visible tooth elements</div>
            </div>
            <div className="rounded-lg border border-cyan-500/10 bg-slate-900/60 p-2">
              <div className="text-[9px] text-cyan-400/50 flex items-center gap-1"><Ruler size={11} /> SCALE</div>
              <div className="text-[10px] text-cyan-200 mt-1">{(derived.ringPitchDiameterMm / 10).toFixed(1)} visual units</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
