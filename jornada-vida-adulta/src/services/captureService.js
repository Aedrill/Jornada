export function createCapture(text) {
  return { id: crypto.randomUUID(), text: text.trim(), createdAt: new Date().toISOString(), processed: false }
}

export function markCaptureProcessed(captures, captureId) {
  return captures.map((capture) => capture.id === captureId ? { ...capture, processed: true } : capture)
}
