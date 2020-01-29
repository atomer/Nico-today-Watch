export default class {
  listeners = null;

  constructor() {
    this.listeners = {};
  }

  addEventListener(type: string, callback: Function) {
    if (!(type in this.listeners)) {
      this.listeners[type] = [];
    }
    this.listeners[type].push(callback);
  }

  removeEventListener(type: string, callback: Function) {
    if (!(type in this.listeners)) {
      return;
    }
    const stack: Function[] = this.listeners[type];
    for (let i = 0, l = stack.length; i < l; i++) {
      if (stack[i] === callback) {
        stack.splice(i, 1);
        return;
      }
    }
  }

  dispatchEvent(event: CustomEvent) {
    if (!(event.type in this.listeners)) {
      return true;
    }
    const stack: Function[] = this.listeners[event.type].slice();

    for (var i = 0, l = stack.length; i < l; i++) {
      stack[i].call(this, event);
    }
    return !event.defaultPrevented;
  }
}
