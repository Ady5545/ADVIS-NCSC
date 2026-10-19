# V8 Guided Lesson: Observed Learner Check

**Purpose:** Identify confusing interaction or explanations before adding more V8 controls or generalizing the lesson system. This is a formative usability check, not a scientific study or a certification of learning outcomes.

## Facilitation rules

Use one volunteer at a time for the first pilot. Allow about 10–12 minutes. Ask the learner to think aloud, but do not explain the answer while they work. Record only task outcomes and anonymous observations; do not collect names, account information, recordings, or other personal data. Stop and clarify if a task feels frustrating or inaccessible.

## Task script

Tell the learner: *“Explore this engine lesson as you normally would. Please say what you expect a control or step to do before using it. I will not help unless you ask.”*

1. Launch **4-Stroke Engine** and find the guided lesson.
2. Identify the engine block and explain what it supports.
3. Explode the assembly, then restore it. Describe what changed and what did not.
4. Follow the crankshaft step and explain how piston motion becomes rotation.
5. Explore the four-stroke cycle and state why a four-stroke cycle spans two crankshaft revolutions.
6. Change RPM and explain what visibly/audibly changes. Ask what the visualization does **not** prove about real engine performance.
7. Complete the assessment. Try one deliberately incorrect choice before answering correctly and note whether the retry feedback is understandable.
8. Finish the lesson and confirm the assembly returns to its baseline presentation.

Do not coach the learner toward answers. If they ask for help, provide only the hint already shown in the lesson and mark that task as assisted.

## Observation record

Use an anonymous label such as Pilot A; this is not an identity field.

| Task | Unassisted success? | Wrong attempts / hint used | Confusion or friction observed |
|---|---|---|---|
| Launch lesson | | | |
| Identify block | | | |
| Explode / restore | | | |
| Explain crankshaft | | | |
| Explain four-stroke cycle | | | |
| Change RPM / state model limits | | | |
| Assessment retry | | | |
| Finish / restored view | | | |

After the tasks, ask:
- “Which part was hardest to understand, and what made it hard?”
- “What do you now think this model can tell you, and what can it not tell you?”
- “Which instruction or control label would you change first?”

Record the learner’s wording briefly, without identifying details. Do not write “validated” or “effective” based on one pilot.

## Provisional triage rules

- **Blocker:** a task cannot be completed, progress is lost, a control has no visible effect, or the learner is led to a materially false engineering conclusion. Fix before adding features.
- **Major friction:** the learner needs repeated hints, retries do not make sense, or the assembly fails to return to its starting presentation. Fix before generalizing the lesson framework.
- **Minor friction:** terminology or visual hierarchy causes brief hesitation but the learner recovers unaided. Capture for the next refinement pass.
- **No issue observed:** the learner completes the task unaided and accurately explains the concept. This is a positive observation, not proof of general effectiveness.

Run more than one session with different levels of prior engineering experience before making broad claims. Keep this protocol small and repeatable; fix the highest-impact blocker first.
