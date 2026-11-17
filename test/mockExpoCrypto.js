// expo-crypto's native module is not available in Jest. Node's crypto provides the same primitives.
const { randomBytes, randomUUID } = require('crypto');

module.exports = {
  getRandomBytes: (n) => new Uint8Array(randomBytes(n)),
  randomUUID: () => randomUUID(),
};
