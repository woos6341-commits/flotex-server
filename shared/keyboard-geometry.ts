export interface KeyboardRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function rectanglesOverlapHorizontally(a: KeyboardRect, b: KeyboardRect): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x;
}

/** Only reserve the part actually covering this viewport, not the full keyboard height.
 * Android adjustResize already reduces the viewport, so its overlap is zero.
 */
export function getKeyboardOverlap(viewport: KeyboardRect, keyboard: KeyboardRect | null): number {
  if (!keyboard || keyboard.height <= 0 || !rectanglesOverlapHorizontally(viewport, keyboard)) return 0;
  const bottom = viewport.y + viewport.height;
  if (keyboard.y >= bottom || keyboard.y + keyboard.height <= viewport.y) return 0;
  return Math.max(0, bottom - Math.max(viewport.y, keyboard.y));
}

export interface FocusScrollCalculation {
  viewport: KeyboardRect;
  input: KeyboardRect;
  keyboard: KeyboardRect | null;
  scrollY: number;
  contentHeight: number;
  gap?: number;
}

/** Reveal the whole field using the smallest movement; never reset to the top on blur.
 * A field taller than the available viewport cannot fit: align its top for editing.
 */
export function getFocusedScrollOffset({ viewport, input, keyboard, scrollY, contentHeight, gap = 12 }: FocusScrollCalculation): number {
  const obscured = keyboard && rectanglesOverlapHorizontally(input, keyboard)
    ? getKeyboardOverlap(viewport, keyboard)
    : 0;
  const top = viewport.y + gap;
  const bottom = viewport.y + viewport.height - obscured - gap;
  if (bottom <= top || viewport.height <= 0 || input.height <= 0) return scrollY;
  let delta = 0;
  if (input.height > bottom - top || input.y < top) delta = input.y - top;
  else if (input.y + input.height > bottom) delta = input.y + input.height - bottom;
  const maxOffset = Math.max(0, contentHeight - viewport.height);
  return Math.max(0, Math.min(maxOffset, scrollY + delta));
}
