// True when the event target is a text input, textarea, or rich-text editor
// (Quill's contenteditable region) — global shortcuts should defer to
// whatever that field's own key handling does (e.g. native/Quill undo).
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;

  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
  if (target.isContentEditable) return true;
  if (target.closest('.ql-editor')) return true;

  return false;
}
