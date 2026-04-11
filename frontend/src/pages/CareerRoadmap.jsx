import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import RoadmapResult from '../components/RoadmapResult';
import axiosClient from '../api/axiosClient';



// ── Domain → Focus Area / Tech Stack mapping ─────────────────
const DOMAIN_OPTIONS = {
  "AI & Machine Learning": {
    focus: ["Computer Vision", "NLP", "Reinforcement Learning", "Generative AI", "MLOps", "Data Science", "AI for Healthcare"],
    tech: ["Python + TensorFlow", "Python + PyTorch", "Python + scikit-learn", "Hugging Face", "LangChain + LLMs"]
  },
  "Web Development": {
    focus: ["Frontend Development", "Backend Development", "Full Stack Development", "DevOps"],
    tech: ["React + Node.js", "Spring Boot + React", "Django + Vue", "Next.js", "MERN Stack"]
  },
  "Cybersecurity": {
    focus: ["Ethical Hacking", "Network Security", "Cloud Security", "SOC Analysis", "Malware Analysis"],
    tech: ["Kali Linux + Python", "Wireshark + Metasploit", "SIEM Tools", "Burp Suite"]
  },
  "Data Science & Analytics": {
    focus: ["Business Intelligence", "Statistical Modeling", "Big Data Engineering", "Data Visualization"],
    tech: ["Python + Pandas", "R + Tidyverse", "SQL + Tableau", "PySpark + Hadoop"]
  },
  "Cloud Computing & DevOps": {
    focus: ["Cloud Architecture", "CI/CD Pipelines", "Infrastructure as Code", "Containerization"],
    tech: ["AWS + Terraform", "Azure + Docker", "GCP + Kubernetes", "Jenkins + Ansible"]
  },
  "Mobile App Development": {
    focus: ["Android Development", "iOS Development", "Cross-Platform", "Mobile UI/UX"],
    tech: ["Kotlin + Android", "Swift + iOS", "React Native", "Flutter + Dart"]
  },
  "Game Development": {
    focus: ["Game Design", "Game Programming", "3D Modeling", "Game AI"],
    tech: ["Unity + C#", "Unreal Engine + C++", "Godot + GDScript", "Pygame + Python"]
  },
  "IoT & Embedded Systems": {
    focus: ["Sensor Networks", "Embedded Programming", "Edge Computing", "Industrial IoT"],
    tech: ["Arduino + C", "Raspberry Pi + Python", "ESP32 + MicroPython", "RTOS + C++"]
  },
};

const DOMAINS = Object.keys(DOMAIN_OPTIONS);

const HOURS_OPTIONS = ["1-2 hours", "2-4 hours", "4-6 hours", "6+ hours (Full-time)"];
const DURATION_OPTIONS = ["1 Month (Crash Course)", "3 Months (Standard)", "6 Months (In-depth)", "12 Months (Mastery)"];
const PREP_TIME_OPTIONS = ["1 Week", "2 Weeks", "3 Weeks", "1 Month", "2 Months", "3 Months"];

// ── Full domain curricula for Default Roadmaps + AI prompt injection ──
const DOMAIN_CURRICULA = {
  "AI & Machine Learning": {
    basic: ["Python fundamentals (NumPy, Pandas, Matplotlib)", "Math for ML: Linear Algebra, Probability, Statistics", "Data preprocessing: cleaning, normalization, encoding", "Supervised Learning: Linear/Logistic Regression, Decision Trees", "Model evaluation: accuracy, precision, recall, F1", "scikit-learn workflow: fit, predict, pipeline"],
    intermediate: ["Ensemble methods: Random Forest, XGBoost, LightGBM", "Unsupervised: K-Means, DBSCAN, PCA, t-SNE", "Feature engineering and selection", "Neural Networks: perceptron, backpropagation", "Deep Learning: CNNs, RNNs, LSTMs (TensorFlow/PyTorch)", "Hyperparameter tuning: GridSearchCV, Optuna"],
    advanced: ["NLP: tokenization, embeddings, transformers, BERT, GPT", "Computer Vision: YOLO, image segmentation, transfer learning", "Reinforcement Learning: Q-Learning, PPO", "Generative AI: GANs, VAEs, Diffusion Models", "LLM fine-tuning: LoRA, PEFT, RAG pipelines", "MLOps: MLflow, DVC, Docker deployment", "Explainable AI: SHAP, LIME"],
    projects: ["House price predictor", "Sentiment analysis app", "Image classifier with CNN", "RAG-based document Q&A chatbot", "Real-time object detection system", "End-to-end MLOps pipeline"]
  },
  "Web Development": {
    basic: ["HTML5 semantics, forms, accessibility", "CSS3: Flexbox, Grid, animations, responsive design", "JavaScript: DOM, events, fetch API, ES6+", "Git, GitHub, branching strategies", "Basic command line usage"],
    intermediate: ["React.js: components, hooks, Router, Context API", "Backend: Node.js + Express or Spring Boot", "REST API: CRUD, status codes, Postman", "Databases: MySQL/PostgreSQL, MongoDB", "Authentication: JWT, OAuth2", "State management: Redux Toolkit", "CSS frameworks: Tailwind, Bootstrap"],
    advanced: ["Next.js: SSR, SSG, ISR, App Router", "TypeScript in React", "GraphQL: Apollo Client", "WebSockets: Socket.io real-time", "Microservices architecture", "Docker + Docker Compose", "CI/CD: GitHub Actions", "Cloud deployment: Vercel, AWS"],
    projects: ["Portfolio website", "Blog platform with auth", "E-commerce catalog", "Full-stack SaaS app with Stripe", "Real-time collaborative tool"]
  },
  "Cybersecurity": {
    basic: ["Networking: OSI model, TCP/IP, DNS, HTTP/S", "Linux command line, file permissions", "CIA triad, threat landscape, attack vectors", "Cryptography: symmetric/asymmetric, hashing, SSL/TLS", "OWASP Top 10 overview", "Kali Linux introduction"],
    intermediate: ["Nmap, Netcat, Wireshark packet analysis", "Vulnerability assessment: Nessus, OpenVAS", "Web attacks: SQL injection, XSS, CSRF", "Metasploit Framework exploitation", "Password attacks: Hashcat, John the Ripper", "Privilege escalation techniques", "CTF challenges: TryHackMe, HackTheBox"],
    advanced: ["Advanced pen testing methodology (PTES)", "Active Directory attacks: Kerberoasting, BloodHound", "Malware analysis: static/dynamic, sandboxing", "Reverse engineering: Ghidra basics", "Cloud security: AWS IAM misconfigs", "SOC: SIEM (Splunk, ELK), incident response", "Bug bounty methodology"],
    projects: ["Home lab with VMs", "Port scanner in Python", "DVWA exploitation", "Full pen test report", "Custom intrusion detection system"]
  },
  "Data Science & Analytics": {
    basic: ["Python: NumPy, Pandas, Matplotlib, Seaborn", "Data cleaning and wrangling", "Descriptive statistics, distributions", "Exploratory Data Analysis (EDA)", "SQL: SELECT, JOIN, GROUP BY, window functions", "Excel/Google Sheets analysis"],
    intermediate: ["Visualization: Plotly, Tableau, Power BI", "Statistical inference, hypothesis testing, A/B testing", "Feature engineering, correlation analysis", "Predictive modeling with scikit-learn", "Time series: ARIMA, seasonal decomposition", "Web scraping: BeautifulSoup, Scrapy"],
    advanced: ["Big Data: Apache Spark, Hadoop", "ETL pipelines: Airflow, dbt", "Data warehousing: Snowflake, BigQuery", "Advanced time series: Prophet, LSTM", "NLP analytics: topic modeling, sentiment", "Real-time analytics: Kafka, streaming"],
    projects: ["COVID-19 dashboard", "Customer churn prediction", "Stock price trend analysis", "End-to-end pipeline with Airflow + BigQuery", "Real-time analytics with Kafka + Spark"]
  },
  "Cloud Computing & DevOps": {
    basic: ["Cloud concepts: IaaS, PaaS, SaaS", "AWS/GCP/Azure: EC2, S3, VPC, IAM", "Linux admin: shell scripting, cron, services", "Networking: DNS, load balancers, firewalls", "Git and GitHub", "DevOps culture and practices"],
    intermediate: ["Docker: images, containers, Compose", "Kubernetes: pods, deployments, services, Helm", "CI/CD: GitHub Actions, Jenkins", "IaC: Terraform, CloudFormation", "Ansible configuration management", "Monitoring: Prometheus, Grafana, ELK", "Cloud databases: RDS, DynamoDB"],
    advanced: ["K8s advanced: autoscaling, RBAC, Istio", "Multi-cloud/hybrid strategies", "SRE: SLOs, error budgets", "DevSecOps: SAST, DAST, Vault", "Serverless: Lambda, API Gateway", "GitOps: ArgoCD, FluxCD", "Cost optimization, disaster recovery"],
    projects: ["Static site on S3 + CloudFront", "Containerized microservices on K8s", "Automated CI/CD pipeline", "Multi-region HA architecture", "Full GitOps pipeline with ArgoCD"]
  },
  "Mobile App Development": {
    basic: ["Native vs cross-platform overview", "Flutter/Dart OR React Native basics", "UI: spacing, typography, color theory", "State management basics", "Emulator and physical device setup", "Git for mobile projects"],
    intermediate: ["Flutter: Provider/Riverpod/Bloc OR RN: Redux", "REST API integration, JSON parsing", "Local storage: SharedPreferences/SQLite", "Firebase: Auth, Firestore, FCM", "Form validation, error handling", "Responsive layouts"],
    advanced: ["Native modules, platform bridges", "Advanced animations: Lottie, Hero", "Offline-first apps, sync strategies", "Performance optimization, profiling", "Push notifications: FCM, APNs", "In-app purchases", "App Store/Play Store publishing", "CI/CD: Fastlane, Codemagic"],
    projects: ["Weather app", "E-commerce app with Firebase", "Real-time chat app", "Social media app with media upload", "Published app on Play Store"]
  },
  "Game Development": {
    basic: ["Game loop, frame rate, delta time", "Unity/Godot basics: GameObjects, Scenes", "2D: sprites, tilemaps, collisions, physics", "C# for Unity OR GDScript", "Input handling: keyboard, mouse, touch", "Audio: sound effects, background music"],
    intermediate: ["3D: meshes, materials, lighting, cameras", "Animation: animator, blend trees", "Physics: rigidbodies, raycasting", "UI: health bars, menus, HUD", "Particle systems and VFX", "Pathfinding: NavMesh, A*", "Scriptable Objects"],
    advanced: ["Shader programming: HLSL, Shader Graph", "Multiplayer: Netcode, Mirror, Photon", "Procedural generation", "Game AI: FSM, behavior trees", "Performance: batching, LOD, profiling", "Mobile optimization, monetization", "Publishing on Steam/itch.io"],
    projects: ["Pong/Flappy Bird clone", "2D platformer with enemies", "Top-down RPG with inventory", "3D FPS with AI enemies", "Multiplayer online game"]
  },
  "IoT & Embedded Systems": {
    basic: ["Electronics: voltage, current, circuits", "Arduino: GPIO, digital/analog I/O", "Sensors: temperature, ultrasonic, LEDs, motors", "C/C++ for Arduino, MicroPython", "Breadboard prototyping", "Serial communication: UART"],
    intermediate: ["Raspberry Pi: Linux, GPIO, camera", "Protocols: I2C, SPI, UART, PWM", "Wireless: WiFi (ESP32), Bluetooth, Zigbee", "MQTT: broker, pub/sub", "IoT platforms: ThingSpeak, AWS IoT Core", "Dashboards: Grafana + InfluxDB", "Power management"],
    advanced: ["Edge AI: TF Lite on RPi, Jetson Nano", "RTOS: FreeRTOS, task scheduling", "Industrial: Modbus, CAN bus, OPC-UA", "LoRaWAN long-range IoT", "IoT security: auth, encryption, OTA", "Custom PCB: KiCad, Gerber files", "Digital twins, fleet management"],
    projects: ["Temp/humidity monitor with LCD", "Home automation with voice control", "Smart plant watering with MQTT", "Edge AI security camera", "Industrial sensor dashboard"]
  }
};

// ── JSON parser ──────────────────────────────────────────────
function extractJSON(str) {
  if (!str) return null;

  // 1. Try to find content within markdown code blocks first
  let cleaned = str.replace(/```(?:json)?\s*([\s\S]*?)\s*```/g, '$1').trim();
  try { return JSON.parse(cleaned); } catch (e) { }

  // 2. Try to find the first { and last } to isolate a potential JSON object
  const firstBrace = str.indexOf('{');
  const lastBrace = str.lastIndexOf('}');

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = str.substring(firstBrace, lastBrace + 1);
    try {
      // 2a. Direct parse
      return JSON.parse(candidate);
    } catch (e2) {
      // 2b. Attempt to fix common issues like control characters or trailing commas
      const sanitized = candidate
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // remove control characters
        .replace(/,(\s*[\]}])/g, '$1') // remove trailing commas
        .replace(/\\n/g, " ") // simplify newlines
        .trim();
      try {
        return JSON.parse(sanitized);
      } catch (e3) {
        console.error("JSON parse failure in extractJSON:", e3, sanitized);
      }
    }
  }

  // 3. Last ditch: check if 'str' itself is just valid JSON
  try { return JSON.parse(str); } catch (e) { }

  return null;
}

function toText(item) {
  if (typeof item === 'string') return item;
  if (item && typeof item === 'object') return item.title || item.topic || item.name || item.description || JSON.stringify(item);
  return String(item ?? '');
}

async function callAI(userMessage, systemPrompt, maxTokens = 3500) {
  try {
    const response = await axiosClient.post(`/api/ai/chat`, {
      message: userMessage,
      system: systemPrompt,
      max_tokens: maxTokens,
      feature: "career_roadmap"
    });
    if (response.data.error) {
      if (response.data.error.includes("rate_limit")) {
        throw new Error("AI service is busy (Rate Limit). Please wait a moment and try again.");
      }
      throw new Error(response.data.error);
    }
    const aiText = response.data.response || response.data.analysis || "";
    if (!aiText.trim()) throw new Error("AI returned empty response");

    console.log("AI Raw Text:", aiText);
    return aiText;
  } catch (error) {
    throw new Error(`Server error: ${error.response?.data?.message || error.message}`);
  }
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════
function CareerRoadmap() {
  const location = useLocation();
  const query = new URLSearchParams(location.search);
  const targetSubject = query.get("subject");

  // ── Top-level tab ──
  const [activeTab, setActiveTab] = useState("career"); // career | jd

  // ── Career tab state ──
  const [stage, setStage] = useState("loading"); // loading | questions | result
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState({});
  const [customInputs, setCustomInputs] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState("");
  const [roadmap, setRoadmap] = useState(null);
  const [roadmapId, setRoadmapId] = useState(null);
  const [checked, setChecked] = useState({});
  const [expanded, setExpanded] = useState({});

  // ── JD tab state ──
  const [jdText, setJdText] = useState("");
  const [jdPrepTime, setJdPrepTime] = useState("");
  const [jdHours, setJdHours] = useState("");
  const [jdLoading, setJdLoading] = useState(false);
  const [jdError, setJdError] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeFileName, setResumeFileName] = useState("");
  const [jdRoadmap, setJdRoadmap] = useState(null);
  const [jdRoadmapId, setJdRoadmapId] = useState(null);
  const [jdChecked, setJdChecked] = useState({});
  const [jdExpanded, setJdExpanded] = useState({});

  // ── Default Roadmap tab state ──
  const [defaultDomain, setDefaultDomain] = useState("");
  const [defaultExpanded, setDefaultExpanded] = useState({});

  // ── Saved tab state ──
  const [savedRoadmaps, setSavedRoadmaps] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);

  // ── Chat State ──
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs, isChatLoading]);

  // ── Build dynamic questions based on answers ──
  const getQuestions = () => {
    const primaryDomain = answers[0]?.[0] || null;
    const domainOpts = DOMAIN_OPTIONS[primaryDomain] || null;

    return [
      {
        id: 1,
        question: "What is your Primary Domain of interest?",
        hint: "Select one or type your own",
        options: [...DOMAINS, "Other (specify)"],
        allowCustom: true,
      },
      {
        id: 2,
        question: "Do you have a Secondary Domain focus?",
        hint: "Combine with your primary domain (optional)",
        options: ["None", ...DOMAINS.filter(d => d !== primaryDomain), "Other (specify)"],
        allowCustom: true,
      },
      {
        id: 3,
        question: "What is your specific Focus Area?",
        hint: `Specialization within ${primaryDomain || 'your domain'}`,
        options: [...(domainOpts?.focus || ["General"]), "Other (specify)"],
        allowCustom: true,
      },
      {
        id: 4,
        question: "What is your preferred Tech Stack or Language?",
        hint: "Primary technology you want to work with",
        options: [...(domainOpts?.tech || ["I'm not sure yet"]), "Other (specify)"],
        allowCustom: true,
      },
      {
        id: 5,
        question: "How much time can you dedicate daily?",
        hint: "Be realistic about your study schedule",
        options: HOURS_OPTIONS,
      },
      {
        id: 6,
        question: "What is the total duration for this roadmap?",
        hint: "Select your target timeline",
        options: DURATION_OPTIONS,
      },
    ];
  };

  const questions = getQuestions();

  // ── Fetch all saved roadmaps for the Saved tab ──
  const fetchSavedRoadmaps = async () => {
    setSavedLoading(true);
    try {
      const res = await axiosClient.get(`/api/roadmap/all`);
      setSavedRoadmaps(res.data || []);
    } catch (err) {
      console.error("Failed to load saved roadmaps", err);
    } finally {
      setSavedLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'saved') {
      fetchSavedRoadmaps();
    }
  }, [activeTab]);

  // ── Manual Save functionality ──
  const handleSave = async (isJd) => {
    const dataToSave = isJd ? jdRoadmap : roadmap;
    if (!dataToSave) return;
    try {
      const res = await axiosClient.post(`/api/roadmap`, {
        careerTitle: dataToSave.title || "Unknown",
        confidencePercent: 0,
        roadmapJson: JSON.stringify(dataToSave),
        skillsAnalysisJson: JSON.stringify(dataToSave.skillsAnalysis || {}),
        roadmapType: isJd ? "jd" : "career",
      });
      const savedData = res.data;
      if (savedData.id) {
        if (isJd) setJdRoadmapId(savedData.id);
        else setRoadmapId(savedData.id);
      }
    } catch (err) {
      console.error("Save failed:", err);
    }
  };

  // ── Load saved roadmap on mount ──
  useEffect(() => {
    const loadSaved = async () => {
      try {
        const res = await axiosClient.get(`/api/roadmap/latest`);
        const data = res.data;
        if (data.exists) {
          const parsed = (() => { try { return JSON.parse(data.roadmapJson); } catch { return null; } })();
          if (parsed) {
            const isJd = data.roadmapType === 'jd';
            const progress = (() => { try { return JSON.parse(data.progressJson || "{}"); } catch { return {}; } })();

            if (isJd) {
              setJdRoadmap(parsed);
              setJdRoadmapId(data.id);
              setJdChecked(progress);
              setActiveTab('jd');
              setStage("questions"); // Stay in questions for JD tab so the tab logic works
            } else {
              setRoadmap(parsed);
              setRoadmapId(data.id);
              setChecked(progress);
              setActiveTab('career');
              setStage("result");
            }
            return;
          }
        }
      } catch { /* no saved roadmap */ }
      setStage("questions");
    };
    loadSaved();
  }, []);

  // ── Option selection ──
  const toggleOption = (option) => {
    if (option === "Other (specify)") {
      setAnswers({ ...answers, [currentQ]: ["Other (specify)"] });
      return;
    }
    setAnswers({ ...answers, [currentQ]: [option] });
    // Clear custom input when selecting a non-custom option
    setCustomInputs({ ...customInputs, [currentQ]: "" });
  };

  const getAnswer = (qIdx) => {
    const sel = answers[qIdx]?.[0];
    if (sel === "Other (specify)" && customInputs[qIdx]?.trim()) return customInputs[qIdx].trim();
    return sel || '';
  };

  const isSelected = (option) => (answers[currentQ] || []).includes(option);
  const hasAnswer = () => {
    const sel = answers[currentQ]?.[0];
    if (!sel) return false;
    if (sel === "Other (specify)") return !!customInputs[currentQ]?.trim();
    return true;
  };

  const advanceQuestion = async () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(currentQ + 1);
    } else {
      await generateRoadmap();
    }
  };

  // ═══════════════════════════════════════════════════════════
  // GENERATE CAREER ROADMAP
  // ═══════════════════════════════════════════════════════════
  const generateRoadmap = async () => {
    setLoadingMsg("Building your personalized roadmap...");
    setLoading(true);
    setError("");
    try {
      const primaryDomain = getAnswer(0);
      const secondaryDomain = getAnswer(1);
      const focusArea = getAnswer(2);
      const techStack = getAnswer(3);
      const dailyHours = getAnswer(4);
      const duration = getAnswer(5);

      // Build domain curriculum context for the AI
      const curriculum = DOMAIN_CURRICULA[primaryDomain];
      const curriculumContext = curriculum
        ? `\nKnowledge base for "${primaryDomain}":\nBASIC: ${curriculum.basic.join('; ')}\nINTERMEDIATE: ${curriculum.intermediate.join('; ')}\nADVANCED: ${curriculum.advanced.join('; ')}\nPROJECTS: ${curriculum.projects.join('; ')}`
        : '';

      const systemPrompt = `You are a career roadmap expert. Output ONLY valid JSON, no markdown.
Rules:
- Basic topics → first 30% of duration. Intermediate → next 40%. Advanced → next 20%. Final 10% → capstone project.
- Each month = 4 weeks, each week = 3-5 concrete topics.
- ${secondaryDomain && secondaryDomain !== 'None' ? `70% from "${primaryDomain}", 30% from "${secondaryDomain}". Label each month domain.` : `100% "${primaryDomain}".`}
- Cover ALL core topics of "${techStack}" comprehensively. Nothing skipped.
- Include "projects" array with 3-5 project ideas (beginner to advanced).${curriculumContext}`;

      const userMessage = `Generate roadmap:
Domain: ${primaryDomain}, Secondary: ${secondaryDomain || 'None'}, Focus: ${focusArea}, Tech: ${techStack}, Hours/day: ${dailyHours}, Duration: ${duration}
${targetSubject ? `Target Subject: "${targetSubject}" — core of roadmap.` : ''}
JSON: {"title":"","summary":"","targetJob":null,"months":[{"month":1,"theme":"","domain":"Primary","weeks":[{"week":1,"topics":[{"title":"","done":false}]}],"milestone":""}],"projects":[""],"additionalTopics":[{"title":"","done":false}],"error":null}`;

      const raw = await callAI(userMessage, systemPrompt);
      const parsed = extractJSON(raw);
      if (parsed.error) throw new Error(parsed.error);
      setRoadmap(parsed);
      setRoadmapId(null); // Clear ID until user saves explicitly

      setStage("result");
    } catch (err) {
      setError(`Failed to generate roadmap. Please try again in a few seconds.`);
    } finally {
      setLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // GENERATE JD-BASED ROADMAP
  // ═══════════════════════════════════════════════════════════
  const generateJdRoadmap = async () => {
    if (!jdText.trim()) { setJdError("Please paste a Job Description."); return; }

    const hasResume = !!resumeText.trim() || !!resumeFile;
    if (!hasResume) {
      if (!jdPrepTime) { setJdError("Please select your prep time."); return; }
      if (!jdHours) { setJdError("Please select hours per day."); return; }
    }

    setJdLoading(true);
    setJdError("");
    setJdRoadmap(null);
    try {
      const systemPrompt = `You are a JD-focused Career Prep AI. 
Return ONLY a JSON object. No conversational text, no preamble, no markdown code blocks.
Parse the JD to extract required skills, tools, experience level, responsibilities.
${hasResume ? "COMPARE the JD with the provided RESUME to identify Skill Gaps. Extract EXACT skill names from the resume and map them faithfully to the JD requirements." : ""}

Rules:
- JSON must be perfectly formatted.
- Basic topics → first 30%. Intermediate → next 40%. Advanced → next 20%. Final 10% → capstone project.
- Each month = 4 weeks, each week = 3-5 concrete actionable topics.
- Prioritize skills ${hasResume ? "the user lacks or needs to improve based on EXACT resume matches" : "mentioned in the JD"}.
- Include mock interview prep, portfolio tips mapped to JD.
- Include "projects" array with 3-5 relevant project ideas.
${hasResume ? "" : "- Compress/expand based on prep time and daily hours."}
${hasResume ? '- Include "skillsAnalysis" object: {"have":["skill"],"improve":["skill"],"learn":["skill"]}' : ""}`;

      const jdTrimmed = jdText.length > 2000 ? jdText.slice(0, 2000) + '\n...(truncated)' : jdText;
      const resumeTrimmed = hasResume ? (resumeText.length > 2000 ? resumeText.slice(0, 2000) + '\n...(truncated)' : resumeText) : "";

      const userMessage = hasResume
        ? `Job Description:\n${jdTrimmed}\n\nUser Resume:\n${resumeTrimmed}\n\nJSON: {"title":"Prep for: [Job Title]","summary":"","targetJob":"[Job Title] at [Company]","months":[{"month":1,"theme":"Month theme","domain":"JD Prep","weeks":[{"week":1,"topics":[{"title":"","done":false}]}],"milestone":""}],"projects":[""],"additionalTopics":[{"title":"","done":false}],"skillsAnalysis":{"have":[],"improve":[],"learn":[]},"error":null}`
        : `Job Description:\n${jdTrimmed}\n\nPrep Time: ${jdPrepTime}\nHours/Day: ${jdHours}\n\nJSON: {"title":"Prep for: [Job Title]","summary":"","targetJob":"[Job Title] at [Company]","months":[{"month":1,"theme":"Month theme","domain":"JD Prep","weeks":[{"week":1,"topics":[{"title":"","done":false}]}],"milestone":""}],"projects":[""],"additionalTopics":[{"title":"","done":false}],"error":null}`;

      const raw = await callAI(userMessage, systemPrompt);
      const parsed = extractJSON(raw);
      if (!parsed) throw new Error("AI response could not be parsed. Please try again.");
      if (parsed.error) throw new Error(parsed.error);
      setJdRoadmap(parsed);
    } catch (err) {
      setJdError(`Failed: ${err.message}`);
    } finally {
      setJdLoading(false);
    }
  };

  // ── Progress tracking ──
  const handleCheck = async (key, isJd = false) => {
    if (isJd) {
      setJdChecked(prev => ({ ...prev, [key]: !prev[key] }));
    } else {
      const newChecked = { ...checked, [key]: !checked[key] };
      setChecked(newChecked);
      if (roadmapId) {
        try {
          await axiosClient.put(`/api/roadmap/${roadmapId}/progress`, { progressJson: JSON.stringify(newChecked) });
        } catch { /* silent */ }
      }
    }
  };

  const retake = async () => {
    try {
      await axiosClient.delete(`/api/roadmap`);
    } catch { /* silent */ }
    setStage("questions");
    setCurrentQ(0);
    setAnswers({});
    setCustomInputs({});
    setRoadmap(null);
    setRoadmapId(null);
    setError("");
    setChecked({});
    setExpanded({});
  };

  const toggleExpand = (id, isJd = false) => {
    if (isJd) setJdExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    else setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ── Chat ──
  const activeRoadmap = activeTab === 'jd' ? jdRoadmap : roadmap;

  const toggleChat = () => {
    if (!chatOpen && chatMsgs.length === 0) {
      setChatMsgs([{ role: "assistant", content: `Hi! I'm your AI Career Mentor. I see you're working on **${activeRoadmap?.title || 'your learning path'}**. Ask me anything!` }]);
    }
    setChatOpen(!chatOpen);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userText = chatInput.trim();
    const newMsgs = [...chatMsgs, { role: "user", content: userText }];
    setChatMsgs(newMsgs);
    setChatInput("");
    setIsChatLoading(true);
    try {
      const contextStr = activeRoadmap ? `Context: User is studying ${activeRoadmap.title}.` : "";
      const raw = await callAI(
        `${contextStr}\n\nUser Question: ${userText}`,
        "You are an expert, encouraging Career Mentor and CS Tutor. Explain technical concepts simply. Use markdown for code and bolding. Keep it concise."
      );
      setChatMsgs([...newMsgs, { role: "assistant", content: raw }]);
    } catch (err) {
      setChatMsgs([...newMsgs, { role: "assistant", content: `Error: ${err.message}` }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // SHARED: Roadmap Result Renderer
  // ═══════════════════════════════════════════════════════════


  // ═══════════════════════════════════════════════════════════
  // TAB BAR STYLING
  // ═══════════════════════════════════════════════════════════
  const tabBtn = (tab) =>
    `px-5 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase transition-all duration-200 border ${activeTab === tab
      ? 'bg-[var(--accent-glow)] border-[var(--accent-primary)] text-[var(--text-primary)] shadow-[0_0_10px_rgba(14,165,233,0.2)]'
      : 'bg-[var(--bg-surface)] border-[var(--border-glass)] text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:text-[var(--text-primary)]'
    }`;

  // ═══════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════

  // Loading state
  if (stage === "loading") {
    return (
      <div className="flex flex-col items-center justify-center h-72 space-y-4">
        <div className="animate-spin text-4xl text-[var(--accent-highlight)]">✦</div>
        <p className="text-[var(--accent-highlight)] font-bold tracking-wide">Loading your roadmap...</p>
      </div>
    );
  }

  // AI loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-72 space-y-4">
        <div className="animate-spin text-4xl text-[var(--accent-highlight)]">✦</div>
        <p className="text-[var(--accent-highlight)] font-bold tracking-wide">{loadingMsg}</p>
      </div>
    );
  }

  // Result view (career tab)
  if (stage === "result" && roadmap && activeTab === "career") {
    return (
      <div className="space-y-5 max-w-2xl mx-auto py-6 px-4">
        {/* Tab bar */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setActiveTab('career')} className={tabBtn('career')}>✦ Career Roadmap</button>
          <button onClick={() => setActiveTab('jd')} className={tabBtn('jd')}>🎯 JD-Based Roadmap</button>
          <button onClick={() => setActiveTab('default')} className={tabBtn('default')}>📚 Default Roadmaps</button>
          <button onClick={() => setActiveTab('saved')} className={tabBtn('saved')}>💾 Saved</button>
        </div>

        <RoadmapResult
          data={roadmap}
          checkedState={checked}
          expandedState={expanded}
          onCheck={handleCheck}
          onToggle={toggleExpand}
          onRetake={retake}
          isJd={false}
          onSave={handleSave}
          isSaved={!!roadmapId}
        />

        {/* Chat FAB */}
        <ChatWidget />
      </div>
    );
  }

  // ── Chat widget component (used in multiple places) ──
  function ChatWidget() {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {chatOpen && (
          <div className="mb-4 bg-[var(--bg-primary)] backdrop-blur-xl border border-[var(--border-glass)] shadow-[var(--card-shadow)] rounded-2xl w-80 sm:w-96 flex flex-col h-[500px] overflow-hidden">
            <div className="border-b border-[var(--border-glass)] bg-[var(--bg-surface)] p-4 flex justify-between items-center z-10">
              <div>
                <h3 className="font-black tracking-wide text-[var(--text-primary)] text-sm">Ask AI Mentor</h3>
                <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-widest font-bold opacity-80 mt-0.5">Clear your doubts instantly</p>
              </div>
              <button onClick={toggleChat} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] p-1.5 rounded-full transition-colors font-bold text-sm">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-transparent">
              {chatMsgs.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm leading-relaxed ${msg.role === "user" ? "bg-[var(--bg-surface-hover)] border border-[var(--border-glass)] text-[var(--text-primary)] rounded-br-none font-bold" : "bg-[var(--bg-secondary)] border border-[var(--border-glass)] text-[var(--text-secondary)] rounded-bl-none"}`}>
                    {msg.role === "assistant" ? (
                      <div dangerouslySetInnerHTML={{
                        __html: msg.content
                          .replace(/```(.*?)```/gs, '<pre class="bg-[var(--bg-primary)] border border-[var(--border-glass)] text-[var(--text-primary)] p-2 rounded-md my-2 text-xs overflow-x-auto">$1</pre>')
                          .replace(/`(.*?)`/g, '<code class="bg-[var(--bg-surface-hover)] border border-[var(--border-glass)] text-[var(--accent-highlight)] px-1 py-0.5 rounded text-xs">$1</code>')
                          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[var(--text-primary)]">$1</strong>')
                          .replace(/\n/g, '<br/>')
                      }} />
                    ) : msg.content}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="bg-[var(--bg-secondary)] border border-[var(--border-glass)] rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center space-x-1 w-16">
                    <div className="w-1.5 h-1.5 bg-[rgba(56,189,248,0.4)] rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-[rgba(56,189,248,0.7)] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    <div className="w-1.5 h-1.5 bg-[var(--accent-highlight)] rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
            <div className="p-3 bg-[var(--bg-secondary)] border-t border-[var(--border-glass)]">
              <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
                <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)} placeholder="Ask about any topic…" className="flex-1 text-sm bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-full px-4 py-2 text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-highlight)] placeholder-[rgba(147,197,253,0.5)] transition" disabled={isChatLoading} />
                <button type="submit" disabled={isChatLoading || !chatInput.trim()} className="bg-[var(--bg-surface-hover)] border border-[var(--border-hover)] hover:border-[var(--accent-highlight)] hover:bg-[var(--bg-surface-hover)] p-2 aspect-square rounded-full flex items-center justify-center text-[var(--accent-highlight)] hover:text-[var(--text-primary)] disabled:opacity-50 transition-all font-black text-xs">
                  ➤
                </button>
              </form>
            </div>
          </div>
        )}

        {!chatOpen && (
          <button onClick={toggleChat} className="bg-[var(--bg-surface)] backdrop-blur border border-[var(--accent-highlight)] hover:border-[var(--text-primary)] text-[var(--text-primary)] hover:shadow-[var(--card-shadow)] shadow-[var(--card-shadow)] hover:-translate-y-1 transition-all duration-300 rounded-full px-5 py-3.5 flex items-center gap-2 group">
            <span className="text-xl group-hover:scale-110 transition-transform">💬</span>
            <span className="font-bold text-sm tracking-wide">Ask AI Mentor</span>
          </button>
        )}
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // MAIN VIEW (Questions + JD Tab)
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="space-y-5 max-w-2xl mx-auto py-6 px-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Career Roadmap</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">AI-powered personalized career assessment</p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setActiveTab('career')} className={tabBtn('career')}>✦ Career Roadmap</button>
        <button onClick={() => setActiveTab('jd')} className={tabBtn('jd')}>🎯 JD-Based Roadmap</button>
        <button onClick={() => setActiveTab('default')} className={tabBtn('default')}>📚 Default Roadmaps</button>
        <button onClick={() => setActiveTab('saved')} className={tabBtn('saved')}>💾 Saved</button>
      </div>

      {/* ──────── CAREER TAB ──────── */}
      {activeTab === 'career' && stage === 'questions' && (
        <div className="space-y-5">
          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 bg-[var(--bg-surface-hover)] rounded-full overflow-hidden">
              <div className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(14,165,233,0.5)]"
                style={{ width: `${((currentQ + 1) / questions.length) * 100}%` }} />
            </div>
            <span className="text-[10px] text-[var(--accent-highlight)] uppercase tracking-widest font-bold">Q{currentQ + 1}/{questions.length}</span>
          </div>

          {/* Question card */}
          <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-6 shadow-sm">
            <p className="text-[10px] font-bold text-[var(--accent-highlight)] uppercase tracking-widest mb-2">Question {currentQ + 1}</p>
            <p className="text-lg font-bold text-[var(--text-primary)] mb-1">{questions[currentQ].question}</p>
            <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-secondary)] mb-5">{questions[currentQ].hint}</p>

            <div className="space-y-2">
              {questions[currentQ].options.map((option) => (
                <div key={option} onClick={() => toggleOption(option)}
                  className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-colors duration-150 ${isSelected(option) ? "bg-[var(--bg-surface-hover)] border-[var(--accent-highlight)]" : "bg-[var(--bg-surface)] border-[var(--border-glass)] hover:border-[var(--border-hover)]"}`}>
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${isSelected(option) ? "bg-[var(--accent-primary)] border-[var(--accent-primary)]" : "border-[var(--border-hover)] bg-[var(--bg-surface)]"}`}>
                    {isSelected(option) && <span className="text-white text-xs font-black">●</span>}
                  </div>
                  <span className={`text-sm font-bold tracking-wide ${isSelected(option) ? "text-[var(--text-primary)]" : "text-[var(--text-secondary)]"}`}>{option}</span>
                </div>
              ))}

              {/* Custom text input for "Other (specify)" */}
              {isSelected("Other (specify)") && (
                <input
                  type="text"
                  value={customInputs[currentQ] || ""}
                  onChange={(e) => setCustomInputs({ ...customInputs, [currentQ]: e.target.value })}
                  placeholder="Type your custom answer..."
                  className="w-full mt-2 bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:ring-2 focus:ring-[var(--accent-highlight)] transition-all"
                  autoFocus
                />
              )}
            </div>

            {error && (
              <div className="mt-4 bg-[rgba(248,113,113,0.05)] border border-[rgba(248,113,113,0.2)] rounded-xl px-4 py-3">
                <p className="text-[var(--color-error)] text-xs font-bold uppercase tracking-wide mb-1">Error</p>
                <p className="text-[var(--color-error)] text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Nav buttons */}
          <div className="flex justify-between">
            <button onClick={() => { if (currentQ > 0) setCurrentQ(currentQ - 1); }} disabled={currentQ === 0}
              className="px-5 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase border border-[var(--border-glass)] text-[var(--text-secondary)] disabled:opacity-30 hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)] transition-colors">← Back</button>
            <button onClick={advanceQuestion} disabled={!hasAnswer()}
              className="px-6 py-2.5 rounded-full text-xs font-black tracking-widest uppercase bg-[var(--accent-primary)] text-white shadow-[var(--card-shadow)] disabled:opacity-40 hover:shadow-[0_0_15px_rgba(14,165,233,0.5)] transition-all">
              {currentQ === questions.length - 1 ? 'Generate Roadmap ✨' : 'Next →'}
            </button>
          </div>
        </div>
      )}

      {/* ──────── JD TAB ──────── */}
      {activeTab === 'jd' && !jdRoadmap && (
        <div className="space-y-5">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <p className="font-bold text-[var(--text-primary)] tracking-wide mb-1">Create Career Suggestion According to the JD</p>
              <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-secondary)]">Paste a job description and get a tailored prep roadmap</p>
            </div>

            {/* JD textarea */}
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--accent-highlight)] mb-1.5 block">Job Description</label>
              <textarea rows={6} value={jdText} onChange={e => setJdText(e.target.value)}
                placeholder="Paste the full job description here..."
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:ring-2 focus:ring-[var(--accent-highlight)] transition-all resize-none" />
            </div>

            {/* Resume textarea */}
            <div>
              <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--accent-highlight)] mb-1.5 block">Your Resume / Skills (optional)</label>
              <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-secondary)] mb-2">Please Provide Your Skills for accurate gap analysis</p>
              <textarea rows={6} value={resumeText} onChange={e => setResumeText(e.target.value)}
                placeholder="Paste your resume or list your skills here..."
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:ring-2 focus:ring-[var(--accent-highlight)] transition-all resize-none" />
            </div>

            {/* Resume file upload */}
            <div className="mt-2">
              <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--accent-highlight)] mb-1.5 block">Upload Resume (optional)</label>
              <input type="file" accept=".txt,.pdf,.doc,.docx" onChange={e => {
                const file = e.target.files[0];
                setResumeFile(file);
                setResumeFileName(file ? file.name : '');
                if (file) {
                  if (file.type === "text/plain") {
                    const reader = new FileReader();
                    reader.onload = ev => setResumeText(ev.target.result);
                    reader.readAsText(file);
                  } else {
                    // For PDFs/DOCs, we can't easily extract text in-browser, 
                    // so we'll use a placeholder and notify the AI/User.
                    setResumeText(`[Resume File: ${file.name}]`);
                  }
                }
              }} className="w-full text-sm text-[var(--text-primary)] bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl px-2 py-1" />
              {resumeFileName && <p className="text-[10px] text-[var(--text-secondary)] mt-1">Selected file: {resumeFileName}</p>}
            </div>

            {/* Prep time - Hidden if Resume + JD present */}
            {(!jdText.trim() || (!resumeText.trim() && !resumeFile)) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--accent-highlight)] mb-1.5 block">Prep Time Available</label>
                  <select value={jdPrepTime} onChange={e => setJdPrepTime(e.target.value)}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-glass)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-highlight)] transition">
                    <option value="">Select...</option>
                    {PREP_TIME_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-[var(--accent-highlight)] mb-1.5 block">Hours Per Day</label>
                  <select value={jdHours} onChange={e => setJdHours(e.target.value)}
                    className="w-full bg-[var(--bg-secondary)] border border-[var(--border-glass)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-highlight)] transition">
                    <option value="">Select...</option>
                    {HOURS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            )}

            {jdError && (
              <div className="bg-[rgba(248,113,113,0.05)] border border-[rgba(248,113,113,0.2)] rounded-xl px-4 py-3">
                <p className="text-[var(--color-error)] text-sm">{jdError}</p>
              </div>
            )}

            <button onClick={generateJdRoadmap} disabled={jdLoading}
              className="w-full px-6 py-3 rounded-full text-xs font-black tracking-widest uppercase bg-[var(--accent-primary)] text-white shadow-[var(--card-shadow)] disabled:opacity-50 hover:shadow-[0_0_15px_rgba(14,165,233,0.5)] transition-all flex items-center justify-center gap-2">
              {jdLoading ? (
                <><span className="animate-spin">✦</span> Generating...</>
              ) : (
                <>🎯 Generate JD Roadmap</>
              )}
            </button>
          </div>
        </div>
      )}

      {/* JD Result */}
      {activeTab === 'jd' && jdRoadmap && (
        <div className="space-y-5">
          <RoadmapResult
            data={jdRoadmap}
            checkedState={jdChecked}
            expandedState={jdExpanded}
            onCheck={handleCheck}
            onToggle={toggleExpand}
            onRetake={() => { setJdRoadmap(null); setJdRoadmapId(null); setJdChecked({}); setJdExpanded({}); }}
            isJd={true}
            onSave={handleSave}
            isSaved={!!jdRoadmapId}
          />
        </div>
      )}

      {/* ──────── DEFAULT ROADMAPS TAB ──────── */}
      {activeTab === 'default' && (
        <div className="space-y-5">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <p className="font-bold text-[var(--text-primary)] tracking-wide mb-1">📚 Default Career Roadmaps</p>
              <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-secondary)]">Browse the full curriculum for any domain</p>
            </div>
            <select value={defaultDomain} onChange={e => { setDefaultDomain(e.target.value); setDefaultExpanded({}); }}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-glass)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent-highlight)] transition">
              <option value="">Select a domain...</option>
              {DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          {defaultDomain && DOMAIN_CURRICULA[defaultDomain] && (() => {
            const cur = DOMAIN_CURRICULA[defaultDomain];
            const sections = [
              { key: 'basic', label: '🌱 Basic', color: 'var(--color-success)', items: cur.basic },
              { key: 'intermediate', label: '🚀 Intermediate', color: 'var(--color-warning)', items: cur.intermediate },
              { key: 'advanced', label: '🔥 Advanced', color: 'var(--color-error)', items: cur.advanced },
              { key: 'projects', label: '🛠 Projects', color: 'var(--accent-highlight)', items: cur.projects },
            ];
            return (
              <div className="space-y-3">
                <h2 className="text-lg font-bold text-[var(--text-primary)] tracking-wide">{defaultDomain} Curriculum</h2>
                {sections.map(sec => (
                  <div key={sec.key} className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl shadow-sm overflow-hidden hover:border-[var(--border-hover)] transition-colors">
                    <div className="flex items-center justify-between px-5 py-4 cursor-pointer" onClick={() => setDefaultExpanded(prev => ({ ...prev, [sec.key]: !prev[sec.key] }))}>
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: sec.color, boxShadow: `0 0 8px ${sec.color}66` }} />
                        <p className="font-bold text-[var(--text-primary)] tracking-wide">{sec.label}</p>
                        <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-secondary)]">{sec.items.length} topics</span>
                      </div>
                      <span className="text-[var(--accent-highlight)] text-[10px]">{defaultExpanded[sec.key] ? '▲' : '▼'}</span>
                    </div>
                    {defaultExpanded[sec.key] && (
                      <div className="border-t border-[var(--border-glass)] px-5 pb-4 pt-3 space-y-2 bg-[var(--bg-surface)]">
                        {sec.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl border bg-[var(--bg-surface)] border-[var(--border-glass)]">
                            <span className="font-black text-xs" style={{ color: sec.color }}>{i + 1}.</span>
                            <span className="text-sm font-bold tracking-wide text-[var(--text-primary)]">{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* ──────── SAVED ROADMAPS TAB ──────── */}
      {activeTab === 'saved' && (
        <div className="space-y-5">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <p className="font-bold text-[var(--text-primary)] tracking-wide mb-1">💾 Saved Roadmaps</p>
              <p className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-secondary)]">View and manage your previously saved roadmaps</p>
            </div>

            {savedLoading ? (
              <div className="flex items-center gap-2 text-[var(--accent-highlight)] text-sm">
                <span className="animate-spin">✦</span> Loading saved roadmaps...
              </div>
            ) : savedRoadmaps.length === 0 ? (
              <div className="text-center py-10 bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl">
                <p className="text-[var(--text-secondary)] text-sm">No saved roadmaps found. Generate and save one to see it here.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {savedRoadmaps.map((r) => (
                  <div key={r.id} className="bg-[var(--bg-surface)] border border-[var(--border-glass)] p-4 rounded-2xl flex flex-col justify-between hover:border-[var(--border-hover)] transition-colors">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--accent-highlight)] bg-[var(--bg-surface-hover)] px-2 py-0.5 rounded-full">
                          {r.roadmapType === 'jd' ? 'JD Roadmap' : 'Career Roadmap'}
                        </span>
                        <span className="text-[10px] text-[var(--text-secondary)] opacity-70">
                          {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3">{r.careerTitle || "Untitled Roadmap"}</h3>
                    </div>
                    <div className="flex gap-2 mt-auto">
                      <button onClick={() => {
                        const parsed = (() => { try { return JSON.parse(r.roadmapJson); } catch { return null; } })();
                        const progress = (() => { try { return JSON.parse(r.progressJson || "{}"); } catch { return {}; } })();
                        if (r.roadmapType === 'jd') {
                          setJdRoadmap(parsed);
                          setJdRoadmapId(r.id);
                          setJdChecked(progress);
                          setActiveTab('jd');
                        } else {
                          setRoadmap(parsed);
                          setRoadmapId(r.id);
                          setChecked(progress);
                          setStage('result');
                          setActiveTab('career');
                        }
                      }} className="flex-1 px-3 py-1.5 rounded-full bg-[var(--accent-glow)] text-[var(--accent-primary)] border border-[var(--accent-primary)] text-[10px] font-black uppercase tracking-widest hover:bg-[var(--accent-primary)] hover:text-white transition-colors text-center">
                        View
                      </button>
                      <button onClick={async () => {
                        try {
                          await axiosClient.delete(`/api/roadmap/${r.id}`);
                          setSavedRoadmaps(savedRoadmaps.filter(sr => sr.id !== r.id));
                          if (roadmapId === r.id) { setRoadmap(null); setRoadmapId(null); setStage("questions"); }
                          if (jdRoadmapId === r.id) { setJdRoadmap(null); setJdRoadmapId(null); }
                        } catch (err) { }
                      }} className="px-3 py-1.5 rounded-full bg-[rgba(248,113,113,0.1)] border border-[rgba(248,113,113,0.3)] text-[var(--color-error)] text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--color-error)] hover:text-white transition-colors">
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat FAB — shown when any roadmap exists */}
      {(roadmap || jdRoadmap) && <ChatWidget />}
    </div>
  );
}

export default CareerRoadmap;