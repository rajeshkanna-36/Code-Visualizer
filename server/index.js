import express from 'express';
import cors from 'cors';
import { runJava, runJavaRaw } from './javaRunner.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

/**
 * POST /api/trace-java
 * Body: { code: string, stdin?: string }
 * Response: { success, snapshots?, consoleOutput?, error?, details? }
 */
app.post('/api/trace-java', async (req, res) => {
  const { code, stdin = '' } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ success: false, error: 'No code provided' });
  }

  console.log(`[${new Date().toLocaleTimeString()}] Tracing Java code (${code.length} chars)...`);

  try {
    const result = await runJava(code, stdin);

    if (!result.success) {
      console.log(`[${new Date().toLocaleTimeString()}] Error: ${result.error}`);
      return res.json(result);
    }

    console.log(`[${new Date().toLocaleTimeString()}] Success: ${result.snapshots.length} steps`);
    res.json(result);
  } catch (err) {
    console.error(`[${new Date().toLocaleTimeString()}] Server error:`, err.message);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      details: err.message,
    });
  }
});

/**
 * POST /api/run-java
 * Body: { code: string, stdin?: string }
 * Simple execute without instrumentation
 */
app.post('/api/run-java', async (req, res) => {
  const { code, stdin = '' } = req.body;

  if (!code || !code.trim()) {
    return res.status(400).json({ success: false, error: 'No code provided' });
  }

  try {
    const result = await runJavaRaw(code, stdin);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Server Error', details: err.message });
  }
});

/**
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', java: true });
});

app.listen(PORT, () => {
  console.log(`\n  ⚡ AlgoViz Backend running on http://localhost:${PORT}`);
  console.log(`  📡 Endpoints:`);
  console.log(`     POST /api/trace-java  — Trace Java code with visualization`);
  console.log(`     POST /api/run-java    — Run Java code (raw output)`);
  console.log(`     GET  /api/health      — Health check\n`);
});
