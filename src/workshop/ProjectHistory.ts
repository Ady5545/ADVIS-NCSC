import type { ProjectTransformCommand, WorkshopComponentTransform } from './ProjectSchema';

export interface ProjectHistory {
  undoStack: ProjectTransformCommand[];
  redoStack: ProjectTransformCommand[];
  limit: number;
}

export interface HistoryTransition {
  history: ProjectHistory;
  transforms: Record<string, WorkshopComponentTransform>;
  command: ProjectTransformCommand | null;
}

export function createProjectHistory(limit = 100): ProjectHistory {
  return { undoStack: [], redoStack: [], limit: Math.max(1, Math.floor(limit)) };
}

export function recordTransformCommand(
  history: ProjectHistory,
  command: ProjectTransformCommand,
): ProjectHistory {
  const undoStack = [...history.undoStack, command];
  return {
    ...history,
    undoStack: undoStack.slice(-history.limit),
    redoStack: [],
  };
}

export function undoTransformCommand(
  history: ProjectHistory,
  transforms: Record<string, WorkshopComponentTransform>,
): HistoryTransition {
  const command = history.undoStack[history.undoStack.length - 1];
  if (!command) return { history, transforms, command: null };
  return {
    history: {
      ...history,
      undoStack: history.undoStack.slice(0, -1),
      redoStack: [...history.redoStack, command].slice(-history.limit),
    },
    transforms: { ...transforms, [command.componentId]: cloneTransform(command.before) },
    command,
  };
}

export function redoTransformCommand(
  history: ProjectHistory,
  transforms: Record<string, WorkshopComponentTransform>,
): HistoryTransition {
  const command = history.redoStack[history.redoStack.length - 1];
  if (!command) return { history, transforms, command: null };
  return {
    history: {
      ...history,
      undoStack: [...history.undoStack, command].slice(-history.limit),
      redoStack: history.redoStack.slice(0, -1),
    },
    transforms: { ...transforms, [command.componentId]: cloneTransform(command.after) },
    command,
  };
}

export function clearProjectHistory(history: ProjectHistory): ProjectHistory {
  return { ...history, undoStack: [], redoStack: [] };
}

function cloneTransform(transform: WorkshopComponentTransform): WorkshopComponentTransform {
  return {
    position: [...transform.position] as [number, number, number],
    rotation: [...transform.rotation] as [number, number, number],
    scale: [...transform.scale] as [number, number, number],
  };
}
