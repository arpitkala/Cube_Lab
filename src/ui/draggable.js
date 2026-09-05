/**
 * draggable.js — Drag & Drop utility for UI overlays
 * Allows dragging cards smoothly around the screen with boundary clamping.
 */

export function makeDraggable(element, handle = element) {
  let isDragging = false;
  let startX = 0, startY = 0;
  let initialLeft = 0, initialTop = 0;

  handle.style.cursor = 'grab';

  const onMouseDown = (e) => {
    // Ignore clicks on buttons, inputs, links, or close buttons
    if (e.target.closest('button, input, textarea, a, select')) return;

    isDragging = true;
    handle.style.cursor = 'grabbing';

    // Get current visual position of element
    const rect = element.getBoundingClientRect();

    // Convert element positioning to explicit absolute left/top
    element.style.bottom = 'auto';
    element.style.right = 'auto';
    element.style.margin = '0';
    element.style.transform = 'none';
    element.style.left = `${rect.left}px`;
    element.style.top = `${rect.top}px`;

    startX = e.clientX;
    startY = e.clientY;
    initialLeft = rect.left;
    initialTop = rect.top;

    e.preventDefault();
  };

  const onMouseMove = (e) => {
    if (!isDragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let newLeft = initialLeft + dx;
    let newTop = initialTop + dy;

    // Boundary clamping (keep element fully inside viewport with 10px margin)
    const margin = 10;
    const maxLeft = window.innerWidth - element.offsetWidth - margin;
    const maxTop = window.innerHeight - element.offsetHeight - margin;

    newLeft = Math.max(margin, Math.min(newLeft, maxLeft));
    newTop = Math.max(margin, Math.min(newTop, maxTop));

    element.style.left = `${newLeft}px`;
    element.style.top = `${newTop}px`;
  };

  const onMouseUp = () => {
    if (isDragging) {
      isDragging = false;
      handle.style.cursor = 'grab';
    }
  };

  handle.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
}
