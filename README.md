# ⚡ AlgoViz — Algorithm Visualizer

**See your code think, step by step.**

AlgoViz is a browser-based tool that lets you write code (JavaScript or Java), hit **Run**, and watch every single step of execution unfold visually — variables changing, arrays being sorted, loops iterating — all in real time with smooth animations.

Built for students, teachers, and anyone who wants to *actually understand* what their code is doing under the hood.

---

## 🤔 Why does this exist?

Reading code is one thing. Understanding what happens at each step — which variable changed, which index the loop is pointing at, when a swap occurs — is a completely different skill.

Most people learn algorithms by staring at code and trying to mentally trace through it. That's hard. AlgoViz removes the guesswork. You write code, press run, and the tool shows you:

- **Every variable** and its value at each step
- **Arrays visualized as bars** that grow, shrink, and highlight as pointers move
- **Maps and collections** displayed in a clean, readable format
- **Console output** captured and shown alongside the visual

No hand-waving. No "trust me, it works." You literally watch it happen.

---

## 🎬 What it looks like

The interface is a split-pane editor:

| Left Side | Right Side |
|-----------|------------|
| Monaco code editor (the same editor used in VS Code) | Visualization panel with animated bars, variable inspector, step descriptions, and console output |

A playback bar at the bottom lets you **play/pause**, **step forward/backward**, **scrub through steps**, and **control speed** — like a video player, but for your code.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **Java JDK** (only if you want to run Java code — JDK 11+ recommended)

### Installation

```bash
# Clone the repo
git clone https://github.com/rajeshkanna-36/Code-Visualizer.git
cd Code-Visualizer

# Install dependencies
npm install
```

### Running the App

**For JavaScript only** (no extra setup needed):

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser. That's it. Write JS code and hit Run.

**For Java support** (needs two terminals):

```bash
# Terminal 1 — Start the Java backend
npm run server

# Terminal 2 — Start the frontend
npm run dev
```

The Java backend runs on `http://localhost:3001`. The frontend automatically detects whether it's online (you'll see a green/red dot next to the Java button).

---

## 🧠 How it actually works

### JavaScript Tracing

The JS tracer doesn't just "run" your code. It:

1. **Parses** your code into an AST (Abstract Syntax Tree) using [Acorn](https://github.com/acornjs/acorn)
2. **Walks through** the AST node by node with a custom interpreter
3. **Captures a snapshot** after every statement — recording all variable values, array states, and what changed

This means your code runs inside a sandboxed interpreter, not `eval()`. It's safe and doesn't touch the actual browser environment.

### Java Tracing

Java works differently because Java is compiled, not interpreted:

1. Your code is sent to the **Express backend** (`server/index.js`)
2. The backend **instruments** your code — it inserts tracing calls (`__Tracer.snapshot(...)`) after every statement
3. The instrumented code is **compiled and run** using `javac` and `java` on your machine
4. Trace output is **parsed** from stdout and sent back to the frontend as snapshots

The instrumentation is smart — it tracks variable scope using brace depth, handles `for` loop variables correctly, and supports arrays, Maps, Collections, and all primitive types.

---

## 📁 Project Structure

```
Code-Visualizer/
├── index.html                  # Entry HTML page
├── package.json                # Dependencies and scripts
├── vite.config.js              # Vite bundler config
│
├── server/                     # Java backend (Express)
│   ├── index.js                # API routes (/api/trace-java, /api/run-java, /api/health)
│   ├── instrumenter.js         # Inserts __Tracer calls into Java source code
│   └── javaRunner.js           # Compiles and executes Java code via child_process
│
├── src/
│   ├── main.jsx                # React entry point
│   ├── App.jsx                 # Main app layout, language toggle, split pane
│   ├── index.css               # All styling (dark theme, animations, layout)
│   │
│   ├── engine/
│   │   ├── jsTracer.js         # Custom JS interpreter + snapshot engine
│   │   └── javaTranspiler.js   # Java-to-trace data transformer
│   │
│   ├── context/
│   │   └── VisualizerContext.jsx  # React context for state (snapshots, playback, speed)
│   │
│   ├── components/
│   │   ├── CodeEditor.jsx       # Monaco editor wrapper
│   │   ├── VisualizationPanel.jsx  # Main viz container
│   │   ├── ArrayVisualizer.jsx  # Animated bar chart for arrays
│   │   ├── MapVisualizer.jsx    # Key-value display for Maps/objects
│   │   ├── VariableInspector.jsx  # Scalar variable table with change highlighting
│   │   ├── StepDescription.jsx  # "What happened this step" text
│   │   ├── ConsoleOutput.jsx    # Captured console.log / System.out.println output
│   │   ├── PlaybackControls.jsx # Play/pause, step, scrub bar, speed control
│   │   └── TemplateSelector.jsx # Starter code templates
│   │
│   └── algorithms/
│       ├── templates.js         # JS algorithm templates
│       └── javaTemplates.js     # Java algorithm templates
│
└── public/
    └── favicon.svg             # App icon
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + Enter` | Run the code |
| `Space` | Play / Pause |
| `→` Arrow Right | Step forward |
| `←` Arrow Left | Step backward |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite 6, Monaco Editor |
| **Animations** | Motion (Framer Motion) |
| **Icons** | Lucide React |
| **JS Parsing** | Acorn |
| **Backend** | Express 5, Node.js |
| **Java Execution** | `javac` + `java` via child_process |
| **Styling** | Vanilla CSS (custom dark theme) |

---

## 📝 What you can visualize

The tool handles a solid chunk of standard code:

**JavaScript:**
- Variables (`let`, `const`, `var`)
- Arrays and all common methods (`push`, `pop`, `splice`, `sort`, `map`, `filter`, etc.)
- `for`, `while`, `do-while`, `for...of`, `for...in` loops
- `if/else`, `switch` statements
- Functions and recursion
- `Map`, `Set`, and objects
- `console.log()` output
- Template literals, destructuring, spread operator

**Java:**
- Primitives (`int`, `double`, `boolean`, `String`, etc.)
- Arrays (`int[]`, `String[]`, etc.)
- Collections (`ArrayList`, `HashMap`, `HashSet`, `Stack`, `Queue`, etc.)
- Standard control flow (`for`, `while`, `if/else`, `switch`)
- Method declarations and calls
- `System.out.println()` output

---

## ⚠️ Limitations

- **No async/await** — the JS tracer is synchronous
- **No imports** in JavaScript — it's a sandboxed interpreter, not Node.js
- **Maximum 10,000 steps** — to prevent infinite loops from freezing the browser
- **Java requires JDK on your machine** — the backend shells out to `javac` and `java`
- **No multi-file Java projects** — everything must be in a single class file

---

## 🤝 Contributing

Found a bug? Want to add support for a new language or data structure? PRs are welcome.

1. Fork the repo
2. Create your branch (`git checkout -b feature/cool-thing`)
3. Commit your changes (`git commit -m 'Add cool thing'`)
4. Push to the branch (`git push origin feature/cool-thing`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

**Built by [Rajesh Kanna](https://github.com/rajeshkanna-36)** — because algorithms deserve to be seen, not just read.
