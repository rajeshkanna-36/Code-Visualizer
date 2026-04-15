import { exec } from 'child_process';
import { writeFile, mkdir, rm, readFile } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { instrumentJava } from './instrumenter.js';

const TIMEOUT_MS = 15000; // 15 second timeout
const MAX_OUTPUT_SIZE = 1024 * 512; // 512KB max output

/**
 * Compile and run Java code with instrumentation.
 * Returns array of execution snapshots.
 */
export async function runJava(code, stdin = '') {
  const runId = randomUUID().slice(0, 8);
  const tmpDir = join(process.cwd(), 'server', '.tmp', runId);

  try {
    await mkdir(tmpDir, { recursive: true });

    // Extract class name from code
    const classMatch = code.match(/\bclass\s+(\w+)/);
    const className = classMatch ? classMatch[1] : 'Main';

    // Instrument the code
    const instrumented = instrumentJava(code);

    // Write instrumented code to file
    const javaFile = join(tmpDir, `${className}.java`);
    await writeFile(javaFile, instrumented, 'utf-8');

    // Also save original for line mapping
    await writeFile(join(tmpDir, 'original.java'), code, 'utf-8');
    await writeFile(join(tmpDir, 'instrumented.java'), instrumented, 'utf-8');

    // Compile
    const compileResult = await execPromise(
      `javac "${javaFile}"`,
      { cwd: tmpDir, timeout: TIMEOUT_MS }
    );

    if (compileResult.stderr && compileResult.stderr.includes('error')) {
      // Return compilation errors with line mapping back to original
      const errors = mapCompileErrors(compileResult.stderr, instrumented, code);
      return { success: false, error: 'Compilation Error', details: errors };
    }

    // Run with stdin
    const stdinFile = join(tmpDir, 'stdin.txt');
    await writeFile(stdinFile, stdin, 'utf-8');

    const runResult = await execPromise(
      `java -cp "${tmpDir}" ${className} < "${stdinFile}"`,
      { cwd: tmpDir, timeout: TIMEOUT_MS, maxBuffer: MAX_OUTPUT_SIZE }
    );

    if (runResult.stderr && runResult.stderr.trim()) {
      // Runtime error
      const errMsg = mapRuntimeError(runResult.stderr, instrumented, code);
      return { success: false, error: 'Runtime Error', details: errMsg };
    }

    // Parse trace output
    const { snapshots, consoleOutput } = parseTraceOutput(runResult.stdout, code);

    return { success: true, snapshots, consoleOutput };

  } finally {
    // Cleanup temp directory
    try {
      await rm(tmpDir, { recursive: true, force: true });
    } catch (e) { /* ignore cleanup errors */ }
  }
}

/**
 * Compile and run Java code WITHOUT instrumentation (just execute).
 * Used as fallback or for simple execution.
 */
export async function runJavaRaw(code, stdin = '') {
  const runId = randomUUID().slice(0, 8);
  const tmpDir = join(process.cwd(), 'server', '.tmp', runId);

  try {
    await mkdir(tmpDir, { recursive: true });

    const classMatch = code.match(/\bclass\s+(\w+)/);
    const className = classMatch ? classMatch[1] : 'Main';

    const javaFile = join(tmpDir, `${className}.java`);
    await writeFile(javaFile, code, 'utf-8');

    // Compile
    const compileResult = await execPromise(
      `javac "${javaFile}"`,
      { cwd: tmpDir, timeout: TIMEOUT_MS }
    );

    if (compileResult.stderr && compileResult.stderr.includes('error')) {
      return { success: false, error: 'Compilation Error', details: compileResult.stderr };
    }

    const stdinFile = join(tmpDir, 'stdin.txt');
    await writeFile(stdinFile, stdin, 'utf-8');

    const runResult = await execPromise(
      `java -cp "${tmpDir}" ${className} < "${stdinFile}"`,
      { cwd: tmpDir, timeout: TIMEOUT_MS, maxBuffer: MAX_OUTPUT_SIZE }
    );

    return {
      success: true,
      stdout: runResult.stdout,
      stderr: runResult.stderr
    };

  } finally {
    try {
      await rm(tmpDir, { recursive: true, force: true });
    } catch (e) { /* ignore */ }
  }
}

function execPromise(cmd, opts = {}) {
  return new Promise((resolve) => {
    exec(cmd, { timeout: opts.timeout || 10000, maxBuffer: opts.maxBuffer || 1024 * 512, ...opts }, (error, stdout, stderr) => {
      resolve({ stdout: stdout || '', stderr: stderr || '', error });
    });
  });
}

/**
 * Parse the __TRACE__ output lines into snapshots
 */
function parseTraceOutput(stdout, originalCode) {
  const lines = stdout.split('\n');
  const snapshots = [];
  const consoleOutput = [];
  const originalLines = originalCode.split('\n');

  for (const line of lines) {
    if (line.startsWith('__TRACE__|')) {
      // Format: __TRACE__|stepNum|lineNum|description|jsonVars
      const parts = line.split('|');
      if (parts.length >= 5) {
        const step = parseInt(parts[1]);
        const lineNum = parseInt(parts[2]);
        const description = parts[3];
        const varsJson = parts.slice(4).join('|'); // rejoin in case vars contain |

        let variables = {};
        let structures = { arrays: {}, maps: {}, stacks: {}, scalars: {} };

        try {
          variables = JSON.parse(varsJson);

          // Categorize variables into structures
          for (const [key, val] of Object.entries(variables)) {
            if (Array.isArray(val)) {
              structures.arrays[key] = val;
            } else if (typeof val === 'object' && val !== null) {
              structures.maps[key] = val;
            } else {
              structures.scalars[key] = val;
            }
          }
        } catch (e) {
          // If JSON parse fails, just use empty vars
        }

        // Detect changed variables
        const prevSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
        const changed = [];
        if (prevSnapshot) {
          for (const [k, v] of Object.entries(variables)) {
            if (JSON.stringify(prevSnapshot.variables[k]) !== JSON.stringify(v)) {
              changed.push(k);
            }
          }
        }

        snapshots.push({
          step,
          line: lineNum,
          variables,
          structures,
          description,
          changed,
          consoleOutput: [...consoleOutput],
        });
      }
    } else if (line.trim()) {
      // Regular console output
      consoleOutput.push(line);
    }
  }

  // Update the last snapshot with final console output
  if (snapshots.length > 0) {
    snapshots[snapshots.length - 1].consoleOutput = [...consoleOutput];
  }

  return { snapshots, consoleOutput };
}

/**
 * Map compilation errors back to original source lines
 */
function mapCompileErrors(stderr, instrumentedCode, originalCode) {
  // Try to extract meaningful error messages
  const errorLines = stderr.split('\n').filter(l => l.includes('error:'));
  if (errorLines.length > 0) {
    return errorLines.map(l => {
      // Try to extract line number and message
      const match = l.match(/:(\d+):\s*error:\s*(.*)/);
      if (match) {
        return `Line ${match[1]}: ${match[2]}`;
      }
      return l;
    }).join('\n');
  }
  return stderr;
}

/**
 * Map runtime errors back to meaningful messages
 */
function mapRuntimeError(stderr, instrumentedCode, originalCode) {
  if (stderr.includes('ArrayIndexOutOfBoundsException')) {
    return 'ArrayIndexOutOfBoundsException: Array index is out of bounds';
  }
  if (stderr.includes('NullPointerException')) {
    return 'NullPointerException: Attempting to use null reference';
  }
  if (stderr.includes('StackOverflowError')) {
    return 'StackOverflowError: Possible infinite recursion';
  }
  if (stderr.includes('NoSuchElementException')) {
    return 'NoSuchElementException: No more input available (check your stdin input)';
  }
  // Extract the main exception message
  const match = stderr.match(/Exception[^:]*:\s*(.*)/);
  if (match) return match[0];
  return stderr.trim().split('\n')[0];
}
