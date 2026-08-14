// src/js/skillExtractor.js

const TECH_DICTIONARY = [
  "python", "javascript", "java", "c++", "c#", "ruby", "rust", "golang",
  "typescript", "swift", "kotlin", "php", "scala", "haskell", "lua", "perl", 
  "julia", "matlab", "dart", "shell", "bash", "assembly", "sql", "elixir", "erlang", "clojure",
  "fortran", "ocaml", "smalltalk", "pharo", "d lang", "verilog", "verilog-a", "vhdl", "fasm", "tcl", "scheme",
  "lisp", "prolog", "solidity", "assembly", "asm", "x86", "arm", "mips", "risc-v",
  
  "react", "angular", "vue", "django", "flask", "spring", "spring boot", "node.js", "nodejs",
  "express", "ruby on rails", "laravel", "asp.net", "svelte", "next.js", "nextjs", "tailwind",
  "bootstrap", "jquery", "html", "css", "graphql", "rest", "soap", "fastapi", "gin",
  "solidjs", "remix", "astro", "vite", "webpack", "babel", "symfony", "meteor.js",
  "vuejs", "reactjs", "hibernate", "jakarta ee", "webrtc", "electron", "meteor",
  "html5 canvas", "canvas", "wasm", "webassembly", "ecmascript", "mediawiki",
  
  "android", "ios", "flutter", "react native", "xamarin", "ionic", "swiftui", "jetpack compose",

  "mysql", "postgresql", "mongodb", "sqlite", "redis", "cassandra", "oracle", 
  "elasticsearch", "mariadb", "firebase", "supabase", "appwrite", "dynamodb", "couchdb",
  "postgis", "big data", "distributed storage", "couchdb", "mariadb",
  
  "aws", "azure", "gcp", "google cloud", "docker", "kubernetes", "jenkins", "gitlab ci", 
  "github actions", "terraform", "ansible", "linux", "unix", "ubuntu", "centos", "debian",
  "nginx", "apache", "prometheus", "grafana", "istio", "helm", "tekton", "ci/cd", "unikernels",
  "kvm", "xen", "qemu", "virtualization", "serverless", "ebpf", "containerd", "sdet", "devops",
  "kernel", "posix", "bsd", "unix", "real-time os", "rtos",

  "machine learning", "ml", "artificial intelligence", "ai", "deep learning", 
  "data science", "data analysis", "computer vision", "nlp", "natural language processing",
  "robotics", "ros", "blockchain", "cryptography", "security", "cybersecurity",
  "penetration testing", "game dev", "game development", "3d", "opengl", "vulkan", "webgl",
  "bioinformatics", "genomics", "physics", "simulation", "computational geometry",
  "networking", "embedded", "iot", "systems programming", "compilers", "operating systems",
  "cloud native", "distributed systems", "microservices", "web3", "xr", "ar", "vr",
  "gis", "geospatial", "neuroscience", "computational biology", "fuzzing", "malware analysis",
  "reverse engineering", "hpc", "eda", "chip design", "quantum chemistry", "astrophysics",
  "biomedical", "healthcare", "fintech", "edtech", "social impact", "open knowledge",
  "distributed storage", "multi-physics", "simulation", "mapping", "genomics", "bioinformatics",
  "mass spectrometry", "meteorology", "climate science", "fluid dynamics", "cfd", "aerospace",
  "graphics", "animation", "audio", "video", "multimedia", "codecs", "ffmpeg",

  "tensorflow", "pytorch", "keras", "scikit-learn", "numpy", "pandas", "scipy", "matplotlib",
  "opencv", "qt", "gtk", "cmake", "make", "git", "vim", "emacs", "zsh", "ninja", "bazel",
  "latex", "markdown", "d3.js", "three.js", "ffmpeg", "gstreamer", "vlc", "ghidra", "ida-pro",
  "cuda", "opencl", "openmp", "mpi", "webgpu", "antlr", "xpath", "z3", "simd", "llvm", "clang",
  "mlir", "qemu", "vulkan", "opengl", "directx", "vulkan", "webgl"
];

const SORTED_TECH_DICTIONARY = [...new Set(TECH_DICTIONARY)].sort((a, b) => b.length - a.length);

function normalizeSkill(skill) {
  const mapping = {
    'nodejs': 'node.js',
    'node.js': 'node.js',
    'next.js': 'nextjs',
    'nextjs': 'nextjs',
    'reactjs': 'react',
    'vuejs': 'vue.js',
    'vue.js': 'vue.js',
    'springboot': 'springboot',
    'spring boot': 'springboot',
    'ruby on rails': 'ruby on rails',
    'rails': 'ruby on rails',
    'meteor': 'meteor.js',
    'meteor.js': 'meteor.js',
    'angular': 'angularjs',
    'angularjs': 'angularjs',
    
    'go': 'go',
    'golang': 'go',
    'c#': 'csharp',
    'csharp': 'csharp',
    'd lang': 'd lang',
    'fasm': 'fasm',
    'x86 assembly': 'fasm',
    'shell': 'shell script',
    'bash': 'shell script',
    'shell script': 'shell script',
    
    'ml': 'machine learning',
    'machine learning': 'machine learning',
    'ai': 'ai',
    'artificial intelligence': 'ai',
    'cv': 'computer vision',
    'computer vision': 'computer vision',
    'nlp': 'natural language processing',
    'natural language processing': 'natural language processing',
    'security': 'security',
    'cybersecurity': 'security',
    'distributed systems': 'distributed systems',
    'distributed': 'distributed systems',
    'game development': 'game dev',
    'game dev': 'game dev',
    '3d graphics': '3d',
    'graphics': '3d',
    'computational geometry': 'geometry',
    
    'html5 canvas': 'html5 canvas',
    'canvas': 'html5 canvas',
    'llvm': 'llvm',
    'qemu': 'qemu'
  };
  return mapping[skill] || skill;
}

function extractSkills(text) {
  if (!text || typeof text !== 'string') return [];
  
  const normalizedText = text.toLowerCase();
  const matchedSkills = new Set();
  
  SORTED_TECH_DICTIONARY.forEach(skill => {
    const escapedSkill = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, String.raw`\$&`);
    let regexStr = '';
    const isSingleChar = skill.length === 1;
    const hasSpecialChar = skill.includes('+') || skill.includes('#') || skill.includes('.');
    
    if (isSingleChar || hasSpecialChar) {
      regexStr = String.raw`(?<=^|\s|[(\[,/])` + escapedSkill + String.raw`(?=$|\s|[.,:;!)/])`;
    } else {
      regexStr = String.raw`\b` + escapedSkill + String.raw`\b`;
    }
    
    if (new RegExp(regexStr, 'i').test(normalizedText)) {
      matchedSkills.add(normalizeSkill(skill));
    }
  });
  
  if (!matchedSkills.has('go')) {
    const goLangKeywords = [
      'programming', 'language', 'developer', 'backend',
      'distributed', 'concurrency', 'goroutines', 'go1.',
      'go developer', 'go programming', 'written in go', 'experience with go',
      'using go', 'i use go', 'go lang', 'go application'
    ];
    const hasGoTechContext = goLangKeywords.some(kw => normalizedText.includes(kw));
    const goRegex = /\bgo\b(?!\s+(to|into|for|ahead|back|on|through|with|away|around|up|down|off|out))/i;

    if ((matchedSkills.size > 0 || hasGoTechContext) && goRegex.test(normalizedText)) {
      matchedSkills.add('go');
    }
  }

  if (!matchedSkills.has('c')) {
    const cContextRegex = /\b(c programming|c language|proficient in c|knowledge of c|written in c|experience with c|using c|c developer|c code|c project)(?![+#\w])/i;
    const cListRegex = /\b(python|java|c\+\+|rust|javascript|assembly|go|ruby)\s*[,/]\s*c(?![+#\w])|\bc(?![+#\w])\s*[,/]\s*(python|java|c\+\+|rust|javascript|assembly|go|ruby)\b/i;
    if (cContextRegex.test(normalizedText) || cListRegex.test(normalizedText)) {
      matchedSkills.add('c');
    }
  }

  if (!matchedSkills.has('r')) {
    const rContextRegex = /\b(r programming|r language|r statistics|rstudio|r studio|r package|r packages|r script|experience with r|using r|proficient in r)\b/i;
    const rListRegex = /\b(python|julia|matlab|statistics|stata|sas)\s*[,/]\s*r\b|\br\s*[,/]\s*(python|julia|matlab|statistics|stata|sas)\b/i;
    if (rContextRegex.test(normalizedText) || rListRegex.test(normalizedText)) {
      matchedSkills.add('r');
    }
  }
  
  return Array.from(matchedSkills);
}

globalThis.normalizeSkill = normalizeSkill;
globalThis.extractSkills = extractSkills;

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { normalizeSkill, extractSkills };
}

