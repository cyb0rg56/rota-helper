export function blurActiveElement() {
  const active = document.activeElement;
  if (active instanceof HTMLElement) {
    active.blur();
  }
}
