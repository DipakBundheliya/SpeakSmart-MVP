// Sends log messages to backend which writes them to frontend.log
async function send(level, message) {
  console.log(`[${level}] ${message}`)
  try {
    await fetch('/api/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level, message }),
    })
  } catch (_) {}
}

export const flog  = (msg) => send('INFO',  msg)
export const fwarn = (msg) => send('WARN',  msg)
export const ferr  = (msg) => send('ERROR', msg)
