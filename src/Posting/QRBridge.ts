let currentQR: any = {};

export function registerQR(qr: any) {
  currentQR = qr;
}

const QRBridge = new Proxy({}, {
  get(_target, prop) {
    return currentQR[prop];
  },
  set(_target, prop, value) {
    currentQR[prop] = value;
    return true;
  },
});

export default QRBridge;
