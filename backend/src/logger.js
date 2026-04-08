import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LOGS_DIR = path.join(__dirname, '..', 'logs')
const BACKEND_LOG = path.join(LOGS_DIR, 'backend.log')
const FRONTEND_LOG = path.join(LOGS_DIR, 'frontend.log')

fs.mkdirSync(LOGS_DIR, { recursive: true })

function write(file, level, ...args) {
  const line = `[${new Date().toISOString()}] [${level}] ${args.join(' ')}\n`
  process.stdout.write(line)
  try { fs.appendFileSync(file, line) } catch (_) {}
}

export const log  = (...args) => write(BACKEND_LOG,  'INFO',  ...args)
export const warn = (...args) => write(BACKEND_LOG,  'WARN',  ...args)
export const err  = (...args) => write(BACKEND_LOG,  'ERROR', ...args)

export function logFrontend(level, message) {
  const line = `[${new Date().toISOString()}] [${level}] ${message}\n`
  try { fs.appendFileSync(FRONTEND_LOG, line) } catch (_) {}
}

export const LOGS_PATH = { backend: BACKEND_LOG, frontend: FRONTEND_LOG }
