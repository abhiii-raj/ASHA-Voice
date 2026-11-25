import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity, ArrowLeft, ArrowUpRight, AudioLines, Baby, Check, ChevronDown, CircleHelp,
  Clock3, Cloud, CloudOff, Filter, HeartPulse, Languages, ListFilter, MapPin, Mic,
  MicOff, MoreHorizontal, Pencil, Plus, Search, ShieldAlert, Sparkles, Stethoscope,
  Trash2, Users, Volume2, Wifi, X,
} from "lucide-react";
import { deleteVisit, loadVisits, parseVisit, patients, saveRecording, saveVisit, seedVisits, workers } from "./data.js";

const translations = {
  en: {
    home: "Your visit notebook", subtitle: "One conversation at a time.", today: "TODAY'S VISITS",
    speak: "Start a visit", speakHint: "Tap and tell me what happened", recent: "Recent visits",
    allVisits: "See all visits", sample: "Prototype with sample data only", visits: "visits today",
    pending: "Pending sync", synced: "Synced", listening: "I’m listening…", stop: "Done speaking",
    review: "Review this visit", correct: "Does this look right?", yes: "Yes, save", change: "Change something",
    back: "Back", patient: "Patient", visitType: "Visit type", bp: "Blood pressure",
    weight: "Weight", temperature: "Temperature", symptoms: "Symptoms", followUp: "Follow-up",
    notes: "Notes", worker: "Worker", village: "Village", flag: "Review flag",
    dashboard: "Supervisor view", homeView: "Worker view", dashboardTitle: "Field overview",
    dashboardSub: "A live snapshot of today’s care.", totalVisits: "Visits today", followups: "Follow-ups due",
    flagged: "Needs review", fieldWorkers: "Active workers", all: "All visits", filter: "Filter visits",
    search: "Search patients or workers", anyWorker: "All workers", anyVillage: "All villages",
    anyFlag: "All flags", needsReview: "Needs review", clear: "Clear filters", ask: "Say a visit to begin",
    noVisits: "No visits match these filters.", demo: "Try the example", editTitle: "What should I change?",
    delete: "Delete", cancel: "Cancel", saveChanges: "Save changes", nameConfirm: "Did you mean",
    useName: "Yes, that’s right", useSpoken: "No, use what I said", lowConfidence: "A few words were hard to hear",
    noise: "Noisy audio", retry: "Try again", fallback: "Use the quick form", visitRecorded: "Visit saved",
    sayPrompt: "Boliye, visit ke baare mein batayein.", saved: "Record save ho gaya.",
    unclear: "Awaaz saaf nahi aayi, dobara boliye.", silence: "Kuch sunai nahi diya, mic dabakar boliye.",
    askBp: "BP kitna tha?", listeningShort: "Listening for your answer…", online: "Online", offline: "Offline",
    riskNote: "Please review this reading with a supervisor.", noAdvice: "This flag is for human review only — not a diagnosis.",
    samplePatient: "Sample patient", allCaught: "You’re all caught up",
  },
  hi: {
    home: "आपकी विज़िट डायरी", subtitle: "एक बार में एक बातचीत।", today: "आज की विज़िट",
    speak: "विज़िट शुरू करें", speakHint: "दबाकर बताइए, क्या हुआ", recent: "हाल की विज़िट",
    allVisits: "सभी विज़िट देखें", sample: "केवल नमूना डेटा वाला प्रोटोटाइप", visits: "विज़िट आज",
    pending: "सिंक बाकी", synced: "सिंक हो गया", listening: "सुन रही हूँ…", stop: "बोलना पूरा",
    review: "विज़िट जाँचें", correct: "क्या यह सही है?", yes: "हाँ, सेव करें", change: "कुछ बदलें",
    back: "वापस", patient: "मरीज़", visitType: "विज़िट का प्रकार", bp: "ब्लड प्रेशर",
    weight: "वज़न", temperature: "तापमान", symptoms: "लक्षण", followUp: "अगली जाँच",
    notes: "नोट्स", worker: "कार्यकर्ता", village: "गाँव", flag: "जाँच का संकेत",
    dashboard: "सुपरवाइज़र", homeView: "वर्कर होम", dashboardTitle: "आज की स्थिति",
    dashboardSub: "आज की देखभाल की लाइव झलक।", totalVisits: "आज की विज़िट", followups: "आगामी जाँच",
    flagged: "जाँच ज़रूरी", fieldWorkers: "सक्रिय वर्कर", all: "सभी विज़िट", filter: "विज़िट फ़िल्टर करें",
    search: "मरीज़ या वर्कर खोजें", anyWorker: "सभी वर्कर", anyVillage: "सभी गाँव",
    anyFlag: "सभी संकेत", needsReview: "जाँच ज़रूरी", clear: "फ़िल्टर हटाएँ", ask: "शुरू करने के लिए बोलें",
    noVisits: "इन फ़िल्टर में कोई विज़िट नहीं।", demo: "उदाहरण आज़माएँ", editTitle: "क्या बदलना है?",
    delete: "हटाएँ", cancel: "रद्द करें", saveChanges: "बदलाव सेव करें", nameConfirm: "क्या आपका मतलब था",
    useName: "हाँ, यह सही है", useSpoken: "नहीं, वही रखें जो मैंने कहा", lowConfidence: "कुछ शब्द साफ़ नहीं सुनाई दिए",
    noise: "आवाज़ में शोर", retry: "फिर से बोलें", fallback: "फ़ॉर्म भरें", visitRecorded: "विज़िट सेव हुई",
    sayPrompt: "बोलिए, विज़िट के बारे में बताइए।", saved: "रिकॉर्ड सेव हो गया।",
    unclear: "आवाज़ साफ़ नहीं आई, दोबारा बोलिए।", silence: "कुछ सुनाई नहीं दिया, माइक दबाकर बोलिए।",
    askBp: "BP कितना था?", listeningShort: "आपकी बात सुन रही हूँ…", online: "ऑनलाइन", offline: "ऑफ़लाइन",
    riskNote: "इस रीडिंग को सुपरवाइज़र के साथ जाँचें।", noAdvice: "यह संकेत केवल मानवीय जाँच के लिए है — निदान नहीं।",
    samplePatient: "नमूना मरीज़", allCaught: "अभी सभी विज़िट पूरी हैं",
  },
};

const visitKinds = ["pregnancy", "newborn", "immunization", "general"];
const exampleSpeech = "Sunita, 8 mahine ki pregnancy, BP 140/90, sir dard ki shikayat, agle hafte jaanch.";
const dateLabel = (value) => value ? new Date(`${value}T12:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—";

export default function App() {
  const [language, setLanguage] = useState("hi");
  const [mode, setMode] = useState("worker");
  const [screen, setScreen] = useState("home");
  const [visits, setVisits] = useState(seedVisits);
  const [draft, setDraft] = useState(null);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [noiseCount, setNoiseCount] = useState(0);
  const [noiseAlert, setNoiseAlert] = useState(false);
  const [nameMatch, setNameMatch] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [search, setSearch] = useState("");
  const [workerFilter, setWorkerFilter] = useState("");
  const [villageFilter, setVillageFilter] = useState("");
  const [flagFilter, setFlagFilter] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  const [toast, setToast] = useState("");
  const [implausibleValue, setImplausibleValue] = useState("");
  const recognitionRef = useRef(null);
  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const transcriptRef = useRef("");
  const processingRef = useRef(false);
  const recordingIdRef = useRef(null);
  const t = translations[language];

  useEffect(() => {
    loadVisits().then(setVisits);
    const channel = "BroadcastChannel" in window ? new BroadcastChannel("asha-voice-visits") : null;
    if (channel) {
      channel.onmessage = (event) => {
        if (event.data?.type === "visit-updated") loadVisits().then(setVisits);
      };
    }
    const updateOnline = () => setOnline(navigator.onLine);
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);
    return () => {
      channel?.close();
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
      clearTimeout(timerRef.current);
      stopTracks();
    };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timeout = setTimeout(() => setToast(""), 3200);
    return () => clearTimeout(timeout);
  }, [toast]);

  const todayVisits = useMemo(() => visits.filter((visit) => new Date(visit.createdAt).toDateString() === new Date().toDateString()), [visits]);
  const filteredVisits = useMemo(() => visits.filter((visit) => {
    const matchesText = !search || `${visit.patientName} ${visit.workerName} ${visit.village}`.toLowerCase().includes(search.toLowerCase());
    const matchesWorker = !workerFilter || visit.workerId === workerFilter;
    const matchesVillage = !villageFilter || visit.village === villageFilter;
    const matchesFlag = !flagFilter || (flagFilter === "flagged" ? Boolean(visit.riskFlag) : !visit.riskFlag);
    return matchesText && matchesWorker && matchesVillage && matchesFlag;
  }), [visits, search, workerFilter, villageFilter, flagFilter]);

  const speak = useCallback((message) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = language === "hi" ? "hi-IN" : "en-IN";
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }, [language]);

  const startRecording = async () => {
    setTranscript("");
    transcriptRef.current = "";
    processingRef.current = false;
    recordingIdRef.current = crypto.randomUUID();
    setNoiseAlert(false);
    setListening(true);
    speak(t.sayPrompt);
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        if ("MediaRecorder" in window) {
          const recorder = new MediaRecorder(stream);
          recorderRef.current = recorder;
          audioChunksRef.current = [];
          recorder.ondataavailable = (event) => { if (event.data.size) audioChunksRef.current.push(event.data); };
          recorder.onstop = () => {
            const audio = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
            saveRecording(recordingIdRef.current, audio).catch((error) => console.error("Could not save local audio recording", error));
          };
          recorder.start();
        }
      } catch (error) {
        setToast("Microphone permission is needed to record a visit.");
        console.error("Could not access microphone", error);
      }
    }
    if (!SpeechRecognition) {
      setListening(false);
      setNoiseAlert(true);
      setToast(language === "hi" ? "इस ब्राउज़र में बोलकर लिखना उपलब्ध नहीं है। उदाहरण आज़माएँ।" : "Speech recognition is unavailable here. Try the example instead.");
      setDraft(parseVisit(""));
      setScreen("review");
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === "hi" ? "hi-IN" : "en-IN";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognitionRef.current = recognition;
      recognition.onresult = (event) => {
        let current = "";
        let lowConfidence = false;
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          current += result[0].transcript;
          if (result.isFinal && result[0].confidence < 0.62) lowConfidence = true;
        }
        transcriptRef.current = current.trim();
        setTranscript(current.trim());
        setNoiseAlert(lowConfidence);
        clearTimeout(timerRef.current);
        if (current.trim()) timerRef.current = setTimeout(() => processTranscript(current.trim(), lowConfidence), 2000);
      };
      recognition.onerror = (event) => {
        if (event.error === "no-speech") {
          setToast(t.silence);
          speak(t.silence);
          return;
        }
        if (event.error !== "aborted") {
          setNoiseCount((count) => count + 1);
          setNoiseAlert(true);
          setToast(t.unclear);
          speak(t.unclear);
        }
      };
      recognition.onend = () => {
        if (transcriptRef.current.trim()) processTranscript(transcriptRef.current);
        else setListening(false);
      };
      recognition.start();
    } catch (error) {
      console.error("Speech recognition could not start", error);
      setListening(false);
      setNoiseAlert(true);
      setToast(t.unclear);
    }
  };

  const stopTracks = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const stopRecording = () => {
    clearTimeout(timerRef.current);
    try { recognitionRef.current?.stop(); } catch (error) { console.error("Could not stop speech recognition", error); }
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    stopTracks();
    const value = transcriptRef.current.trim();
    if (value) processTranscript(value, noiseAlert);
    else {
      setListening(false);
      setToast(t.silence);
      speak(t.silence);
    }
  };

  const processTranscript = (value, lowConfidence = false) => {
    if (processingRef.current) return;
    if (!value) {
      setListening(false);
      setToast(t.silence);
      speak(t.silence);
      return;
    }
    processingRef.current = true;
    setListening(false);
    setTranscript(value);
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    stopTracks();
    const parsed = parseVisit(value);
    if (lowConfidence) {
      const nextCount = noiseCount + 1;
      setNoiseCount(nextCount);
      setNoiseAlert(true);
      if (nextCount >= 2) {
        setDraft(parsed);
        setScreen("review");
        setEditModal(null);
        setToast(t.fallback);
        speak(t.unclear);
        return;
      }
      setToast(t.unclear);
      speak(t.unclear);
      return;
    }
    setNoiseCount(0);
    if (parsed.patientMatch) {
      setNameMatch(parsed);
      setScreen("record");
    } else {
      setDraft(parsed);
      setScreen("review");
      speak(readback(parsed));
    }
  };

  const beginExample = () => {
    transcriptRef.current = exampleSpeech;
    setTranscript(exampleSpeech);
    setNoiseAlert(false);
    const parsed = parseVisit(exampleSpeech);
    setDraft(parsed);
    setNameMatch(parsed);
    setScreen("record");
  };

  const acceptName = (accepted) => {
    const next = { ...nameMatch };
    if (accepted && next.patientMatch) {
      const patient = patients.find((item) => item.name === next.patientMatch);
      next.patientName = patient.name;
      next.patientId = patient.id;
      next.age = next.age ?? patient.age;
      next.village = patient.village;
    } else {
      next.patientId = null;
      next.patientName = nameMatch.transcript.split(/[,.،]/)[0].trim();
      next.village = workers[0].village;
    }
    setNameMatch(null);
    setDraft(next);
    setScreen("review");
    speak(readback(next));
  };

  const readback = (visit) => {
    const parts = [visit.patientName, visit.age ? `${visit.age} ${visit.type === "pregnancy" ? "mahine ki pregnancy" : "years"}` : visit.type];
    if (visit.vitals?.bp) parts.push(`BP ${visit.vitals.bp.replace("/", " by ")}`);
    if (visit.symptoms) parts.push(visit.symptoms);
    if (visit.followUpDate) parts.push(`Follow-up ${dateLabel(visit.followUpDate)}`);
    return `${parts.filter(Boolean).join(", ")}. Sahi hai?`;
  };

  const confirmVisit = async (acceptUnusual = false) => {
    if (!draft) return;
    const bpParts = draft.vitals?.bp?.match(/^(\d{2,3})\s*\/\s*(\d{2,3})$/);
    const temp = Number.parseFloat(draft.vitals?.temperature || "");
    if (!acceptUnusual && draft.vitals?.bp && (!bpParts || Number(bpParts[1]) > 300 || Number(bpParts[2]) > 200)) {
      const message = `${t.bp}: ${draft.vitals.bp}`;
      setImplausibleValue(message);
      speak(`${message}. Please confirm this value before saving.`);
      return;
    }
    if (!acceptUnusual && draft.vitals?.temperature && (!Number.isFinite(temp) || temp < 30 || temp > 45)) {
      const message = `${t.temperature}: ${draft.vitals.temperature}`;
      setImplausibleValue(message);
      speak(`${message}. Please confirm this value before saving.`);
      return;
    }
    const saved = { ...draft, confirmed: true, syncStatus: "pending" };
    const next = await saveVisit(saved);
    setVisits(next);
    if ("BroadcastChannel" in window) {
      const channel = new BroadcastChannel("asha-voice-visits");
      channel.postMessage({ type: "visit-updated" });
      channel.close();
    }
    setDraft(null);
    setScreen("home");
    setToast(t.visitRecorded);
    speak(t.saved);
  };

  const tryVoiceConfirmation = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { setToast(t.listeningShort); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = language === "hi" ? "hi-IN" : "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const heard = event.results[0][0].transcript.toLowerCase();
      if (/haan|हाँ|हां|yes|save|ठीक/.test(heard)) confirmVisit();
      else if (/badlo|बदलो|change|edit|नहीं/.test(heard)) setEditModal({ ...draft });
      else { setToast(t.unclear); speak(t.unclear); }
    };
    recognition.onerror = (event) => {
      if (event.error !== "aborted") setToast(t.unclear);
    };
    recognition.start();
    setToast(t.listeningShort);
  };

  const updateDraft = (key, value) => {
    setDraft((current) => key.startsWith("vitals.")
      ? { ...current, vitals: { ...current.vitals, [key.split(".")[1]]: value || null } }
      : { ...current, [key]: value || null });
  };

  const editSavedVisit = async (id, patch) => {
    const updated = visits.map((visit) => visit.id === id ? { ...visit, ...patch, vitals: { ...visit.vitals, ...patch.vitals } } : visit);
    setVisits(updated);
    await saveVisit(updated.find((visit) => visit.id === id));
    setEditModal(null);
    setToast(t.saved);
  };

  const removeVisit = async (visit) => {
    if (Date.now() - new Date(visit.createdAt).getTime() > 24 * 60 * 60 * 1000) {
      setToast(language === "hi" ? "यह रिकॉर्ड 24 घंटे से पुराना है।" : "This record is older than 24 hours.");
      return;
    }
    const next = await deleteVisit(visit.id);
    setVisits(next);
    setEditModal(null);
    setToast(language === "hi" ? "विज़िट हटा दी गई।" : "Visit deleted.");
  };

  const retryNoise = () => {
    setNoiseAlert(false);
    setNoiseCount((count) => count + 1);
    startRecording();
  };

  const quickVisit = () => {
    setDraft(parseVisit(""));
    setScreen("review");
  };

  return (
    <div className={`app-shell ${mode === "supervisor" ? "supervisor-shell" : ""}`}>
      <header className="topbar">
        <button className="brand-lockup" onClick={() => { setMode("worker"); setScreen("home"); }} aria-label="ASHA Voice home">
          <span className="brand-mark"><Activity size={21} strokeWidth={2.5} /></span>
          <span className="brand-name">asha<span>voice</span><small>SEHAT KI BAAT, AAWAAZ KE SAATH</small></span>
        </button>
        <div className="top-actions">
          <span className={`network-indicator ${online ? "is-online" : ""}`}><span />{online ? t.online : t.offline}</span>
          <button className="language-toggle" onClick={() => setLanguage(language === "hi" ? "en" : "hi")} aria-label="Change language">
            <Languages size={16} /> {language === "hi" ? "हिन्दी" : "English"} <ChevronDown size={14} />
          </button>
          <button className="mode-toggle" onClick={() => { setMode(mode === "worker" ? "supervisor" : "worker"); setScreen("home"); }}>
            {mode === "worker" ? <><Users size={16} /> {t.dashboard}</> : <><Mic size={16} /> {t.homeView}</>}
          </button>
        </div>
      </header>

      <div className="prototype-ribbon"><Sparkles size={13} /> {t.sample}</div>

      {mode === "worker" && screen === "home" && (
        <main className="worker-home">
          <section className="welcome-row">
            <div>
              <p className="eyebrow">{new Intl.DateTimeFormat(language === "hi" ? "hi-IN" : "en-IN", { weekday: "long", day: "numeric", month: "long" }).format(new Date())}</p>
              <h1>{t.home}<span className="title-dot">.</span></h1>
              <p className="welcome-copy">{t.subtitle}</p>
            </div>
            <div className="worker-chip"><span className="avatar">म</span><span><b>Meera Kumari</b><small>ASHA worker · Rampur</small></span><ChevronDown size={15} /></div>
          </section>

          <section className="voice-card" aria-label="Start a voice visit">
            <div className="voice-card-copy">
              <div className="voice-orbit"><span className="orbit-dot" /><AudioLines size={17} /></div>
              <div><p className="eyebrow">{t.ask}</p><h2>{t.speak}</h2><p>{t.speakHint}</p></div>
            </div>
            <button className="mic-button" onClick={startRecording} aria-label={t.speak} data-testid="start-recording">
              <Mic size={31} strokeWidth={2.4} /><span className="mic-halo" />
            </button>
            <button className="example-link" onClick={beginExample}><Sparkles size={14} /> {t.demo}</button>
          </section>

          <section className="stats-strip">
            <div className="stat-icon"><HeartPulse size={19} /></div>
            <div className="stat-main"><strong>{todayVisits.length.toString().padStart(2, "0")}</strong><span>{t.visits}</span></div>
            <div className="stat-divider" />
            <div className="stat-sync"><span className="sync-dot" />{visits.filter((visit) => visit.syncStatus === "pending").length} {t.pending}</div>
            <ArrowUpRight size={17} className="stat-arrow" />
          </section>

          <section className="visits-section">
            <div className="section-heading"><div><p className="eyebrow">{t.today}</p><h2>{t.recent}</h2></div><button className="text-button" onClick={() => setMode("supervisor")}>{t.allVisits}<ArrowUpRight size={15} /></button></div>
            <VisitList visits={todayVisits.slice(0, 4)} language={language} t={t} onEdit={setEditModal} onDelete={removeVisit} />
          </section>
          <footer className="worker-footer"><ShieldAlert size={14} /> No diagnosis or treatment advice · Your records stay on this device when offline.</footer>
        </main>
      )}

      {mode === "worker" && screen === "record" && (
        <main className="record-screen">
          <button className="back-button" onClick={() => { stopRecording(); setScreen("home"); }}><ArrowLeft size={17} /> {t.back}</button>
          <div className="record-stage">
            <div className={`live-badge ${listening ? "live" : ""}`}><span /> {listening ? t.listening : t.lowConfidence}</div>
            <div className="waveform" aria-hidden="true">{Array.from({ length: 35 }, (_, i) => <span key={i} style={{ "--bar": `${12 + ((i * 19) % 35)}px`, "--delay": `${(i % 7) * 0.08}s` }} />)}</div>
            <h1>{listening ? t.listening : t.lowConfidence}</h1>
            <p className="record-instruction">{t.sayPrompt}</p>
            {transcript && <div className="transcript-card"><span className="transcript-label"><AudioLines size={14} /> TRANSCRIPT</span><p className={noiseAlert ? "low-confidence" : ""}>{transcript}</p></div>}
            {noiseAlert && <p className="noise-note"><Activity size={15} /> {t.noise}</p>}
            <div className="record-controls">
              <button className="stop-button" onClick={() => listening ? stopRecording() : retryNoise()}>{listening ? <><span className="stop-square" /> {t.stop}</> : <><Mic size={17} /> {t.retry}</>}</button>
              <button className="icon-button" onClick={() => quickVisit()} aria-label={t.fallback}><Pencil size={18} /></button>
            </div>
          </div>
          {nameMatch && <div className="modal-backdrop"><div className="confirm-modal name-modal">
            <button className="modal-close" onClick={() => setNameMatch(null)} aria-label="Close"><X size={18} /></button>
            <div className="modal-icon"><Users size={22} /></div><p className="eyebrow">{t.nameConfirm}</p>
            <h2>{nameMatch.patientMatch}?</h2><p className="modal-copy">We matched the name to a patient in your list. Confirm before saving.</p>
            <button className="primary-button wide" onClick={() => acceptName(true)}><Check size={18} /> {t.useName}</button>
            <button className="secondary-button wide" onClick={() => acceptName(false)}>{t.useSpoken}</button>
          </div></div>}
        </main>
      )}

      {mode === "worker" && screen === "review" && draft && (
        <main className="review-screen">
          <button className="back-button" onClick={() => { setScreen("home"); setDraft(null); }}><ArrowLeft size={17} /> {t.back}</button>
          <div className="review-layout">
            <section className="review-main">
              <div className="review-heading"><div><p className="eyebrow">VISIT NOTE · JUST NOW</p><h1>{t.review}<span className="title-dot">.</span></h1></div><button className="audio-readback" onClick={() => speak(readback(draft))}><Volume2 size={17} /> Read aloud</button></div>
              <p className="review-subtitle">{t.correct}</p>
              {draft.riskFlag && <div className="risk-alert"><ShieldAlert size={19} /><div><strong>{t.needsReview}</strong><span>{t.riskNote} {t.noAdvice}</span></div></div>}
              <div className="visit-form">
                <Field label={t.patient} value={draft.patientName || ""} onChange={(v) => updateDraft("patientName", v)} />
                <div className="form-grid">
                  <label className="form-field"><span>{t.visitType}</span><select value={draft.type || ""} onChange={(e) => updateDraft("type", e.target.value)}><option value="">—</option>{visitKinds.map((kind) => <option value={kind} key={kind}>{kind}</option>)}</select></label>
                  <Field label={language === "hi" ? "उम्र / महीने" : "Age / months"} value={draft.age ?? ""} onChange={(v) => updateDraft("age", v ? Number(v) : null)} type="number" />
                </div>
                <div className="form-grid">
                  <Field label={t.bp} value={draft.vitals?.bp || ""} onChange={(v) => updateDraft("vitals.bp", v)} placeholder="— / —" />
                  <Field label={t.weight} value={draft.vitals?.weight || ""} onChange={(v) => updateDraft("vitals.weight", v)} placeholder="kg" />
                </div>
                <div className="form-grid">
                  <Field label={t.temperature} value={draft.vitals?.temperature || ""} onChange={(v) => updateDraft("vitals.temperature", v)} placeholder="°C" />
                  <Field label={t.followUp} value={draft.followUpDate || ""} onChange={(v) => updateDraft("followUpDate", v)} type="date" />
                </div>
                <Field label={t.symptoms} value={draft.symptoms || ""} onChange={(v) => updateDraft("symptoms", v)} />
                <label className="form-field"><span>{t.notes}</span><textarea rows="2" value={draft.notes || ""} onChange={(e) => updateDraft("notes", e.target.value)} placeholder="—" /></label>
              </div>
              {draft.transcript && <div className="source-transcript"><AudioLines size={14} /> “{draft.transcript}”</div>}
              {implausibleValue && <div className="risk-alert value-alert"><ShieldAlert size={19} /><div><strong>{implausibleValue}</strong><span>Does this value match what you heard? Review or confirm it before saving.</span><button onClick={() => { setImplausibleValue(""); confirmVisit(); }}>Confirm this value</button></div></div>}
            </section>
            <aside className="review-aside">
              <div className="readback-card"><div className="readback-icon"><Volume2 size={18} /></div><p className="eyebrow">READ BACK</p><p>{readback(draft)}</p><span>Check the details before saving.</span></div>
              <button className="confirm-button" onClick={confirmVisit}><Check size={19} /> {t.yes}</button>
              <button className="change-button" onClick={() => setEditModal({ ...draft, editingDraft: true })}><Pencil size={17} /> {t.change}</button>
              <button className="voice-confirm" onClick={tryVoiceConfirmation}><Mic size={15} /> Say “Haan” to save by voice</button>
            </aside>
          </div>
        </main>
      )}

      {mode === "supervisor" && (
        <main className="dashboard">
          <div className="dashboard-heading">
            <div><p className="eyebrow">RAMPUR BLOCK · LIVE FIELD DATA</p><h1>{t.dashboardTitle}<span className="title-dot">.</span></h1><p>{t.dashboardSub}</p></div>
            <div className="live-status"><span className="live-pulse" /> LIVE <span className="live-divider" /> <Clock3 size={14} /> {new Date().toLocaleTimeString(language === "hi" ? "hi-IN" : "en-IN", { hour: "2-digit", minute: "2-digit" })}</div>
          </div>
          <div className="dashboard-stats">
            <Metric icon={<HeartPulse size={20} />} label={t.totalVisits} value={todayVisits.length} hint="Across all villages" tone="green" />
            <Metric icon={<Clock3 size={20} />} label={t.followups} value={visits.filter((visit) => visit.followUpDate && visit.followUpDate <= new Date().toISOString().slice(0, 10)).length} hint="Require attention today" tone="amber" />
            <Metric icon={<ShieldAlert size={20} />} label={t.flagged} value={visits.filter((visit) => visit.riskFlag).length} hint="Human review only" tone="coral" />
            <Metric icon={<Users size={20} />} label={t.fieldWorkers} value={workers.length} hint="Across 3 villages" tone="blue" />
          </div>
          <section className="dashboard-table-card">
            <div className="table-heading"><div><p className="eyebrow">FIELD ACTIVITY</p><h2>{t.all}</h2></div><div className="live-update"><span className="live-pulse" /> Updates live</div></div>
            <div className="filters-row">
              <label className="search-input"><Search size={16} /><input placeholder={t.search} value={search} onChange={(e) => setSearch(e.target.value)} /></label>
              <label className="select-filter"><Users size={14} /><select aria-label={t.worker} value={workerFilter} onChange={(e) => setWorkerFilter(e.target.value)}><option value="">{t.anyWorker}</option>{workers.map((worker) => <option value={worker.id} key={worker.id}>{worker.name}</option>)}</select><ChevronDown size={13} /></label>
              <label className="select-filter"><MapPin size={14} /><select aria-label={t.village} value={villageFilter} onChange={(e) => setVillageFilter(e.target.value)}><option value="">{t.anyVillage}</option>{[...new Set(workers.map((worker) => worker.village))].map((village) => <option key={village}>{village}</option>)}</select><ChevronDown size={13} /></label>
              <label className="select-filter"><ListFilter size={14} /><select aria-label={t.flag} value={flagFilter} onChange={(e) => setFlagFilter(e.target.value)}><option value="">{t.anyFlag}</option><option value="flagged">{t.needsReview}</option><option value="clear">No flag</option></select><ChevronDown size={13} /></label>
            </div>
            <div className="table-wrap">
              <table><thead><tr><th>PATIENT / VISIT</th><th>{t.worker}</th><th>{t.village.toUpperCase()}</th><th>VITALS</th><th>{t.followUp.toUpperCase()}</th><th>{t.flag.toUpperCase()}</th><th>SYNC</th></tr></thead>
                <tbody>{filteredVisits.slice(0, 12).map((visit) => <tr key={visit.id}>
                  <td><div className="patient-cell"><span className={`kind-icon kind-${visit.type}`}><VisitIcon type={visit.type} /></span><span><b>{visit.patientName || t.samplePatient}</b><small>{visit.type} · {visit.age ? `${visit.age} mo` : "age not noted"}</small></span></div></td>
                  <td>{visit.workerName}</td><td><span className="village-cell"><MapPin size={12} /> {visit.village}</span></td>
                  <td>{visit.vitals?.bp ? <span className="vital-value">{visit.vitals.bp} <small>BP</small></span> : <span className="muted-cell">—</span>}</td>
                  <td>{dateLabel(visit.followUpDate)}</td>
                  <td>{visit.riskFlag ? <span className="flag-pill"><ShieldAlert size={12} /> Review</span> : <span className="clear-pill">Clear</span>}</td>
                  <td><span className={`table-sync ${visit.syncStatus}`}><span />{visit.syncStatus === "pending" ? t.pending : t.synced}</span></td>
                </tr>)}</tbody>
              </table>
              {!filteredVisits.length && <div className="empty-table"><Filter size={18} /> {t.noVisits}</div>}
            </div>
            <div className="table-foot"><span>Showing {Math.min(12, filteredVisits.length)} of {filteredVisits.length} visits</span><span><Wifi size={13} /> Updated just now</span></div>
          </section>
          <p className="dashboard-note"><ShieldAlert size={14} /> Flags indicate records for human review only. They are not medical diagnoses or treatment recommendations.</p>
        </main>
      )}

      {editModal && !editModal.quick && !editModal.editingDraft && (
        <VisitEditModal visit={editModal} t={t} onClose={() => setEditModal(null)} onSave={(patch) => editSavedVisit(editModal.id, patch)} onDelete={() => removeVisit(editModal)} />
      )}
      {editModal?.editingDraft && (
        <div className="modal-backdrop"><div className="confirm-modal edit-draft-modal">
          <button className="modal-close" onClick={() => setEditModal(null)} aria-label="Close"><X size={18} /></button><div className="modal-icon"><Pencil size={21} /></div><p className="eyebrow">{t.editTitle}</p>
          <p className="modal-copy">You can edit any field in the visit form. Changes apply only to the selected field.</p>
          <button className="primary-button wide" onClick={() => setEditModal(null)}>Continue editing</button>
        </div></div>
      )}
      {implausibleValue && <div className="modal-backdrop"><div className="confirm-modal">
        <button className="modal-close" onClick={() => setImplausibleValue("")} aria-label="Close"><X size={18} /></button><div className="modal-icon"><CircleHelp size={22} /></div>
        <p className="eyebrow">PLEASE CHECK</p><h2>{implausibleValue}</h2><p className="modal-copy">This value looks unusual. Read it back and confirm it before saving, or change the field.</p>
        <button className="primary-button wide" onClick={() => { setImplausibleValue(""); confirmVisit(true); }}>Confirm value</button>
        <button className="secondary-button wide" onClick={() => { setImplausibleValue(""); speak(t.review); }}>Change value</button>
      </div></div>}
      {toast && <div className="toast-message" role="status"><span className="toast-check"><Check size={15} /></span>{toast}</div>}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "—" }) {
  return <label className="form-field"><span>{label}</span><input type={type} value={value ?? ""} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} /></label>;
}

function VisitIcon({ type }) {
  if (type === "pregnancy") return <HeartPulse size={16} />;
  if (type === "newborn") return <Baby size={16} />;
  if (type === "immunization") return <Plus size={16} />;
  return <Stethoscope size={16} />;
}

function VisitList({ visits, language, t, onEdit }) {
  return <div className="visit-list">{visits.map((visit) => <div className="visit-row" key={visit.id}>
    <span className={`kind-icon kind-${visit.type}`}><VisitIcon type={visit.type} /></span>
    <span className="visit-person"><b>{visit.patientName}</b><small>{visit.type} · {visit.vitals?.bp ? `BP ${visit.vitals.bp}` : visit.symptoms || "Visit recorded"}</small></span>
    {visit.riskFlag && <span className="mini-flag"><ShieldAlert size={12} /></span>}
    <span className={`sync-badge ${visit.syncStatus}`}><span />{visit.syncStatus === "pending" ? t.pending : t.synced}</span>
    <span className="visit-time">{new Date(visit.createdAt).toLocaleTimeString(language === "hi" ? "hi-IN" : "en-IN", { hour: "2-digit", minute: "2-digit" })}</span>
    <button className="row-more" aria-label="Edit or delete visit" onClick={() => onEdit(visit)}><MoreHorizontal size={19} /></button>
  </div>)}
  {!visits.length && <div className="empty-state"><span className="empty-icon"><Volume2 size={22} /></span><b>{t.allCaught}</b><span>{t.speakHint}</span></div>}
  </div>;
}

function Metric({ icon, label, value, hint, tone }) {
  return <div className={`metric-card tone-${tone}`}><div className="metric-top"><span className="metric-icon">{icon}</span><span className="metric-trend"><ArrowUpRight size={14} /></span></div><div className="metric-value">{String(value).padStart(2, "0")}</div><div className="metric-label">{label}</div><div className="metric-hint">{hint}</div></div>;
}

function VisitEditModal({ visit, t, onClose, onSave, onDelete }) {
  const [fields, setFields] = useState({ symptoms: visit.symptoms || "", followUpDate: visit.followUpDate || "", bp: visit.vitals?.bp || "", weight: visit.vitals?.weight || "" });
  return <div className="modal-backdrop"><div className="confirm-modal edit-modal">
    <button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button><div className="modal-icon"><Pencil size={21} /></div>
    <p className="eyebrow">{visit.patientName}</p><h2>{t.editTitle}</h2>
    <div className="edit-fields">
      <Field label={t.bp} value={fields.bp} onChange={(v) => setFields({ ...fields, bp: v })} />
      <Field label={t.weight} value={fields.weight} onChange={(v) => setFields({ ...fields, weight: v })} />
      <Field label={t.symptoms} value={fields.symptoms} onChange={(v) => setFields({ ...fields, symptoms: v })} />
      <Field label={t.followUp} value={fields.followUpDate} onChange={(v) => setFields({ ...fields, followUpDate: v })} type="date" />
    </div>
    <button className="primary-button wide" onClick={() => onSave({ symptoms: fields.symptoms, followUpDate: fields.followUpDate, vitals: { bp: fields.bp, weight: fields.weight } })}>{t.saveChanges}</button>
    <button className="delete-button" onClick={onDelete}><Trash2 size={15} /> {t.delete}</button>
  </div></div>;
}
