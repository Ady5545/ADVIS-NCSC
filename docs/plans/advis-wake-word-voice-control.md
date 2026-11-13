# ADVIS always-available wake-word voice control

## User experience
- A persistent global microphone control remains visible on the home screen and over every open 3D/spatial model.
- The user explicitly enables microphone access. The preference is remembered across reloads; the user can turn it off at any time.
- When enabled, ADVIS continuously waits for the wake phrase **“ADVIS”** (also accepts “Hey ADVIS” and spelled-out variants). Ordinary conversation is ignored.
- Saying only “ADVIS” opens a short command window. Saying “ADVIS, [command]” in one phrase executes immediately.
- After a command, wake-word standby resumes automatically when ADVIS returns to its ready state.
- A command such as “ADVIS, exploded view please” is handled locally while a model is open, without needing the chat backend. Reassemble, X-ray/glass, and blueprint view commands are also supported.
- “ADVIS, turn mic off” disables wake-word listening.

## Privacy and browser constraints
- Microphone use is opt-in and requires browser permission. The visible global control indicates whether wake-word standby is enabled and offers an immediate off switch.
- Web Speech Recognition is browser-provided and may process audio through the browser/vendor's recognition service; this implementation does not claim fully on-device recognition.
- Continuous recognition depends on browser support, microphone permission, network/service availability, and the page remaining active. Browsers may suspend background tabs or stop recognition; the hook restarts transiently ended sessions while the app is active.
- If permission is denied, no microphone session remains active and the UI displays a clear explanation.

## Implementation
- Replaced broad substring wake matching (which accepted ordinary words such as “advice”) with an anchored ADVIS wake phrase parser.
- Added explicit mic-enabled state, persistent opt-in preference, continuous restart handling, permission/error handling, and deduplication.
- Added a global Wake Word ON/OFF pill above all workspaces; synchronized the chat dock's mic control.
- Added direct local spatial commands for exploded/reassembled, X-ray/glass, and blueprint views.

## Verification
- Source-level review confirms the global control is rendered outside the home-only chat dock, wake-word matching is anchored, and model-view commands update the active spatial state.
- Full TypeScript/build and live microphone/browser testing remain required. A successful production deploy has not yet been verified.
