# ADVIS (Ady's Virtual Intelligence System) - Spatial AI Operating System

## PRIMARY PHILOSOPHY
ADVIS is NOT a chatbot, a Three.js demo, a hologram viewer, or a collection of widgets.
ADVIS IS a Spatial AI Operating System.
Everything inside the interface should behave as if it is part of one intelligent holographic computer. The user should never feel like they are interacting with separate modules. The AI, hologram, widgets, gestures, models, and animations must feel like one unified organism.

## DESIGN PRINCIPLE
Every interaction should answer one question: "What is the user trying to achieve?" NOT "What gesture was detected?"
- Prioritize user intent over raw gesture detection.
- Infer the most likely intention using context, movement history, object state, and interaction confidence.
- Never execute unexpected actions. When confidence is low, do nothing. When confidence is high, assist naturally.

## INTERACTION PHILOSOPHY
- The user should never fight the interface; it should adapt to the user.
- Controls must feel invisible, gestures must feel natural, movement must feel physical, and animations must feel intentional.
- Nothing should ever appear random.

## VISUAL PHILOSOPHY
Everything must belong to one holographic rendering engine and share the same visual language:
- ADVIS Core, Widgets, 3D Models, Information Panels, Pointer, Scanning Effects, Labels, Lighting, Glow, Transparency, Motion.
- No element should appear visually disconnected.

## SIMPLICITY
Whenever two possible implementations exist, choose the one requiring less user effort.
- Reduce gestures, UI clutter, floating windows, and unnecessary information.
- Only display information when the user requests or needs it.

## SPATIAL MODE
When displaying a 3D object:
- The interface should transform.
- The ADVIS hologram should gracefully transfer its energy into the object and disappear.
- Widgets should animate to the sides without vanishing.
- The object becomes the center of attention in a dedicated, immersive, clean, and distraction-free Spatial Workspace.

## OBJECT INTERACTION
- Objects should feel like physical holographic projections, not webpage elements.
- Manipulation must use: smooth inertia, damping, interpolation, stability, and precision.
- Never use robotic movement, jitter, or instant stopping.

## PERSISTENCE
- Losing hand tracking must NEVER reset the workspace.
- If the user removes their hand: pause interaction, remember everything, and resume seamlessly when the hand returns.
- Only intentional reset commands should restore the default workspace.

## PERFORMANCE
- Performance is a feature. Maintain smooth interaction even on mid-range hardware.
- Prioritize intelligent optimization over excessive visual effects (use LOD, lazy loading, efficient shaders, resource cleanup, GPU-friendly rendering).
- Never sacrifice responsiveness for unnecessary eye candy.

## 3D MODELS
- Use realistic, recognizable, optimized engineering-quality models (e.g., Arduino Uno, ESP32, Servo Motor, V12 Engine, Human Heart, Solar Tracker).
- Avoid generic or abstract placeholders. Maintain a balance between detail and performance.

## INFORMATION SYSTEM
- Information should appear only in context.
- Do not keep permanent chat overlays.
- Display elegant contextual holographic labels that appear near the selected object and fade away when no longer needed.

## AI BEHAVIOR
- The AI should think like an intelligent assistant.
- It should understand what the user is trying to inspect, manipulate, or learn.
- Do not rely solely on explicit commands. Use interaction context whenever confidence is sufficiently high.

## ANIMATION
- Every animation should communicate purpose. Nothing should animate simply because it looks cool.
- Transitions should feel deliberate, and motion should reinforce understanding.
- The interface should feel calm, confident, and premium.

## FINAL GOAL
The finished system should not resemble a webpage, dashboard, or game interface. It should feel like an advanced Spatial AI Operating System combining AI, Computer Vision, Gesture Interaction, Voice Interaction, Engineering Visualization, Spatial Computing, and Holographic Design. Every future feature must respect these principles. Redesign implementations if they conflict with this philosophy. Preserve ADVIS as one coherent product rather than a collection of independent features.
