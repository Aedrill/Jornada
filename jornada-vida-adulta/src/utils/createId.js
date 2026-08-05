export function createId(cryptoApi = globalThis.crypto) {
  if (typeof cryptoApi?.randomUUID === 'function') {
    return cryptoApi.randomUUID()
  }

  if (typeof cryptoApi?.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)

    cryptoApi.getRandomValues(bytes)

    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80

    const hexadecimal = Array.from(
      bytes,
      (byte) => byte.toString(16).padStart(2, '0'),
    ).join('')

    return [
      hexadecimal.slice(0, 8),
      hexadecimal.slice(8, 12),
      hexadecimal.slice(12, 16),
      hexadecimal.slice(16, 20),
      hexadecimal.slice(20),
    ].join('-')
  }

  return [
    'local',
    Date.now(),
    Math.random().toString(36).slice(2, 10),
  ].join('-')
}
