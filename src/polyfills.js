// Polyfill dla MessageChannel
if (typeof MessageChannel === "undefined") {
  class MessagePort {
    constructor() {
      this.onmessage = null;
    }
    postMessage(data) {
      if (this._otherPort && this._otherPort.onmessage) {
        const event = { data };
        // Użyj Promise.resolve zamiast setTimeout, który może nie być dostępny
        Promise.resolve().then(() => {
          if (this._otherPort.onmessage) {
            this._otherPort.onmessage(event);
          }
        });
      }
    }
    // Puste metody, które są wymagane przez API
    start() {
      // Implementacja start
    }
    close() {
      // Implementacja close
    }
  }

  globalThis.MessageChannel = class MessageChannel {
    constructor() {
      this.port1 = new MessagePort();
      this.port2 = new MessagePort();
      this.port1._otherPort = this.port2;
      this.port2._otherPort = this.port1;
    }
    // Dodatkowa metoda aby uniknąć błędu "class with only a constructor"
    toString() {
      return "[object MessageChannel]";
    }
  };

  globalThis.MessagePort = MessagePort;
}

// Tutaj możesz dodać więcej polyfilli, jeśli będą potrzebne
