export type TheatreEventName =
  | 'advis-theatre-v12'
  | 'advis-theatre-molecule'
  | 'advis-theatre-presentation';

export function emitTheatreEvent<T>(name: TheatreEventName, detail: T): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(name, { detail }));
}

export function onTheatreEvent<T>(
  name: TheatreEventName,
  callback: (detail: T) => void,
): () => void {
  if (typeof window === 'undefined') return () => {};
  const handler = (event: Event) => {
    callback((event as CustomEvent<T>).detail);
  };
  window.addEventListener(name, handler);
  return () => window.removeEventListener(name, handler);
}
