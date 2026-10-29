const LEFT = new Set(['ArrowLeft', 'KeyA']);
const RIGHT = new Set(['ArrowRight', 'KeyD']);
const JUMP = new Set(['Space', 'KeyW', 'ArrowUp']);
const GAME_KEYS = new Set([...LEFT, ...RIGHT, ...JUMP]);

export class Input {
  constructor(isGameActive) {
    this.isGameActive = isGameActive;
    this.pressedKeys = new Set();
    this.pressedButtons = new Set();
    this.jumpQueued = false;
    this.touchButtons = [...document.querySelectorAll('[data-control]')];

    window.addEventListener('keydown', (event) => this.onKeyDown(event));
    window.addEventListener('keyup', (event) => this.onKeyUp(event));
    window.addEventListener('blur', () => this.clear());
    this.bindTouchControls();
  }

  get left() { return [...LEFT].some((key) => this.pressedKeys.has(key)) || this.pressedButtons.has('left'); }
  get right() { return [...RIGHT].some((key) => this.pressedKeys.has(key)) || this.pressedButtons.has('right'); }

  consumeJump() {
    const requested = this.jumpQueued;
    this.jumpQueued = false;
    return requested;
  }

  onKeyDown(event) {
    const editable = event.target instanceof HTMLElement &&
      (event.target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName));
    if (editable || !GAME_KEYS.has(event.code) || !this.isGameActive()) return;
    event.preventDefault();
    if (JUMP.has(event.code) && !this.pressedKeys.has(event.code)) this.jumpQueued = true;
    this.pressedKeys.add(event.code);
  }

  onKeyUp(event) {
    if (!GAME_KEYS.has(event.code)) return;
    if (this.isGameActive()) event.preventDefault();
    this.pressedKeys.delete(event.code);
  }

  bindTouchControls() {
    for (const button of this.touchButtons) {
      const action = button.dataset.control;
      const release = (event) => {
        event.preventDefault();
        this.pressedButtons.delete(action);
        button.classList.remove('is-pressed');
      };
      button.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        if (!this.isGameActive()) return;
        button.setPointerCapture?.(event.pointerId);
        if (action === 'jump' && !this.pressedButtons.has('jump')) this.jumpQueued = true;
        this.pressedButtons.add(action);
        button.classList.add('is-pressed');
      });
      button.addEventListener('pointerup', release);
      button.addEventListener('pointercancel', release);
      button.addEventListener('lostpointercapture', release);
      button.addEventListener('contextmenu', (event) => event.preventDefault());
    }
  }

  clear() {
    this.pressedKeys.clear();
    this.pressedButtons.clear();
    this.jumpQueued = false;
    for (const button of this.touchButtons) button.classList.remove('is-pressed');
  }
}
