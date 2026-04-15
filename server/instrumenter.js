/**
 * Java Code Instrumenter v3
 *
 * Inserts __Tracer.snapshot() calls after each statement to capture
 * variable state. Properly tracks brace-based scope so variables
 * declared inside for/if/while blocks are not referenced outside.
 */

export function instrumentJava(code) {
  const classMatch = code.match(/\bclass\s+(\w+)/);
  const className = classMatch ? classMatch[1] : 'Main';

  const lines = code.split('\n');
  const instrumented = [];
  let inMultiLineComment = false;

  // Scope tracking: stack of { depth, vars[] }
  // Each scope level tracks which variables were declared at that depth
  let braceDepth = 0;
  const scopeVars = []; // [{ name, type, depth }]

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;
    const trimmed = line.trim();

    // Track multi-line comments
    if (inMultiLineComment) {
      instrumented.push(line);
      if (trimmed.includes('*/')) inMultiLineComment = false;
      continue;
    }
    if (trimmed.startsWith('/*')) {
      inMultiLineComment = true;
      instrumented.push(line);
      if (trimmed.includes('*/')) inMultiLineComment = false;
      continue;
    }

    // Count braces BEFORE processing (opening braces on this line increase depth)
    const openBraces = (trimmed.match(/\{/g) || []).length;
    const closeBraces = (trimmed.match(/\}/g) || []).length;

    // Skip non-executable lines
    if (
      trimmed === '' ||
      trimmed.startsWith('//') ||
      trimmed.startsWith('import ') ||
      trimmed.startsWith('package ')
    ) {
      instrumented.push(line);
      continue;
    }

    // Class declaration
    if (trimmed.match(/^\s*(public\s+)?(class|interface|enum)\s+/)) {
      instrumented.push(line);
      braceDepth += openBraces;
      braceDepth -= closeBraces;
      continue;
    }

    // Pure closing brace(s)
    if (trimmed.match(/^\s*\}\s*(else\s*\{?)?\s*$/)) {
      // Before closing, remove vars that are going out of scope
      for (let b = 0; b < closeBraces; b++) {
        // Remove vars declared at current depth
        while (scopeVars.length > 0 && scopeVars[scopeVars.length - 1].depth >= braceDepth) {
          scopeVars.pop();
        }
        braceDepth--;
      }
      braceDepth += openBraces; // for "} else {"
      instrumented.push(line);
      continue;
    }

    // Method declaration
    if (isMethodDeclaration(trimmed)) {
      braceDepth += openBraces;
      // Extract method parameters as scope vars
      const paramMatch = trimmed.match(/\(([^)]*)\)/);
      if (paramMatch && paramMatch[1].trim()) {
        const params = paramMatch[1].split(',');
        for (const p of params) {
          const pm = p.trim().match(/(?:[\w\[\]<>,\s]+)\s+(\w+)$/);
          if (pm) scopeVars.push({ name: pm[1], depth: braceDepth });
        }
      }
      instrumented.push(line);
      if (openBraces > 0) {
        const indent = getIndent(line) + '    ';
        instrumented.push(`${indent}__Tracer.snapshot(${lineNum}, "${esc(trimmed)}", ${buildCapture(scopeVars)});`);
      }
      continue;
    }

    // Control structures (for, while, if, etc)
    if (isControlStructure(trimmed)) {
      // Extract variable declarations in for-init: for (int i = 0; ...)
      const forVarMatch = trimmed.match(/for\s*\(\s*(int|long|float|double|boolean|char|String|byte|short|var)\s+(\w+)/);
      if (forVarMatch) {
        braceDepth += openBraces;
        scopeVars.push({ name: forVarMatch[2], depth: braceDepth });
      } else {
        braceDepth += openBraces;
      }

      instrumented.push(line);
      if (openBraces > 0) {
        const indent = getIndent(line) + '    ';
        instrumented.push(`${indent}__Tracer.snapshot(${lineNum}, "${esc(trimmed)}", ${buildCapture(scopeVars)});`);
      }
      continue;
    }

    // Regular statements — detect variable declarations
    const varDecl = detectVarDecl(trimmed);
    if (varDecl) {
      scopeVars.push({ name: varDecl, depth: braceDepth });
    }

    braceDepth += openBraces;
    braceDepth -= closeBraces;

    instrumented.push(line);

    // Add snapshot after executable statements
    if (trimmed.endsWith(';')) {
      const indent = getIndent(line);
      instrumented.push(`${indent}__Tracer.snapshot(${lineNum}, "${esc(trimmed)}", ${buildCapture(scopeVars)});`);
    }
  }

  const result = instrumented.join('\n');

  // Insert __Tracer class before user class
  const tracerClass = buildTracerClass();
  const classIdx = result.indexOf(`class ${className}`);
  if (classIdx >= 0) {
    let lineStart = result.lastIndexOf('\n', classIdx);
    if (lineStart < 0) lineStart = 0; else lineStart += 1;
    return result.substring(0, lineStart) + tracerClass + '\n\n' + result.substring(lineStart);
  }
  return tracerClass + '\n\n' + result;
}

function detectVarDecl(trimmed) {
  // int x = ...; or int[] arr = ...; or String s; etc.
  const m = trimmed.match(/^(?:int|long|float|double|boolean|char|String|byte|short|var)\s*(?:\[\s*\])?\s+(\w+)\s*[=;]/);
  if (m) return m[1];
  // Collection types: ArrayList<...> list = ...;
  const cm = trimmed.match(/^(?:ArrayList|List|HashMap|Map|TreeMap|HashSet|Set|TreeSet|Stack|Deque|LinkedList|Queue|PriorityQueue)\s*<[^>]*>\s+(\w+)/);
  if (cm) return cm[1];
  return null;
}

function buildCapture(scopeVars) {
  if (scopeVars.length === 0) return '"{}"';
  const pairs = scopeVars.map(v => `"${v.name}", ${v.name}`);
  return `__Tracer.toJson(${pairs.join(', ')})`;
}

function isMethodDeclaration(line) {
  if (line.includes('new ') || line.includes('return ') || line.includes('System.out')) return false;
  return /^\s*(public|private|protected)?\s*(static\s+)?[\w\[\]<>,?\s]+\s+\w+\s*\([^)]*\)\s*(\{|throws)/.test(line);
}

function isControlStructure(line) {
  return /^\s*(for|while|if|else\s+if|switch|do)\s*[\(\{]/.test(line);
}

function getIndent(line) {
  const m = line.match(/^(\s*)/);
  return m ? m[1] : '';
}

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function buildTracerClass() {
  return `
class __Tracer {
    static int stepCount = 0;
    static void step(int line, String desc) {
        System.out.println("__TRACE__|" + (stepCount++) + "|" + line + "|" + desc + "|{}");
    }
    static void snapshot(int line, String desc, String vars) {
        System.out.println("__TRACE__|" + (stepCount++) + "|" + line + "|" + desc + "|" + vars);
    }
    static String toJson(Object... pairs) {
        StringBuilder sb = new StringBuilder("{");
        for (int i = 0; i < pairs.length; i += 2) {
            if (i > 0) sb.append(",");
            String key = String.valueOf(pairs[i]);
            Object val = pairs[i + 1];
            sb.append("\\"").append(key).append("\\":");
            if (val == null) sb.append("null");
            else if (val instanceof int[]) sb.append(arrStr((int[])val));
            else if (val instanceof long[]) sb.append(arrStr((long[])val));
            else if (val instanceof double[]) sb.append(arrStr((double[])val));
            else if (val instanceof boolean[]) sb.append(arrStr((boolean[])val));
            else if (val instanceof char[]) sb.append(arrStr((char[])val));
            else if (val instanceof String[]) sb.append(arrStr((String[])val));
            else if (val instanceof Object[]) sb.append(arrStr((Object[])val));
            else if (val instanceof String) sb.append("\\"").append(((String)val).replace("\\\\","\\\\\\\\").replace("\\"","\\\\\\\"")).append("\\"");
            else if (val instanceof java.util.Map) sb.append(mapStr((java.util.Map<?,?>)val));
            else if (val instanceof java.util.Collection) sb.append(colStr((java.util.Collection<?>)val));
            else sb.append(val);
        }
        sb.append("}");
        return sb.toString();
    }
    static String arrStr(int[] a){StringBuilder s=new StringBuilder("[");for(int i=0;i<a.length;i++){if(i>0)s.append(",");s.append(a[i]);}return s.append("]").toString();}
    static String arrStr(long[] a){StringBuilder s=new StringBuilder("[");for(int i=0;i<a.length;i++){if(i>0)s.append(",");s.append(a[i]);}return s.append("]").toString();}
    static String arrStr(double[] a){StringBuilder s=new StringBuilder("[");for(int i=0;i<a.length;i++){if(i>0)s.append(",");s.append(a[i]);}return s.append("]").toString();}
    static String arrStr(boolean[] a){StringBuilder s=new StringBuilder("[");for(int i=0;i<a.length;i++){if(i>0)s.append(",");s.append(a[i]);}return s.append("]").toString();}
    static String arrStr(char[] a){StringBuilder s=new StringBuilder("[");for(int i=0;i<a.length;i++){if(i>0)s.append(",");s.append("\\"").append(a[i]).append("\\"");}return s.append("]").toString();}
    static String arrStr(String[] a){StringBuilder s=new StringBuilder("[");for(int i=0;i<a.length;i++){if(i>0)s.append(",");s.append(a[i]==null?"null":"\\""+a[i]+"\\"");}return s.append("]").toString();}
    static String arrStr(Object[] a){StringBuilder s=new StringBuilder("[");for(int i=0;i<a.length;i++){if(i>0)s.append(",");s.append(a[i]);}return s.append("]").toString();}
    static String mapStr(java.util.Map<?,?> m){StringBuilder s=new StringBuilder("{");boolean f=true;for(var e:m.entrySet()){if(!f)s.append(",");f=false;s.append("\\"").append(e.getKey()).append("\\":");Object v=e.getValue();if(v instanceof String)s.append("\\"").append(v).append("\\"");else s.append(v);}return s.append("}").toString();}
    static String colStr(java.util.Collection<?> c){StringBuilder s=new StringBuilder("[");boolean f=true;for(var e:c){if(!f)s.append(",");f=false;if(e instanceof String)s.append("\\"").append(e).append("\\"");else s.append(e);}return s.append("]").toString();}
}`;
}
