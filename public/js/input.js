class KeyManager {
  // keys are placed into a hash map which holds the keycode as the key ("KeyW") and
  // the keyObject as the value.

  constructor() {
    this.keys = new Map();

    document.addEventListener("keydown", event => {
      let key = this.keys.get(event.code);
      if (key == null || key.down === true) return;
      key.pressCallback();
      key.down = true;
    });

    document.addEventListener("keyup", event => {
      let key = this.keys.get(event.code);
      if (key == null || key.down === false) return;
      key.upCallback();
      key.down = false;
    });
  }

  update(dt) {
    for (const key of this.keys.values()) {
      if (key.down) key.downFunction(dt);
    }
  }

  addKey(code, key) {
    this.keys.set(code, key);
  }

  getKey(code) {
    return this.keys.get(code);
  }
}