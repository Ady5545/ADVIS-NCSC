import type { LearningLesson } from './LessonSchema';
import type { ObjectMetadata } from '../SpatialLibrary';

export const OFFLINE_PACK_SCHEMA_VERSION = 1;

export interface OfflineLearningPack {
  schemaVersion: 1;
  createdAt: string;
  title: string;
  lesson: LearningLesson;
  modelSummary: {
    id: string;
    name: string;
    description: string;
    modelVersion: string;
    modelKind: string;
    limitations: string[];
    availableOffline: 'LESSON_TEXT_AND_ASSESSMENT_ONLY';
  };
  notice: string;
}

export function createOfflineLearningPack(
  lesson: LearningLesson,
  model: ObjectMetadata,
  createdAt = new Date().toISOString(),
): OfflineLearningPack {
  if (lesson.modelId !== model.id) throw new Error('Lesson and model IDs do not match.');
  return {
    schemaVersion: OFFLINE_PACK_SCHEMA_VERSION,
    createdAt,
    title: `${lesson.title} — Offline Lesson Pack`,
    lesson: JSON.parse(JSON.stringify(lesson)) as LearningLesson,
    modelSummary: {
      id: model.id,
      name: model.name,
      description: model.description,
      modelVersion: model.modelVersion || 'unversioned',
      modelKind: model.modelKind || 'unspecified',
      limitations: [...(model.evidence?.limitations || []), ...lesson.limitations],
      availableOffline: 'LESSON_TEXT_AND_ASSESSMENT_ONLY',
    },
    notice: 'This pack saves lesson text, objectives, questions, hints, and model limitations. It does not include the interactive 3D mesh, simulation runtime, external assets, or AI access; those may still require the website and network.',
  };
}

export function serializeOfflineLearningPack(pack: OfflineLearningPack): string {
  return JSON.stringify(pack, null, 2);
}

export function validateOfflineLearningPack(value: unknown): value is OfflineLearningPack {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const pack = value as Partial<OfflineLearningPack>;
  return pack.schemaVersion === OFFLINE_PACK_SCHEMA_VERSION &&
    typeof pack.title === 'string' &&
    Boolean(pack.lesson && typeof pack.lesson.id === 'string' && Array.isArray(pack.lesson.steps)) &&
    Boolean(pack.modelSummary && typeof pack.modelSummary.id === 'string') &&
    pack.modelSummary?.availableOffline === 'LESSON_TEXT_AND_ASSESSMENT_ONLY';
}


function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Creates a self-contained, script-light HTML workbook. The generated file has no
 * remote fonts, scripts, images, or stylesheets, so its text and formative checks work offline.
 */
export function createOfflineLearningHtml(pack: OfflineLearningPack): string {
  const lesson = pack.lesson;
  const objectives = lesson.learningObjectives.map((objective) => `<li>${escapeHtml(objective)}</li>`).join('');
  const references = lesson.sourceReferences.map((reference) => {
    const safeLabel = escapeHtml(reference.label);
    const safeUrl = typeof reference.url === 'string' && /^https:\/\/\S+$/i.test(reference.url)
      ? reference.url
      : '';
    return safeUrl
      ? `<li><a href="${escapeHtml(safeUrl)}" rel="noopener noreferrer">${safeLabel}</a> <span class="muted">(${escapeHtml(reference.applicability || 'applicability not specified')})</span></li>`
      : `<li>${safeLabel} <span class="muted">(no URL recorded)</span></li>`;
  }).join('');
  const steps = lesson.steps.map((step, index) => {
    const question = step.question ? `
      <section class="question" data-question data-correct="${escapeHtml(step.question.correctChoiceId)}" data-explanation="${escapeHtml(step.question.explanation)}" data-hint="${escapeHtml(step.question.hint || step.hint || 'Review the explanation and try again.')}">
        <h4>Check your understanding</h4>
        <p>${escapeHtml(step.question.prompt)}</p>
        <fieldset><legend>Choose one answer</legend>${step.question.choices.map((choice, choiceIndex) => `
          <label class="choice"><input type="radio" name="question-${index}" value="${escapeHtml(choice.id)}"> <span>${escapeHtml(choice.text)}</span></label>
        `).join('')}</fieldset>
        <button class="check" type="button" data-check>Check answer</button>
        <p class="feedback" data-feedback role="status" aria-live="polite"></p>
      </section>` : '';
    return `
      <article class="step">
        <label class="complete"><input type="checkbox" data-step-complete> Mark step complete</label>
        <h3>${index + 1}. ${escapeHtml(step.title)}</h3>
        <p class="objective"><strong>Objective:</strong> ${escapeHtml(step.objective)}</p>
        <p>${escapeHtml(step.explanation)}</p>
        <div class="task"><strong>Try this:</strong> ${escapeHtml(step.learnerTask)}</div>
        ${step.hint ? `<details><summary>Need a hint?</summary><p>${escapeHtml(step.hint)}</p></details>` : ''}
        ${question}
      </article>`;
  }).join('');
  const limitations = [...new Set([...(pack.modelSummary.limitations || []), ...(lesson.limitations || [])])]
    .map((limitation) => `<li>${escapeHtml(limitation)}</li>`).join('');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${escapeHtml(lesson.title)} — Offline Learning Pack</title>
<style>
:root{font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#172033;background:#f4f7fb;line-height:1.6}
*{box-sizing:border-box}body{margin:0}header{background:#0e223b;color:#f8fbff;padding:2rem max(1rem,calc((100vw - 880px)/2));border-bottom:4px solid #18b6c8}
main{max-width:880px;margin:0 auto;padding:1.25rem}h1{font-size:clamp(1.5rem,4vw,2.2rem);line-height:1.2;margin:.5rem 0}
h2{font-size:1.25rem;margin-top:0}h3{font-size:1.1rem;margin:.7rem 0}.eyebrow{font-size:.75rem;letter-spacing:.12em;text-transform:uppercase;color:#90e8ef}
.card,.step{background:white;border:1px solid #dbe4ee;border-radius:14px;padding:1rem;margin:1rem 0;box-shadow:0 3px 12px #0e223b0b}
.step{border-left:4px solid #159daf}.objective{color:#31445d}.task{background:#ecf8fa;padding:.8rem;border-radius:8px}
.muted{color:#617187;font-size:.9rem}a{color:#075d8d;overflow-wrap:anywhere}.notice{background:#fff6dd;border:1px solid #e7c978;border-radius:10px;padding:.8rem;margin:.8rem 0}
.complete{display:flex;gap:.55rem;align-items:center;font-size:.9rem;color:#315166}.choice{display:flex;gap:.6rem;align-items:flex-start;padding:.6rem;border:1px solid #dbe4ee;border-radius:9px;margin:.45rem 0;cursor:pointer}
fieldset{border:0;padding:0;margin:.7rem 0}legend{font-weight:600}.check{border:0;border-radius:8px;padding:.6rem .9rem;background:#0b7285;color:white;font-weight:600;cursor:pointer}
.check:focus-visible,input:focus-visible,summary:focus-visible,a:focus-visible{outline:3px solid #f0a71b;outline-offset:2px}
.feedback{min-height:1.5em;font-weight:600}.feedback.correct{color:#14754b}.feedback.incorrect{color:#a43830}footer{max-width:880px;margin:0 auto;padding:0 1.25rem 2rem;color:#607187;font-size:.85rem}
@media(prefers-reduced-motion:reduce){*{scroll-behavior:auto!important;animation:none!important;transition:none!important}}
@media print{body{background:white}header{background:white;color:#172033;border-bottom:2px solid #333;padding:1rem}main{max-width:none}.card,.step{box-shadow:none;break-inside:avoid}.check{display:none}a{color:#111}footer{max-width:none}}
</style>
</head>
<body>
<header><div class="eyebrow">A.D.V.I.S.-NCSC · free learning</div><h1>${escapeHtml(lesson.title)}</h1><p>${escapeHtml(lesson.summary)}</p><p class="muted" style="color:#cbd9e9">${escapeHtml(lesson.domain.replace(/_/g,' '))} · ${escapeHtml(lesson.learnerLevel.replace(/_/g,' '))} · ${escapeHtml(lesson.estimatedMinutes)} minutes</p></header>
<main>
  <div class="notice"><strong>Offline text pack.</strong> This file includes lesson text, objectives, questions, hints and limitations. It does not include the interactive 3D model, simulation runtime, camera/microphone features, or AI tutor. No account or internet connection is required to read this file.</div>
  <section class="card"><h2>Learning objectives</h2><ul>${objectives}</ul><p id="progress" class="muted">0 of ${lesson.steps.length} steps marked complete in this session.</p></section>
  <section class="card"><h2>Source references</h2><p class="muted">General references can explain scientific principles without verifying the exact geometry of this visual model.</p><ul>${references || '<li>No references recorded for this lesson.</li>'}</ul></section>
  <section aria-label="Guided lesson steps"><h2>Guided steps</h2>${steps}</section>
  <section class="card"><h2>Model and lesson limitations</h2><ul>${limitations}</ul><p class="muted">These notes travel with the lesson so the limits remain visible while offline.</p></section>
</main>
<footer>Generated ${escapeHtml(pack.createdAt)} · Source model: ${escapeHtml(pack.modelSummary.name)} (${escapeHtml(pack.modelSummary.id)}) · This offline workbook is educational, not a substitute for engineering certification or clinical advice.</footer>
<script>
(function(){
  document.querySelectorAll('[data-question]').forEach(function(question){
    var check=question.querySelector('[data-check]');
    var feedback=question.querySelector('[data-feedback]');
    check.addEventListener('click',function(){
      var answer=question.querySelector('input[type="radio"]:checked');
      if(!answer){feedback.textContent='Choose an answer first.';feedback.className='feedback incorrect';return;}
      var correct=answer.value===question.dataset.correct;
      feedback.textContent=correct?question.dataset.explanation:(question.dataset.hint||'Not quite. Review the explanation and try again.');
      feedback.className='feedback '+(correct?'correct':'incorrect');
    });
  });
  var boxes=Array.prototype.slice.call(document.querySelectorAll('[data-step-complete]'));
  var output=document.getElementById('progress');
  function update(){var done=boxes.filter(function(box){return box.checked;}).length;output.textContent=done+' of '+boxes.length+' steps marked complete in this session.';}
  boxes.forEach(function(box){box.addEventListener('change',update);});update();
})();
</script>
</body>
</html>`;
}

export function downloadOfflineLearningHtmlPack(pack: OfflineLearningPack): boolean {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof Blob === 'undefined') return false;
  try {
    const blob = new Blob([createOfflineLearningHtml(pack)], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${pack.lesson.id}-offline-workbook.html`;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}

export function downloadOfflineLearningPack(pack: OfflineLearningPack): boolean {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof Blob === 'undefined') return false;
  try {
    const blob = new Blob([serializeOfflineLearningPack(pack)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${pack.lesson.id}-offline-pack.json`;
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}
