import type { ScientificSystemModel, CyclePhase, SimulationStateVariable } from './ScientificSchema';

export type SimulationListener = (variables: Record<string, number>, currentPhase?: CyclePhase) => void;

const MAX_SUBSTEPS_PER_FRAME = 8;

/**
 * Deterministic, model-owned simulation state.
 *
 * The engine starts paused. A UI/store must explicitly start it, which prevents an
 * allocated instance from reporting "running" while no animation loop exists.
 */
export class SimulationEngine {
  private model: ScientificSystemModel;
  private variables: Record<string, number> = {};
  private parameters: Record<string, number> = {};
  private isRunning = false;
  private isDisposed = false;
  private listeners = new Set<SimulationListener>();
  private lastTimestamp = 0;
  private animFrameId: number | null = null;
  private speedMultiplier = 1;
  private accumulator = 0;
  private lastError: string | null = null;

  constructor(model: ScientificSystemModel) {
    this.model = model;
    this.init();
  }

  private init() {
    this.variables = {};
    for (const [id, definition] of Object.entries(this.model.simulation.variables)) {
      this.variables[id] = this.constrainValue(definition.defaultValue, definition);
    }
    this.parameters = { ...this.model.simulation.parameters };
    this.accumulator = 0;
    this.lastError = null;
  }

  private constrainValue(value: number, definition?: Pick<SimulationStateVariable, 'min' | 'max'>): number {
    if (definition?.min !== undefined) value = Math.max(definition.min, value);
    if (definition?.max !== undefined) value = Math.min(definition.max, value);
    return value;
  }

  private notify() {
    const phase = this.getCurrentCyclePhase();
    const snapshot = this.getVariables();
    for (const listener of this.listeners) {
      try {
        listener(snapshot, phase);
      } catch (error) {
        // A broken UI subscriber must not silently kill the simulation update loop.
        console.error('[ADVIS Simulation] Subscriber failed:', error);
      }
    }
  }

  public setModel(model: ScientificSystemModel): void {
    if (this.isDisposed) return;
    const wasRunning = this.isRunning;
    this.stop();
    this.model = model;
    this.init();
    this.notify();
    if (wasRunning) this.start();
  }

  public getModel(): ScientificSystemModel {
    return this.model;
  }

  public getVariables(): Record<string, number> {
    return { ...this.variables };
  }

  public getVariable(id: string): number | undefined {
    return this.variables[id];
  }

  public getParameters(): Record<string, number> {
    return { ...this.parameters };
  }

  public getParameter(id: string): number | undefined {
    return this.parameters[id];
  }

  public getLastError(): string | null {
    return this.lastError;
  }

  public setParameter(id: string, value: number): boolean {
    if (this.isDisposed || !Number.isFinite(value) || !(id in this.parameters)) {
      this.lastError = !Number.isFinite(value) ? `Parameter "${id}" must be a finite number.` : `Unknown simulation parameter "${id}".`;
      return false;
    }

    const definition = this.model.simulation.parameterDefinitions?.[id];
    let nextValue = value;
    if (definition?.min !== undefined) nextValue = Math.max(definition.min, nextValue);
    if (definition?.max !== undefined) nextValue = Math.min(definition.max, nextValue);
    this.parameters[id] = nextValue;
    this.lastError = null;
    // Evaluate dependent outputs at dt=0; do not advance simulation time.
    this.step(0);
    return true;
  }

  public setVariable(id: string, value: number): boolean {
    if (this.isDisposed || !Number.isFinite(value) || !(id in this.model.simulation.variables)) {
      this.lastError = !Number.isFinite(value) ? `Variable "${id}" must be a finite number.` : `Unknown simulation variable "${id}".`;
      return false;
    }

    const definition = this.model.simulation.variables[id];
    this.variables[id] = this.constrainValue(value, definition);
    this.lastError = null;
    this.step(0);
    return true;
  }

  public getCurrentCyclePhase(): CyclePhase | undefined {
    const phases = this.model.simulation.cyclePhases;
    if (!phases || phases.length === 0) return undefined;

    const cycleLength = this.model.simulation.cycleLengthDeg ||
      Math.max(...phases.map((phase) => phase.endVal), 0) || 720;
    const cycleVariable = this.variables['crankAngle'] ?? this.variables['cycleAngle'] ?? 0;
    const normalized = ((cycleVariable % cycleLength) + cycleLength) % cycleLength;
    return phases.find((phase) => normalized >= phase.startVal && normalized < phase.endVal);
  }

  public subscribe(listener: SimulationListener): () => void {
    if (this.isDisposed) return () => undefined;
    this.listeners.add(listener);
    listener(this.getVariables(), this.getCurrentCyclePhase());
    return () => this.listeners.delete(listener);
  }

  /**
   * Steps the model by a finite, non-negative wall-clock interval.
   * Returns false if input or a model calculation is invalid; the error is available from getLastError().
   */
  public step(dtSeconds: number): boolean {
    if (this.isDisposed) return false;
    if (!Number.isFinite(dtSeconds) || dtSeconds < 0) {
      this.lastError = 'Simulation step must be a finite, non-negative number of seconds.';
      return false;
    }

    const maximum = this.model.simulation.maxStepSeconds ?? 0.1;
    const boundedDelta = Math.min(dtSeconds, maximum);
    const safeSpeed = Number.isFinite(this.speedMultiplier) ? this.speedMultiplier : 1;
    const inputState = { ...this.variables };
    const inputParameters = { ...this.parameters };

    try {
      const next = this.model.simulation.stepFunction(inputState, boundedDelta * safeSpeed, inputParameters);
      if (!next || typeof next !== 'object') throw new Error('Model stepFunction must return a state object.');

      const validated: Record<string, number> = { ...this.variables };
      for (const [id, value] of Object.entries(next)) {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
          throw new Error(`Model produced a non-finite value for "${id}".`);
        }
        const definition = this.model.simulation.variables[id];
        validated[id] = this.constrainValue(value, definition);
      }

      this.variables = validated;
      this.lastError = null;
      this.notify();
      return true;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      this.pause();
      return false;
    }
  }

  public start(): boolean {
    if (this.isDisposed || this.isRunning) return false;
    if (typeof requestAnimationFrame !== 'function') {
      this.lastError = 'Automatic simulation requires requestAnimationFrame; use step() for deterministic/manual execution.';
      return false;
    }
    this.isRunning = true;
    this.lastTimestamp = typeof performance !== 'undefined' ? performance.now() : Date.now();
    this.accumulator = 0;
    this.lastError = null;
    this.animFrameId = requestAnimationFrame(this.loop);
    this.notify();
    return true;
  }

  public pause(): void {
    this.isRunning = false;
    if (this.animFrameId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.animFrameId);
    }
    this.animFrameId = null;
    this.lastTimestamp = 0;
    this.accumulator = 0;
    this.notify();
  }

  public togglePlay(): void {
    if (this.isRunning) this.pause();
    else this.start();
  }

  public getIsRunning(): boolean {
    return this.isRunning;
  }

  public setSpeedMultiplier(multiplier: number): number {
    if (!Number.isFinite(multiplier)) {
      this.lastError = 'Simulation speed must be a finite number.';
      return this.speedMultiplier;
    }
    this.speedMultiplier = Math.max(0.05, Math.min(10, multiplier));
    this.lastError = null;
    return this.speedMultiplier;
  }

  public getSpeedMultiplier(): number {
    return this.speedMultiplier;
  }

  public reset(): void {
    if (this.isDisposed) return;
    const wasRunning = this.isRunning;
    this.stop();
    this.init();
    this.notify();
    if (wasRunning) this.start();
  }

  public scrubToAngle(angleDegrees: number): boolean {
    if (!Number.isFinite(angleDegrees)) {
      this.lastError = 'Crank angle must be a finite number of degrees.';
      return false;
    }
    const cycleLength = this.model.simulation.cycleLengthDeg ?? 720;
    const normalized = ((angleDegrees % cycleLength) + cycleLength) % cycleLength;
    return this.setVariable(
      this.variables['crankAngle'] !== undefined ? 'crankAngle' : 'cycleAngle',
      normalized,
    );
  }

  private loop = (): void => {
    if (!this.isRunning || this.isDisposed) return;

    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (this.lastTimestamp === 0) this.lastTimestamp = now;
    const maximum = this.model.simulation.maxStepSeconds ?? 0.1;
    const elapsed = Math.min(Math.max(0, (now - this.lastTimestamp) / 1000), maximum);
    this.lastTimestamp = now;

    const fixedStep = this.model.simulation.fixedTimeStepSeconds;
    if (fixedStep && Number.isFinite(fixedStep) && fixedStep > 0) {
      this.accumulator += elapsed;
      let substeps = 0;
      while (this.accumulator >= fixedStep && substeps < MAX_SUBSTEPS_PER_FRAME && this.isRunning) {
        if (!this.step(fixedStep)) break;
        this.accumulator -= fixedStep;
        substeps += 1;
      }
    } else {
      this.step(elapsed);
    }

    if (this.isRunning && !this.isDisposed && typeof requestAnimationFrame === 'function') {
      this.animFrameId = requestAnimationFrame(this.loop);
    }
  };

  public stop(): void {
    this.isRunning = false;
    if (this.animFrameId !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.animFrameId);
    }
    this.animFrameId = null;
    this.lastTimestamp = 0;
    this.accumulator = 0;
  }

  public dispose(): void {
    if (this.isDisposed) return;
    this.stop();
    this.listeners.clear();
    this.isDisposed = true;
  }
}
