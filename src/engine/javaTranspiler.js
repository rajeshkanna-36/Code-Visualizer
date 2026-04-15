/**
 * Java-to-JavaScript Transpiler (v2)
 *
 * Converts common Java algorithm patterns into equivalent JavaScript.
 * Handles: types, arrays, collections, Scanner (simulated), multiple methods,
 * for/while/do-while/for-each, if/else, switch, System.out.println, Math, etc.
 */

export function transpileJava(javaCode) {
  let code = javaCode;

  // ── 1. Strip package & imports ──
  code = code.replace(/^\s*package\s+[^;]+;\s*$/gm, '');
  code = code.replace(/^\s*import\s+[^;]+;\s*$/gm, '');

  // ── 2. Strip class wrapper ──
  // Remove "class Foo {" and its matching closing brace
  code = stripOuterBlock(code, /\b(public\s+)?class\s+\w+\s*\{/);

  // ── 3. Strip main method wrapper ──
  code = stripOuterBlock(code, /\bpublic\s+static\s+void\s+main\s*\(\s*String\s*\[\s*\]\s*\w+\s*\)\s*\{/);

  // ── 4. Scanner → simulated input ──
  // Remove Scanner instantiation
  code = code.replace(/^\s*(Scanner\s+\w+\s*=\s*new\s+Scanner\s*\([^)]*\)\s*;)\s*$/gm, '// [input removed]');
  // Replace sc.nextInt(), sc.nextLine(), sc.nextDouble(), sc.next()
  // We'll collect all input calls and replace with __input array reads
  let inputIndex = 0;
  code = code.replace(/\w+\.nextInt\s*\(\s*\)/g, () => `__inputInts[${inputIndex++}]`);
  code = code.replace(/\w+\.nextLong\s*\(\s*\)/g, () => `__inputInts[${inputIndex++}]`);
  code = code.replace(/\w+\.nextDouble\s*\(\s*\)/g, () => `__inputInts[${inputIndex++}]`);
  code = code.replace(/\w+\.nextFloat\s*\(\s*\)/g, () => `__inputInts[${inputIndex++}]`);
  code = code.replace(/\w+\.next\s*\(\s*\)/g, () => `__inputStrs[${inputIndex++}]`);
  code = code.replace(/\w+\.nextLine\s*\(\s*\)/g, () => `__inputStrs[${inputIndex++}]`);

  const needsInput = inputIndex > 0;

  // ── 5. System.out ──
  code = code.replace(/System\.out\.println\s*\(/g, 'console.log(');
  code = code.replace(/System\.out\.print\s*\(/g, 'console.log(');

  // ── 6. Array literals: new int[]{a,b} → [a,b] ──
  code = code.replace(/new\s+\w+\s*\[\s*\]\s*\{/g, '[');
  // Fix the matching closing: find } that closes these array literals and replace with ]
  code = fixArrayLiteralBraces(code);

  // ── 7. Array declarations ──
  // int[] arr = {1, 2, 3}; → let arr = [1, 2, 3];
  code = code.replace(/\b(?:int|long|float|double|boolean|char|String|byte|short)\s*\[\s*\]\s+(\w+)\s*=\s*\{/g, 'let $1 = [');
  // int[] arr = new int[n]; → let arr = new Array(n).fill(0);
  code = code.replace(/\b(?:int|long|float|double|boolean|char|String|byte|short)\s*\[\s*\]\s+(\w+)\s*=\s*new\s+\w+\s*\[\s*([^\]]+)\s*\]\s*;/g, 'let $1 = new Array($2).fill(0);');
  // int[] arr; → let arr = [];
  code = code.replace(/\b(?:int|long|float|double|boolean|char|String|byte|short)\s*\[\s*\]\s+(\w+)\s*;/g, 'let $1 = [];');

  // ── 8. Collections ──
  // ArrayList → array
  code = code.replace(/\b(?:ArrayList|List)\s*<[^>]*>\s+(\w+)\s*=\s*new\s+(?:ArrayList|LinkedList)\s*<[^>]*>\s*\(\s*\)\s*;/g, 'let $1 = [];');
  // HashMap/TreeMap → Map
  code = code.replace(/\b(?:HashMap|Map|TreeMap|LinkedHashMap)\s*<[^>]*>\s+(\w+)\s*=\s*new\s+\w+\s*<[^>]*>\s*\(\s*\)\s*;/g, 'let $1 = new Map();');
  // HashSet/TreeSet → Set
  code = code.replace(/\b(?:HashSet|Set|TreeSet|LinkedHashSet)\s*<[^>]*>\s+(\w+)\s*=\s*new\s+\w+\s*<[^>]*>\s*\(\s*\)\s*;/g, 'let $1 = new Set();');
  // Stack/Deque → array
  code = code.replace(/\b(?:Stack|Deque|ArrayDeque)\s*<[^>]*>\s+(\w+)\s*=\s*new\s+\w+\s*<[^>]*>\s*\(\s*\)\s*;/g, 'let $1 = [];');
  // StringBuilder
  code = code.replace(/\bStringBuilder\s+(\w+)\s*=\s*new\s+StringBuilder\s*\([^)]*\)\s*;/g, 'let $1 = "";');

  // ── 9. Method declarations (must come before type removal) ──
  // public static int[] twoSum(int[] nums, int target) { → function twoSum(nums, target) {
  // Handle various return types including arrays
  code = code.replace(
    /\b(?:public\s+|private\s+|protected\s+)?(?:static\s+)?(?:int|long|float|double|boolean|char|String|void|int\[\]|long\[\]|double\[\]|String\[\]|boolean\[\])\s+(\w+)\s*\(([^)]*)\)\s*\{/g,
    (match, name, params) => {
      const jsParams = params
        .split(',')
        .map(p => p.trim().replace(/^.*\s+(\w+)$/, '$1'))
        .filter(p => p.length > 0)
        .join(', ');
      return `function ${name}(${jsParams}) {`;
    }
  );

  // ── 10. Type declarations → let ──
  // int x = 5; → let x = 5;
  code = code.replace(/\b(?:int|long|float|double|boolean|char|String|var|byte|short)\s+(\w+)\s*=/g, 'let $1 =');
  // int x; → let x;
  code = code.replace(/\b(?:int|long|float|double|boolean|char|String|byte|short)\s+(\w+)\s*;/g, 'let $1;');

  // ── 11. for-each: for (int x : arr) → for (let x of arr) ──
  code = code.replace(/for\s*\(\s*(?:int|long|float|double|boolean|char|String|var|byte|short)\s+(\w+)\s*:\s*/g, 'for (let $1 of ');

  // ── 12. for loop type: for (int i = 0 → for (let i = 0 ──
  code = code.replace(/for\s*\(\s*(?:int|long|float|double|byte|short)\s+/g, 'for (let ');

  // ── 13. Collection method mappings ──
  code = code.replace(/\.add\s*\(/g, '.push(');
  code = code.replace(/(\w+)\.get\s*\(([^)]+)\)/g, '$1[$2]');
  code = code.replace(/(\w+)\.set\s*\(([^,]+),\s*([^)]+)\)/g, '$1[$2] = $3');
  code = code.replace(/(\w+)\.size\s*\(\s*\)/g, '$1.length');
  code = code.replace(/(\w+)\.isEmpty\s*\(\s*\)/g, '($1.length === 0)');
  code = code.replace(/\.contains\s*\(/g, '.includes(');

  // Map methods
  code = code.replace(/\.put\s*\(/g, '.set(');
  code = code.replace(/\.containsKey\s*\(/g, '.has(');
  code = code.replace(/(\w+)\.getOrDefault\s*\(([^,]+),\s*([^)]+)\)/g, '($1.has($2) ? $1.get($2) : $3)');

  // Stack methods
  code = code.replace(/(\w+)\.peek\s*\(\s*\)/g, '$1[$1.length - 1]');

  // ── 14. String methods ──
  code = code.replace(/(\w+)\.length\s*\(\s*\)/g, '$1.length');
  code = code.replace(/(\w+)\.equals\s*\(([^)]+)\)/g, '($1 === $2)');
  code = code.replace(/\.toCharArray\s*\(\s*\)/g, '.split("")');
  code = code.replace(/String\.valueOf\s*\(/g, 'String(');
  code = code.replace(/Integer\.parseInt\s*\(/g, 'parseInt(');
  code = code.replace(/Integer\.MAX_VALUE/g, 'Infinity');
  code = code.replace(/Integer\.MIN_VALUE/g, '-Infinity');

  // ── 15. Arrays utility ──
  code = code.replace(/Arrays\.sort\s*\((\w+)\)\s*;/g, '$1.sort((a, b) => a - b);');
  code = code.replace(/Arrays\.fill\s*\((\w+),\s*([^)]+)\)\s*;/g, '$1.fill($2);');
  code = code.replace(/Arrays\.toString\s*\((\w+)\)/g, 'JSON.stringify($1)');

  // ── 16. Casting removal ──
  code = code.replace(/\(\s*(?:int|long|float|double|char|byte|short)\s*\)\s*/g, '');

  // ── 17. Remove leftover modifiers ──
  code = code.replace(/\b(public|private|protected)\s+/g, '');
  code = code.replace(/\bstatic\s+/g, '');
  code = code.replace(/\bfinal\s+/g, '');

  // ── 18. Add simulated input data if Scanner was used ──
  if (needsInput) {
    const inputHeader = `// ⚠ Scanner detected — provide input values below\nlet __inputInts = [5, 2, 7, 11, 15, 9];\nlet __inputStrs = ["hello", "world"];\n\n`;
    code = inputHeader + code;
  }

  // ── 19. Cleanup ──
  code = code.replace(/\/\/ \[input removed\]/g, '');
  code = code.replace(/\n{3,}/g, '\n\n');

  return code.trim();
}

/**
 * Strip the outermost block matched by `pattern` and its closing brace.
 * E.g. removes "class Foo {" and its matching "}".
 */
function stripOuterBlock(code, pattern) {
  const match = code.match(pattern);
  if (!match) return code;

  const startIdx = code.indexOf(match[0]);
  // Remove the opening line
  code = code.substring(0, startIdx) + code.substring(startIdx + match[0].length);

  // Find the matching closing brace
  let depth = 0;
  let closeIdx = -1;
  for (let i = startIdx; i < code.length; i++) {
    if (code[i] === '{') depth++;
    if (code[i] === '}') {
      if (depth === 0) {
        closeIdx = i;
        break;
      }
      depth--;
    }
  }

  if (closeIdx >= 0) {
    code = code.substring(0, closeIdx) + code.substring(closeIdx + 1);
  }

  return code;
}

/**
 * Fix array literal braces: after converting `new int[]{` → `[`,
 * find the matching `}` on the same logical level and change to `]`.
 */
function fixArrayLiteralBraces(code) {
  let result = '';
  let i = 0;
  while (i < code.length) {
    // Look for `[` that was from a `new Type[]{` conversion
    if (code[i] === '[') {
      result += '[';
      i++;
      // Check if what follows looks like array literal content (not subscript)
      // We need to find the matching close
      let depth = 1;
      let j = i;
      let isArrayLiteral = false;

      // Peek ahead to see if there's a `}` or `];` to close this
      while (j < code.length && depth > 0) {
        if (code[j] === '[') depth++;
        else if (code[j] === ']') depth--;
        else if (code[j] === '}' && depth === 1) {
          // This might be the closing brace of our array literal
          isArrayLiteral = true;
          break;
        }
        j++;
      }

      if (isArrayLiteral) {
        // Copy content up to the brace, replacing } with ]
        result += code.substring(i, j) + ']';
        i = j + 1;
      }
      continue;
    }
    result += code[i];
    i++;
  }
  return result;
}
