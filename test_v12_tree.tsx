import React from 'react';
import { GlobalComponentRegistry } from './src/scientific/architecture/ComponentRegistry';
// Render dummy component to force initialization
console.log(GlobalComponentRegistry.getChildren('root'));
