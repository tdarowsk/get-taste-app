// Eksportujemy funkcję, która może być wywołana aby zapewnić polyfill
export function applyMessageChannelPolyfill() {
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
        // Pusta implementacja
      }
      close() {
        // Pusta implementacja
      }
    }

    class CloudflareMessageChannel {
      constructor() {
        this.port1 = new MessagePort();
        this.port2 = new MessagePort();
        this.port1._otherPort = this.port2;
        this.port2._otherPort = this.port1;
      }
      toString() {
        return "[object MessageChannel]";
      }
    }

    // Przypisujemy do globalThis
    globalThis.MessageChannel = CloudflareMessageChannel;
    globalThis.MessagePort = MessagePort;

    return true; // Polyfill został zastosowany
  }

  return false; // Polyfill nie był potrzebny
}

// Tutaj możesz dodać więcej polyfilli, jeśli będą potrzebne
