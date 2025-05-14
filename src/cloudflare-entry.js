// Polyfill MessageChannel przed załadowaniem całej aplikacji
if (typeof MessageChannel === "undefined") {
  class MessagePort {
    constructor() {
      this.onmessage = null;
    }
    postMessage(data) {
      if (this._otherPort && this._otherPort.onmessage) {
        const event = { data };
        Promise.resolve().then(() => {
          if (this._otherPort && this._otherPort.onmessage) {
            this._otherPort.onmessage(event);
          }
        });
      }
    }
    start() {
      // Implementacja start
    }
    close() {
      // Implementacja close
    }
  }

  class CloudflareMessageChannel {
    constructor() {
      this.port1 = new MessagePort();
      this.port2 = new MessagePort();
      this.port1._otherPort = this.port2;
      this.port2._otherPort = this.port1;
    }
    // Dodaj metodę, aby uniknąć błędu "class with only a constructor"
    toString() {
      return "[object MessageChannel]";
    }
  }

  globalThis.MessageChannel = CloudflareMessageChannel;
  globalThis.MessagePort = MessagePort;
  // Logowanie tylko w środowisku, gdzie jest dostępny globalThis
  try {
    if (globalThis.console) {
      globalThis.console.log("MessageChannel polyfill applied");
    }
  } catch (_) {
    // Ignoruj błędy
  }
}

// Eksportuj handler dla Cloudflare
export { onRequest } from "./entry.cloudflare";
