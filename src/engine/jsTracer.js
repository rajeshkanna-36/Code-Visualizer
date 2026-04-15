/**
 * JS Tracer Engine
 * 
 * Uses Acorn to parse JavaScript code into an AST, then walks through
 * it step by step, evaluating each node and capturing variable snapshots.
 * 
 * This is a custom, simplified interpreter that handles the most common
 * JS constructs needed for algorithm visualization.
 */

const MAX_STEPS = 10000;

class Environment {
  constructor(parent = null) {
    this.vars = {};
    this.parent = parent;
  }

  get(name) {
    if (name in this.vars) return this.vars[name];
    if (this.parent) return this.parent.get(name);
    return undefined;
  }

  set(name, value) {
    if (name in this.vars || !this.parent) {
      this.vars[name] = value;
      return;
    }
    // Check parent chain
    let env = this.parent;
    while (env) {
      if (name in env.vars) {
        env.vars[name] = value;
        return;
      }
      env = env.parent;
    }
    this.vars[name] = value;
  }

  define(name, value) {
    this.vars[name] = value;
  }

  getAll() {
    const all = this.parent ? this.parent.getAll() : {};
    return { ...all, ...this.vars };
  }
}

function deepClone(val) {
  if (val === null || val === undefined) return val;
  if (typeof val !== 'object') return val;
  if (Array.isArray(val)) return val.map(deepClone);
  if (val instanceof Map) {
    const m = {};
    val.forEach((v, k) => { m[String(k)] = deepClone(v); });
    return { __type: 'Map', entries: m };
  }
  if (val instanceof Set) {
    return { __type: 'Set', values: [...val].map(deepClone) };
  }
  const obj = {};
  for (const k of Object.keys(val)) {
    obj[k] = deepClone(val[k]);
  }
  return obj;
}

function serializeValue(val) {
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  if (typeof val === 'function') return 'function';
  if (typeof val === 'string') return JSON.stringify(val);
  if (Array.isArray(val)) return JSON.stringify(val);
  if (val instanceof Map) {
    const entries = {};
    val.forEach((v, k) => entries[k] = v);
    return JSON.stringify(entries);
  }
  if (val instanceof Set) return JSON.stringify([...val]);
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

// Simple expression evaluator
function evalExpr(node, env) {
  if (!node) return undefined;

  switch (node.type) {
    case 'NumericLiteral':
    case 'Literal': {
      return node.value;
    }
    case 'StringLiteral': {
      return node.value;
    }
    case 'BooleanLiteral': {
      return node.value;
    }
    case 'NullLiteral': {
      return null;
    }
    case 'Identifier': {
      return env.get(node.name);
    }
    case 'ArrayExpression': {
      return (node.elements || []).map(el => {
        if (!el) return undefined;
        if (el.type === 'SpreadElement') {
          const arr = evalExpr(el.argument, env);
          return Array.isArray(arr) ? arr : [arr];
        }
        return evalExpr(el, env);
      }).flat();
    }
    case 'ObjectExpression': {
      const obj = {};
      for (const prop of node.properties) {
        const key = prop.key.name || prop.key.value || String(evalExpr(prop.key, env));
        obj[key] = evalExpr(prop.value, env);
      }
      return obj;
    }
    case 'TemplateLiteral': {
      let result = '';
      for (let i = 0; i < node.quasis.length; i++) {
        result += node.quasis[i].value.cooked || node.quasis[i].value.raw;
        if (i < (node.expressions || []).length) {
          result += String(evalExpr(node.expressions[i], env));
        }
      }
      return result;
    }
    case 'UnaryExpression': {
      const arg = evalExpr(node.argument, env);
      switch (node.operator) {
        case '-': return -arg;
        case '+': return +arg;
        case '!': return !arg;
        case '~': return ~arg;
        case 'typeof': return typeof arg;
        case 'void': return undefined;
        default: return undefined;
      }
    }
    case 'BinaryExpression': {
      const left = evalExpr(node.left, env);
      const right = evalExpr(node.right, env);
      switch (node.operator) {
        case '+': return left + right;
        case '-': return left - right;
        case '*': return left * right;
        case '/': return left / right;
        case '%': return left % right;
        case '**': return left ** right;
        case '==': return left == right;
        case '!=': return left != right;
        case '===': return left === right;
        case '!==': return left !== right;
        case '<': return left < right;
        case '>': return left > right;
        case '<=': return left <= right;
        case '>=': return left >= right;
        case '&': return left & right;
        case '|': return left | right;
        case '^': return left ^ right;
        case '<<': return left << right;
        case '>>': return left >> right;
        case '>>>': return left >>> right;
        default: return undefined;
      }
    }
    case 'LogicalExpression': {
      const left = evalExpr(node.left, env);
      switch (node.operator) {
        case '&&': return left && evalExpr(node.right, env);
        case '||': return left || evalExpr(node.right, env);
        case '??': return left ?? evalExpr(node.right, env);
        default: return undefined;
      }
    }
    case 'ConditionalExpression': {
      return evalExpr(node.test, env) ? evalExpr(node.consequent, env) : evalExpr(node.alternate, env);
    }
    case 'MemberExpression': {
      const obj = evalExpr(node.object, env);
      const prop = node.computed ? evalExpr(node.property, env) : node.property.name;
      if (obj == null) return undefined;
      if (typeof obj === 'string' && prop === 'length') return obj.length;
      if (Array.isArray(obj) && prop === 'length') return obj.length;
      return obj[prop];
    }
    case 'CallExpression': {
      const callee = node.callee;
      const args = node.arguments.map(a => evalExpr(a, env));

      // Handle method calls (e.g., arr.push(...))
      if (callee.type === 'MemberExpression') {
        const obj = evalExpr(callee.object, env);
        const method = callee.computed ? evalExpr(callee.property, env) : callee.property.name;

        if (obj == null) throw new Error(`Cannot call method '${method}' on ${obj}`);

        // Built-in array methods
        if (Array.isArray(obj)) {
          switch (method) {
            case 'push': return obj.push(...args);
            case 'pop': return obj.pop();
            case 'shift': return obj.shift();
            case 'unshift': return obj.unshift(...args);
            case 'splice': return obj.splice(...args);
            case 'slice': return obj.slice(...args);
            case 'indexOf': return obj.indexOf(...args);
            case 'includes': return obj.includes(...args);
            case 'join': return obj.join(...args);
            case 'reverse': return obj.reverse();
            case 'sort': return obj.sort(...args);
            case 'map': return obj.map(...args);
            case 'filter': return obj.filter(...args);
            case 'reduce': return obj.reduce(...args);
            case 'forEach': { obj.forEach(...args); return undefined; }
            case 'find': return obj.find(...args);
            case 'findIndex': return obj.findIndex(...args);
            case 'some': return obj.some(...args);
            case 'every': return obj.every(...args);
            case 'flat': return obj.flat(...args);
            case 'fill': return obj.fill(...args);
            case 'concat': return obj.concat(...args);
            default: return undefined;
          }
        }

        // String methods
        if (typeof obj === 'string') {
          switch (method) {
            case 'charAt': return obj.charAt(...args);
            case 'charCodeAt': return obj.charCodeAt(...args);
            case 'indexOf': return obj.indexOf(...args);
            case 'includes': return obj.includes(...args);
            case 'slice': return obj.slice(...args);
            case 'substring': return obj.substring(...args);
            case 'toLowerCase': return obj.toLowerCase();
            case 'toUpperCase': return obj.toUpperCase();
            case 'trim': return obj.trim();
            case 'split': return obj.split(...args);
            case 'replace': return obj.replace(...args);
            case 'startsWith': return obj.startsWith(...args);
            case 'endsWith': return obj.endsWith(...args);
            case 'repeat': return obj.repeat(...args);
            default: return undefined;
          }
        }

        // Map methods
        if (obj instanceof Map) {
          switch (method) {
            case 'set': return obj.set(args[0], args[1]);
            case 'get': return obj.get(args[0]);
            case 'has': return obj.has(args[0]);
            case 'delete': return obj.delete(args[0]);
            case 'clear': return obj.clear();
            case 'size': return obj.size;
            default: return undefined;
          }
        }

        // Set methods
        if (obj instanceof Set) {
          switch (method) {
            case 'add': return obj.add(args[0]);
            case 'has': return obj.has(args[0]);
            case 'delete': return obj.delete(args[0]);
            case 'clear': return obj.clear();
            default: return undefined;
          }
        }

        // Object methods
        if (typeof obj === 'object' && typeof obj[method] === 'function') {
          return obj[method](...args);
        }
        return undefined;
      }

      // Handle global functions
      if (callee.type === 'Identifier') {
        switch (callee.name) {
          case 'Math': return undefined;
          case 'parseInt': return parseInt(...args);
          case 'parseFloat': return parseFloat(...args);
          case 'isNaN': return isNaN(...args);
          case 'isFinite': return isFinite(...args);
          case 'String': return String(...args);
          case 'Number': return Number(...args);
          case 'Boolean': return Boolean(...args);
          case 'Array': {
            if (args.length === 1 && typeof args[0] === 'number') return new Array(args[0]);
            return [...args];
          }
          default: {
            const fn = env.get(callee.name);
            if (typeof fn === 'function') return fn(...args);
            return undefined;
          }
        }
      }
      return undefined;
    }
    case 'NewExpression': {
      const args = node.arguments.map(a => evalExpr(a, env));
      if (node.callee.type === 'Identifier') {
        switch (node.callee.name) {
          case 'Map': return new Map(args[0] || []);
          case 'Set': return new Set(args[0] || []);
          case 'Array': {
            if (args.length === 1 && typeof args[0] === 'number') return new Array(args[0]).fill(undefined);
            return [...args];
          }
          case 'Object': return {};
          default: return {};
        }
      }
      return {};
    }
    case 'ArrowFunctionExpression':
    case 'FunctionExpression': {
      return (...callArgs) => {
        const fnEnv = new Environment(env);
        (node.params || []).forEach((p, i) => {
          if (p.type === 'Identifier') fnEnv.define(p.name, callArgs[i]);
          if (p.type === 'AssignmentPattern') fnEnv.define(p.left.name, callArgs[i] !== undefined ? callArgs[i] : evalExpr(p.right, env));
        });
        if (node.body.type === 'BlockStatement') {
          const result = execBlock(node.body.body, fnEnv, []);
          return result.__returnValue;
        } else {
          return evalExpr(node.body, fnEnv);
        }
      };
    }
    case 'AssignmentExpression': {
      let val = evalExpr(node.right, env);
      if (node.left.type === 'Identifier') {
        const name = node.left.name;
        const old = env.get(name);
        switch (node.operator) {
          case '=': break;
          case '+=': val = old + val; break;
          case '-=': val = old - val; break;
          case '*=': val = old * val; break;
          case '/=': val = old / val; break;
          case '%=': val = old % val; break;
          case '**=': val = old ** val; break;
          case '&=': val = old & val; break;
          case '|=': val = old | val; break;
          case '^=': val = old ^ val; break;
          default: break;
        }
        env.set(name, val);
      } else if (node.left.type === 'MemberExpression') {
        const obj = evalExpr(node.left.object, env);
        const prop = node.left.computed ? evalExpr(node.left.property, env) : node.left.property.name;
        const old = obj[prop];
        switch (node.operator) {
          case '=': break;
          case '+=': val = old + val; break;
          case '-=': val = old - val; break;
          case '*=': val = old * val; break;
          case '/=': val = old / val; break;
          default: break;
        }
        obj[prop] = val;
      }
      return val;
    }
    case 'UpdateExpression': {
      if (node.argument.type === 'Identifier') {
        const name = node.argument.name;
        const old = env.get(name);
        const newVal = node.operator === '++' ? old + 1 : old - 1;
        env.set(name, newVal);
        return node.prefix ? newVal : old;
      }
      if (node.argument.type === 'MemberExpression') {
        const obj = evalExpr(node.argument.object, env);
        const prop = node.argument.computed ? evalExpr(node.argument.property, env) : node.argument.property.name;
        const old = obj[prop];
        const newVal = node.operator === '++' ? old + 1 : old - 1;
        obj[prop] = newVal;
        return node.prefix ? newVal : old;
      }
      return undefined;
    }
    case 'SpreadElement': {
      return evalExpr(node.argument, env);
    }
    case 'SequenceExpression': {
      let result;
      for (const expr of node.expressions) {
        result = evalExpr(expr, env);
      }
      return result;
    }
    default:
      return undefined;
  }
}

// Execute a block of statements, pushing snapshots
function execBlock(statements, env, snapshots, consoleOutput) {
  const result = { __returnValue: undefined, __break: false, __continue: false };

  for (const stmt of statements) {
    if (snapshots.length >= MAX_STEPS) {
      throw new Error('Maximum step limit reached (10,000). Possible infinite loop.');
    }

    execStatement(stmt, env, snapshots, consoleOutput, result);

    if (result.__returnValue !== undefined || result.__break || result.__continue) {
      break;
    }
  }

  return result;
}

function getLineDescription(stmt, env) {
  // Generate a human-readable description of what this statement does
  if (!stmt) return '';
  switch (stmt.type) {
    case 'VariableDeclaration': {
      const decl = stmt.declarations[0];
      const name = decl.id?.name || '?';
      return `Declare ${stmt.kind} ${name}`;
    }
    case 'ExpressionStatement': {
      const expr = stmt.expression;
      if (expr.type === 'AssignmentExpression') {
        const left = expr.left.type === 'Identifier' ? expr.left.name :
          expr.left.type === 'MemberExpression' ?
            `${expr.left.object.name || '?'}[${expr.left.computed ? '...' : expr.left.property.name}]` : '?';
        return `Assign ${left}`;
      }
      if (expr.type === 'UpdateExpression') {
        return `Update ${expr.argument.name || '?'} (${expr.operator})`;
      }
      if (expr.type === 'CallExpression') {
        if (expr.callee.type === 'MemberExpression') {
          return `Call ${expr.callee.object.name || '?'}.${expr.callee.property.name || '?'}()`;
        }
        return `Call ${expr.callee.name || '?'}()`;
      }
      return 'Expression';
    }
    case 'IfStatement': return 'Check condition (if)';
    case 'ForStatement': return 'For loop iteration';
    case 'WhileStatement': return 'While loop check';
    case 'ReturnStatement': return 'Return value';
    case 'FunctionDeclaration': return `Define function ${stmt.id?.name || '?'}`;
    default: return stmt.type;
  }
}

function detectArraysAndStructures(env) {
  const vars = env.getAll();
  const structures = { arrays: {}, maps: {}, stacks: {}, scalars: {} };

  for (const [key, val] of Object.entries(vars)) {
    if (typeof val === 'function') continue;
    if (key.startsWith('__')) continue;
    if (Array.isArray(val)) {
      structures.arrays[key] = deepClone(val);
    } else if (val instanceof Map) {
      structures.maps[key] = deepClone(val);
    } else if (val instanceof Set) {
      structures.maps[key] = deepClone(val);
    } else if (typeof val === 'object' && val !== null) {
      structures.scalars[key] = deepClone(val);
    } else {
      structures.scalars[key] = val;
    }
  }
  return structures;
}

function pushSnapshot(snapshots, stmt, env, description, consoleOutput) {
  const line = stmt?.loc?.start?.line || 0;
  const structures = detectArraysAndStructures(env);
  const allVars = env.getAll();
  const variables = {};
  for (const [k, v] of Object.entries(allVars)) {
    if (typeof v === 'function') continue;
    if (k.startsWith('__')) continue;
    variables[k] = deepClone(v);
  }

  // Detect which variables changed
  const prevSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const changed = [];
  if (prevSnapshot) {
    for (const [k, v] of Object.entries(variables)) {
      const prev = prevSnapshot.variables[k];
      if (JSON.stringify(prev) !== JSON.stringify(v)) {
        changed.push(k);
      }
    }
    // New variables
    for (const k of Object.keys(variables)) {
      if (!(k in (prevSnapshot.variables || {}))) {
        changed.push(k);
      }
    }
  }

  snapshots.push({
    step: snapshots.length,
    line,
    variables,
    structures,
    description: description || getLineDescription(stmt, env),
    changed,
    consoleOutput: consoleOutput ? [...consoleOutput] : [],
  });
}

function execStatement(stmt, env, snapshots, consoleOutput, result) {
  if (!stmt) return;

  switch (stmt.type) {
    case 'VariableDeclaration': {
      for (const decl of stmt.declarations) {
        const val = decl.init ? evalExpr(decl.init, env) : undefined;
        if (decl.id.type === 'Identifier') {
          env.define(decl.id.name, val);
        } else if (decl.id.type === 'ArrayPattern') {
          // Destructuring: const [a, b] = ...
          const arr = Array.isArray(val) ? val : [];
          decl.id.elements.forEach((el, i) => {
            if (el && el.type === 'Identifier') {
              env.define(el.name, arr[i]);
            }
          });
        } else if (decl.id.type === 'ObjectPattern') {
          const obj = val || {};
          decl.id.properties.forEach(prop => {
            const key = prop.key.name || prop.key.value;
            if (prop.value.type === 'Identifier') {
              env.define(prop.value.name, obj[key]);
            }
          });
        }
      }
      pushSnapshot(snapshots, stmt, env, null, consoleOutput);
      break;
    }

    case 'ExpressionStatement': {
      const expr = stmt.expression;
      // Handle console.log
      if (expr.type === 'CallExpression' &&
        expr.callee.type === 'MemberExpression' &&
        expr.callee.object.name === 'console' &&
        expr.callee.property.name === 'log') {
        const args = expr.arguments.map(a => evalExpr(a, env));
        const output = args.map(a => {
          if (typeof a === 'object') return JSON.stringify(a);
          return String(a);
        }).join(' ');
        consoleOutput.push(output);
        pushSnapshot(snapshots, stmt, env, `console.log(${output})`, consoleOutput);
      } else {
        evalExpr(expr, env);
        pushSnapshot(snapshots, stmt, env, null, consoleOutput);
      }
      break;
    }

    case 'IfStatement': {
      const test = evalExpr(stmt.test, env);
      pushSnapshot(snapshots, stmt, env, `If condition: ${test ? 'true' : 'false'}`, consoleOutput);
      if (test) {
        if (stmt.consequent.type === 'BlockStatement') {
          const r = execBlock(stmt.consequent.body, env, snapshots, consoleOutput);
          if (r.__returnValue !== undefined) result.__returnValue = r.__returnValue;
          if (r.__break) result.__break = true;
          if (r.__continue) result.__continue = true;
        } else {
          execStatement(stmt.consequent, env, snapshots, consoleOutput, result);
        }
      } else if (stmt.alternate) {
        if (stmt.alternate.type === 'BlockStatement') {
          const r = execBlock(stmt.alternate.body, env, snapshots, consoleOutput);
          if (r.__returnValue !== undefined) result.__returnValue = r.__returnValue;
          if (r.__break) result.__break = true;
          if (r.__continue) result.__continue = true;
        } else {
          execStatement(stmt.alternate, env, snapshots, consoleOutput, result);
        }
      }
      break;
    }

    case 'ForStatement': {
      const forEnv = new Environment(env);
      if (stmt.init) {
        if (stmt.init.type === 'VariableDeclaration') {
          for (const decl of stmt.init.declarations) {
            forEnv.define(decl.id.name, decl.init ? evalExpr(decl.init, forEnv) : undefined);
          }
        } else {
          evalExpr(stmt.init, forEnv);
        }
        pushSnapshot(snapshots, stmt, forEnv, 'For loop: initialize', consoleOutput);
      }

      while (true) {
        if (snapshots.length >= MAX_STEPS) throw new Error('Maximum step limit reached (10,000). Possible infinite loop.');

        if (stmt.test) {
          const test = evalExpr(stmt.test, forEnv);
          pushSnapshot(snapshots, stmt, forEnv, `For loop condition: ${test ? 'true' : 'false'}`, consoleOutput);
          if (!test) break;
        }

        if (stmt.body.type === 'BlockStatement') {
          const r = execBlock(stmt.body.body, forEnv, snapshots, consoleOutput);
          if (r.__returnValue !== undefined) { result.__returnValue = r.__returnValue; return; }
          if (r.__break) break;
        } else {
          const r = { __returnValue: undefined, __break: false, __continue: false };
          execStatement(stmt.body, forEnv, snapshots, consoleOutput, r);
          if (r.__returnValue !== undefined) { result.__returnValue = r.__returnValue; return; }
          if (r.__break) break;
        }

        if (stmt.update) {
          evalExpr(stmt.update, forEnv);
          pushSnapshot(snapshots, stmt, forEnv, 'For loop: update', consoleOutput);
        }
      }

      // Copy forEnv vars back to env
      for (const [k, v] of Object.entries(forEnv.vars)) {
        if (k in env.vars || !env.parent) env.set(k, v);
      }
      break;
    }

    case 'WhileStatement': {
      while (true) {
        if (snapshots.length >= MAX_STEPS) throw new Error('Maximum step limit reached (10,000). Possible infinite loop.');

        const test = evalExpr(stmt.test, env);
        pushSnapshot(snapshots, stmt, env, `While condition: ${test ? 'true' : 'false'}`, consoleOutput);
        if (!test) break;

        if (stmt.body.type === 'BlockStatement') {
          const r = execBlock(stmt.body.body, env, snapshots, consoleOutput);
          if (r.__returnValue !== undefined) { result.__returnValue = r.__returnValue; return; }
          if (r.__break) break;
        } else {
          const r = { __returnValue: undefined, __break: false, __continue: false };
          execStatement(stmt.body, env, snapshots, consoleOutput, r);
          if (r.__returnValue !== undefined) { result.__returnValue = r.__returnValue; return; }
          if (r.__break) break;
        }
      }
      break;
    }

    case 'DoWhileStatement': {
      do {
        if (snapshots.length >= MAX_STEPS) throw new Error('Maximum step limit reached (10,000). Possible infinite loop.');

        if (stmt.body.type === 'BlockStatement') {
          const r = execBlock(stmt.body.body, env, snapshots, consoleOutput);
          if (r.__returnValue !== undefined) { result.__returnValue = r.__returnValue; return; }
          if (r.__break) break;
        } else {
          const r = { __returnValue: undefined, __break: false, __continue: false };
          execStatement(stmt.body, env, snapshots, consoleOutput, r);
          if (r.__returnValue !== undefined) { result.__returnValue = r.__returnValue; return; }
          if (r.__break) break;
        }

        const test = evalExpr(stmt.test, env);
        pushSnapshot(snapshots, stmt, env, `Do-while condition: ${test ? 'true' : 'false'}`, consoleOutput);
        if (!test) break;
      } while (true);
      break;
    }

    case 'ForOfStatement': {
      const iterable = evalExpr(stmt.right, env);
      const arr = Array.isArray(iterable) ? iterable : (typeof iterable === 'string' ? iterable.split('') : []);
      for (const item of arr) {
        if (snapshots.length >= MAX_STEPS) throw new Error('Maximum step limit reached (10,000). Possible infinite loop.');
        if (stmt.left.type === 'VariableDeclaration') {
          env.define(stmt.left.declarations[0].id.name, item);
        }
        pushSnapshot(snapshots, stmt, env, `For-of: ${serializeValue(item)}`, consoleOutput);
        if (stmt.body.type === 'BlockStatement') {
          const r = execBlock(stmt.body.body, env, snapshots, consoleOutput);
          if (r.__returnValue !== undefined) { result.__returnValue = r.__returnValue; return; }
          if (r.__break) break;
        } else {
          const r = { __returnValue: undefined, __break: false, __continue: false };
          execStatement(stmt.body, env, snapshots, consoleOutput, r);
          if (r.__returnValue !== undefined) { result.__returnValue = r.__returnValue; return; }
          if (r.__break) break;
        }
      }
      break;
    }

    case 'ForInStatement': {
      const obj = evalExpr(stmt.right, env);
      const keys = Object.keys(obj || {});
      for (const key of keys) {
        if (snapshots.length >= MAX_STEPS) throw new Error('Maximum step limit reached (10,000). Possible infinite loop.');
        if (stmt.left.type === 'VariableDeclaration') {
          env.define(stmt.left.declarations[0].id.name, key);
        }
        pushSnapshot(snapshots, stmt, env, `For-in: key = ${key}`, consoleOutput);
        if (stmt.body.type === 'BlockStatement') {
          const r = execBlock(stmt.body.body, env, snapshots, consoleOutput);
          if (r.__returnValue !== undefined) { result.__returnValue = r.__returnValue; return; }
          if (r.__break) break;
        }
      }
      break;
    }

    case 'SwitchStatement': {
      const disc = evalExpr(stmt.discriminant, env);
      let matched = false;
      for (const cs of stmt.cases) {
        if (cs.test && evalExpr(cs.test, env) === disc) matched = true;
        if (!cs.test) matched = true; // default case
        if (matched) {
          const r = execBlock(cs.consequent, env, snapshots, consoleOutput);
          if (r.__break) break;
          if (r.__returnValue !== undefined) { result.__returnValue = r.__returnValue; return; }
        }
      }
      break;
    }

    case 'ReturnStatement': {
      result.__returnValue = stmt.argument ? evalExpr(stmt.argument, env) : undefined;
      pushSnapshot(snapshots, stmt, env, `Return: ${serializeValue(result.__returnValue)}`, consoleOutput);
      break;
    }

    case 'BreakStatement': {
      result.__break = true;
      break;
    }

    case 'ContinueStatement': {
      result.__continue = true;
      break;
    }

    case 'FunctionDeclaration': {
      if (stmt.id) {
        const fn = (...args) => {
          const fnEnv = new Environment(env);
          (stmt.params || []).forEach((p, i) => {
            if (p.type === 'Identifier') fnEnv.define(p.name, args[i]);
            if (p.type === 'AssignmentPattern') fnEnv.define(p.left.name, args[i] !== undefined ? args[i] : evalExpr(p.right, env));
          });
          const r = execBlock(stmt.body.body, fnEnv, snapshots, consoleOutput);
          return r.__returnValue;
        };
        env.define(stmt.id.name, fn);
      }
      pushSnapshot(snapshots, stmt, env, `Define function ${stmt.id?.name || 'anonymous'}`, consoleOutput);
      break;
    }

    case 'BlockStatement': {
      const r = execBlock(stmt.body, env, snapshots, consoleOutput);
      if (r.__returnValue !== undefined) result.__returnValue = r.__returnValue;
      if (r.__break) result.__break = true;
      if (r.__continue) result.__continue = true;
      break;
    }

    case 'EmptyStatement': {
      break;
    }

    default: {
      // Try evaluating as expression
      try {
        evalExpr(stmt, env);
        pushSnapshot(snapshots, stmt, env, null, consoleOutput);
      } catch (e) {
        // skip unknown
      }
    }
  }
}

/**
 * Main trace function — parses and executes code, returning snapshots
 * @param {string} code - source code to trace
 * @param {string} language - 'javascript' or 'java'
 */
export async function traceCode(code, language = 'javascript') {
  let jsCode = code;

  // Transpile Java to JS if needed
  if (language === 'java') {
    const { transpileJava } = await import('./javaTranspiler.js');
    jsCode = transpileJava(code);
    console.log('[AlgoViz] Transpiled Java → JS:\n', jsCode);
  }

  // Use Acorn to parse the code
  const { parse } = await import('acorn');

  const ast = parse(jsCode, {
    ecmaVersion: 2022,
    sourceType: 'module',
    locations: true,
  });

  const env = new Environment();
  const snapshots = [];
  const consoleOutput = [];

  // Inject built-ins
  env.define('Math', Math);
  env.define('JSON', JSON);
  env.define('console', { log: () => {} }); // stub, handled in execStatement
  env.define('Infinity', Infinity);
  env.define('NaN', NaN);
  env.define('undefined', undefined);

  execBlock(ast.body, env, snapshots, consoleOutput);

  return { snapshots, consoleOutput };
}
