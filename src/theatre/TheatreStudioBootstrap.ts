let started = false;

if (import.meta.env.DEV && !started) {
  started = true;
  void Promise.all([
    import('@theatre/studio'),
    import('@theatre/r3f/dist/extension'),
  ]).then(([studioModule, extensionModule]) => {
    const studio = studioModule.default;
    const extension = (extensionModule as any).extension ?? (extensionModule as any).default;
    if (!extension) return;
    studio.extend(extension);
    studio.initialize();
  }).catch((error) => {
    console.warn('Theatre.js Studio could not initialize:', error);
  });
}
