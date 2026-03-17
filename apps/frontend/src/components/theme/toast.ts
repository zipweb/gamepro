export type ToastTone = 'success' | 'error' | 'info';

export function emitToast(message: string, tone: ToastTone = 'info') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent('lms:toast', { detail: { message, tone } }));
}
