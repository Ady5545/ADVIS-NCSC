import { ScientificSystemModel, CyclePhase } from './ScientificSchema';

export type SimulationListener = (variables: Record<string, number>, currentPhase?: CyclePhase) => void;

export class SimulationEngine {
  private model: ScientificSystemModel;
  private variables: Record<string, number> = {};
  private parameters: Record<string, number> = {};
  private isRunning: boolean = true;
  private listeners: Set<SimulationListener> = new Set();
  private lastTimestamp: number = 0;
  private animFrameId: number | null = null;
  private speedMultiplier: number = 1.0;

  constructor(model: ScientificSystemModel) {
    this.model = model;
    this.init();
  }

  private init() {
    // Initialize state variables with default values
    for (const [id, def] of Object.entries(this.model.simulation.variables)) {
      this.variables[id] = def.defaultValue;
    }
    // Initialize parameters
    this.parameters = { ...this.model.simulation.parameters };
  }

  public setModel(model: ScientificSystemModel) {
    this.stop();
    this.model = model;
    this.init();
    this.notify();
    this.start();
  }

  public getVariables(): Record<string, number> {
    return { ...this.variables };
  }

  public getVariable(id: string): number {
    return this.variables[id] ?? 0;
  }

  public getParameters(): Record<string, number> {
    return { ...this.parameters };
  }

  public getParameter(id: string): number {
    return this.parameters[id] ?? 0;
  }

  public setParameter(id: string, value: number) {
    this.parameters[id] = value;
    this.notify();
  }

  public setVariable(id: string, value: number) {
    this.variables[id] = value;
    this.notify();
  }

  public getCurrentCyclePhase(): CyclePhase | undefined {
    const phases = this.model.simulation.cyclePhases;
    if (!phases || phases.length === 0) return undefined;

    // By convention, phase is keyed to crankAngle or main cycle variable
    const cycleVal = this.variables['crankAngle'] ?? this.variables['cycleAngle'] ?? 0;
    const normalizedVal = ((cycleVal % 720) + 720) % 720;

    return phases.find(p => normalizedVal >= p.startVal && normalizedVal < p.endVal) || phases[0];
  }

  public subscribe(listener: SimulationListener): () => void {
    this.listeners.add(listener);
    // Initial emission
    listener(this.variables, this.getCurrentCyclePhase());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const phase = this.getCurrentCyclePhase();
    for (const listener of this.listeners) {
      listener(this.variables, phase);
    }
  }

  public step(dtSeconds: number) {
    if (this.model.simulation.stepFunction) {
      const updated = this.model.simulation.stepFunction(
        this.variables,
        dtSeconds * this.speedMultiplier,
        this.parameters
      );
      this.variables = updated;
      this.notify();
    }
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTimestamp = performance.now();
    this.loop();
  }

  public pause() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.notify();
  }

  public togglePlay() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.start();
    }
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public setSpeedMultiplier(mult: number) {
    this.speedMultiplier = Math.max(0.05, Math.min(10.0, mult));
  }

  public getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }

  public scrubToAngle(angleDegrees: number) {
    this.variables['crankAngle'] = angleDegrees;
    // Step with dt = 0 to evaluate dependent kinematic math
    this.step(0);
  }

  private loop = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    if (this.lastTimestamp === 0) this.lastTimestamp = now;
    const dt = Math.min((now - this.lastTimestamp) / 1000, 0.1); // clamp to 100ms max
    this.lastTimestamp = now;

    this.step(dt);

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.lastTimestamp = 0;
  }
}
