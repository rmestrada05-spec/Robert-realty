

import { useState, useRef } from "react";

const RED = "#c0392b";
const BLACK = "#0a0a0a";
const OFF_WHITE = "#f7f6f4";
const GRAY = "#888";
const BORDER = "#d8d8d8";
const LIGHT_GRAY = "#e8e8e8";
const GREEN = "#2e7d32";

const SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbx0ydpC9WHAL9So3pVHta0gjcH_CL-eu9yeCD7OAvaGOcl1kFBboBVytoGqzKZW8pvuZQ/exec";

function logLeadToSheet(data) {
  try {
    const params = new URLSearchParams({
      name: data.name || "",
      location: data.location || "",
      homeStatus: data.homeStatus || "",
      income: data.incomePrivate ? "private" : (data.income || ""),
      timeline: data.timeline || "",
      beds: data.beds || "",
      homeStyle: data.homeStyle || "",
      tnLocation: data.tnLocation || "",
      contactType: data.contactType || "",
      contact: data.contact || "",
    });
    new Image().src = `${SHEET_WEBHOOK_URL}?${params.toString()}`;
  } catch (err) {
    console.error("Lead logging failed:", err);
  }
}

function formatCurrency(n) { return "$" + Math.round(n).toLocaleString(); }
function calcTNBuyingPower(income) { return (income / 12) * 0.78 * 0.28 * 200; }
function calcOriginBuyingPower(income) { return (income / 12) * 0.68 * 0.28 * 200; }
function getSavingsTarget(income) {
  const target = 40000;
  const monthlySavings = (income / 12) * 0.15;
  return { target, monthlySavings, months: Math.ceil(target / monthlySavings) };
}

function isQuestion(val) {
  const v = val.trim().toLowerCase();
  if (v.endsWith("?")) return true;
  const starters = ["why ", "how ", "what ", "when ", "who ", "is ", "are ", "do ", "did ", "can ", "will ", "does ", "tell me", "explain"];
  return starters.some(s => v.startsWith(s));
}

function cleanLocation(raw) {
  if (!raw) return "";
  let loc = raw.trim();
  const fillers = [
    /^i'?m\s+from\s+/i, /^from\s+/i, /^the\s+great\s+town\s+of\s+/i,
    /^the\s+town\s+of\s+/i, /^the\s+city\s+of\s+/i, /^and\s+i'?m\s+from\s+/i,
    /^and\s+from\s+/i, /^living\s+in\s+/i, /^based\s+in\s+/i, /^out\s+of\s+/i,
  ];
  for (const f of fillers) loc = loc.replace(f, "");
  loc = loc.trim().replace(/[.!?]+$/, "");
  loc = loc.split(/\s+/).map(w => {
    const cleaned = w.replace(/(.)\1{2,}$/i, "$1");
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
  }).join(" ");
  return loc;
}

function parseNameLocation(val) {
  const fromMatch = val.match(/^(.+?)\s+(?:and\s+)?(?:i'?m\s+)?from\s+(.+)$/i);
  const commaMatch = val.match(/^([^,]+),\s*(.+)$/);
  if (fromMatch) {
    let namePart = fromMatch[1].trim();
    const nameWords = namePart.split(/\s+/);
    const name = nameWords[0];
    return { name: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(), location: cleanLocation(fromMatch[2]) };
  }
  if (commaMatch) return { name: commaMatch[1].trim(), location: cleanLocation(commaMatch[2]) };
  const words = val.trim().split(/\s+/);
  if (words.length === 1) return { name: words[0], location: "" };
  const firstName = words[0];
  if (/^[A-Za-z]+$/.test(firstName)) return { name: firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase(), location: cleanLocation(words.slice(1).join(" ")) };
  return { name: val.trim(), location: "" };
}

const MEDIAN_HOME_PRICES = {
  nashville: 450000,
  franklin: 650000,
  lebanon: 320000,
  knoxville: 310000,
  memphis: 220000,
};

const LOCATION_LABELS = {
  nashville: "Nashville",
  franklin: "Franklin",
  lebanon: "Lebanon",
  knoxville: "Knoxville",
  memphis: "Memphis",
};

function getMedianHome(tnLocation) {
  if (MEDIAN_HOME_PRICES[tnLocation]) {
    return { price: MEDIAN_HOME_PRICES[tnLocation], label: LOCATION_LABELS[tnLocation] };
  }
  return { price: 320000, label: tnLocation || "Tennessee" };
}

function BotBubble({ text }) {
  return (
    <div style={{ display: "flex", marginBottom: 4 }}>
      <div style={{ maxWidth: "85%", padding: "13px 17px", fontSize: 14.5, lineHeight: 1.65, background: OFF_WHITE, border: `1px solid ${BORDER}`, borderRadius: "0 12px 12px 12px", fontFamily: "Georgia, serif" }}>
        {text}
      </div>
    </div>
  );
}

function ContactBubble() {
  return (
    <div style={{ display: "flex", marginBottom: 4 }}>
      <div style={{ padding: "14px 18px", background: "#fff", border: `1px solid ${RED}`, borderRadius: "0 12px 12px 12px", fontSize: 13.5, lineHeight: 1.8 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: GRAY, marginBottom: 8 }}>Reach Robert directly</div>
        <div style={{ fontWeight: 500, color: BLACK }}>📞 661-713-9667</div>
        <div style={{ fontWeight: 500, color: BLACK }}>✉️ robertmichael@tnhomesteadgroup.com</div>
      </div>
    </div>
  );
}

function UserBubble({ text }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
      <div style={{ maxWidth: "85%", padding: "13px 17px", fontSize: 14, lineHeight: 1.65, background: BLACK, color: "#fff", borderRadius: "12px 0 12px 12px" }}>
        {text}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", marginBottom: 4 }}>
      <div style={{ padding: "13px 17px", background: OFF_WHITE, border: `1px solid ${BORDER}`, borderRadius: "0 12px 12px 12px", display: "flex", gap: 5, alignItems: "center" }}>
        {[0, 0.2, 0.4].map((d, i) => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: GRAY, animation: `bounce 1.2s ${d}s infinite` }} />
        ))}
      </div>
    </div>
  );
}

function OptionButtons({ options, onSelect }) {
  const [selected, setSelected] = useState(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
      {options.map(opt => (
        <button key={opt.value} onClick={() => { setSelected(opt.value); onSelect(opt.value, opt.label); }}
          style={{ background: selected === opt.value ? BLACK : "#fff", color: selected === opt.value ? "#fff" : BLACK, border: `1px solid ${BORDER}`, padding: "12px 18px", fontSize: 13.5, cursor: "pointer", textAlign: "left", borderRadius: 4, transition: "all 0.15s", fontFamily: "inherit" }}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function TextInput({ val, setVal, placeholder, onSubmit, onKey, type = "text", label = "Continue" }) {
  return (
    <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
      <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={onKey} placeholder={placeholder} type={type}
        style={{ flex: 1, border: `1px solid ${BORDER}`, padding: "12px 16px", fontSize: 14, outline: "none", borderRadius: 4, fontFamily: "inherit", color: BLACK, background: "#fff" }} />
      <button onClick={onSubmit}
        style={{ background: BLACK, color: "#fff", border: "none", padding: "12px 22px", fontSize: 13, fontWeight: 500, cursor: "pointer", borderRadius: 4, letterSpacing: "0.05em", fontFamily: "inherit" }}>
        {label}
      </button>
    </div>
  );
}

function TNLocationInput({ onSelect }) {
  const [custom, setCustom] = useState(false);
  const [customVal, setCustomVal] = useState("");
  const locations = [
    { label: "Nashville area", value: "nashville" },
    { label: "Franklin", value: "franklin" },
    { label: "Lebanon / Wilson County", value: "lebanon" },
    { label: "Knoxville", value: "knoxville" },
    { label: "Memphis", value: "memphis" },
    { label: "Somewhere else — I'll type it", value: "other" },
  ];
  if (custom) {
    return (
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <input value={customVal} onChange={e => setCustomVal(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && customVal.trim()) onSelect(customVal.trim(), customVal.trim()); }}
          placeholder="Type your location" autoFocus
          style={{ flex: 1, border: `1px solid ${BORDER}`, padding: "12px 16px", fontSize: 14, outline: "none", borderRadius: 4, fontFamily: "inherit", color: BLACK }} />
        <button onClick={() => { if (customVal.trim()) onSelect(customVal.trim(), customVal.trim()); }}
          style={{ background: BLACK, color: "#fff", border: "none", padding: "12px 22px", fontSize: 13, fontWeight: 500, cursor: "pointer", borderRadius: 4, fontFamily: "inherit" }}>
          Continue
        </button>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
      {locations.map(opt => (
        <button key={opt.value} onClick={() => { if (opt.value === "other") { setCustom(true); return; } onSelect(opt.value, opt.label); }}
          style={{ background: "#fff", color: BLACK, border: `1px solid ${BORDER}`, padding: "12px 18px", fontSize: 13.5, cursor: "pointer", textAlign: "left", borderRadius: 4, fontFamily: "inherit" }}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function isTrollInput(val) {
  const lower = val.toLowerCase();
  const flags = ["fuck", "shit", "ass", "bitch", "nigga", "nigger", "cuck", "sex", "dick", "cock", "pussy", "kill", "rape", "torture", "retard", "whore", "slut"];
  return flags.some(f => lower.includes(f));
}

function HomeStyleInput({ onSelect }) {
  const [custom, setCustom] = useState(false);
  const [customVal, setCustomVal] = useState("");
  const [trolled, setTrolled] = useState(false);
  const styles = [
    { label: "Modern / contemporary", value: "modern" },
    { label: "Traditional / farmhouse", value: "farmhouse" },
    { label: "Ranch style", value: "ranch" },
    { label: "No preference", value: "any" },
    { label: "Something else — I'll describe it", value: "other" },
  ];
  if (custom) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {trolled && (
          <div style={{ fontSize: 13, color: GRAY, padding: "8px 0", fontStyle: "italic" }}>
            I love that style of home — but Lebanon is more geared toward new builds and modern infrastructure. Did you know they just built an In-N-Out in Lebanon!? Pick something I can work with and let's find you something great.
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <input value={customVal} onChange={e => setCustomVal(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && customVal.trim()) {
                if (isTrollInput(customVal)) { setTrolled(true); setCustomVal(""); return; }
                onSelect(customVal.trim(), customVal.trim());
              }
            }}
            placeholder="Describe your dream home..." autoFocus
            style={{ flex: 1, border: `1px solid ${BORDER}`, padding: "12px 16px", fontSize: 14, outline: "none", borderRadius: 4, fontFamily: "inherit", color: BLACK }} />
          <button onClick={() => {
            if (!customVal.trim()) return;
            if (isTrollInput(customVal)) { setTrolled(true); setCustomVal(""); return; }
            onSelect(customVal.trim(), customVal.trim());
          }}
            style={{ background: BLACK, color: "#fff", border: "none", padding: "12px 22px", fontSize: 13, fontWeight: 500, cursor: "pointer", borderRadius: 4, fontFamily: "inherit" }}>
            Continue
          </button>
        </div>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
      {styles.map(opt => (
        <button key={opt.value} onClick={() => { if (opt.value === "other") { setCustom(true); return; } onSelect(opt.value, opt.label); }}
          style={{ background: "#fff", color: BLACK, border: `1px solid ${BORDER}`, padding: "12px 18px", fontSize: 13.5, cursor: "pointer", textAlign: "left", borderRadius: 4, fontFamily: "inherit" }}>
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export default function App() {
  const [step, setStep] = useState("intro");
  const [data, setData] = useState({ name: "", location: "", homeStatus: "", income: 0, incomePrivate: false, timeline: "", beds: "", homeStyle: "", tnLocation: "", contactType: "", contact: "" });
  const [messages, setMessages] = useState([
    { type: "bot", text: "Hey — I'm Robert. Before we figure out what your money is worth in Tennessee, tell me a little about yourself." },
    { type: "bot", text: "What's your name and where are you coming from?" },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [typing, setTyping] = useState(false);
  const [progress, setProgress] = useState(5);
  const [showResult, setShowResult] = useState(false);
  const [showContactCTA, setShowContactCTA] = useState(false);
  const [showListing] = useState(false);
  const [showMeetOption, setShowMeetOption] = useState(false);
  const [showBookingLink, setShowBookingLink] = useState(false);
  const bottomRef = useRef(null);

  function scrollDown() { setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50); }
  function addMsg(type, text) { setMessages(m => [...m, { type, text }]); scrollDown(); }
  async function botSay(text, delay = 850) {
    setTyping(true); scrollDown();
    await new Promise(r => setTimeout(r, delay));
    setTyping(false); addMsg("bot", text);
  }
  function enter(e, fn) { if (e.key === "Enter") fn(); }

  async function handleOffScript(question) {
    addMsg("user", question);
    setInputVal("");
    setTyping(true); scrollDown();
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 300,
          messages: [{ role: "user", content: question }]
        })
      });
      const json = await res.json();
      const reply = json.content?.find(b => b.type === "text")?.text || "I've heard worse. Tennessee's still cheaper than wherever you are.";
      setTyping(false);
      addMsg("bot", reply);
    } catch {
      setTyping(false);
      addMsg("bot", "I've heard worse. Tennessee's still cheaper than wherever you are.");
    }
    await new Promise(r => setTimeout(r, 400));
    addMsg("contact", "");
  }

  async function handleIntro() {
    if (!inputVal.trim()) return;
    const val = inputVal.trim();
    if (isQuestion(val)) { handleOffScript(val); return; }
    const { name, location } = parseNameLocation(val);
    setData(d => ({ ...d, name, location }));
    setInputVal(""); addMsg("user", val);
    setProgress(20); setStep("loading");
    if (location && location.length > 2) {
      await botSay(`Nice to meet you, ${name}. Do you currently own or rent?`);
      setStep("homeStatus");
    } else {
      await botSay(`Nice to meet you, ${name} — where are you coming from? I need that to give you accurate comps.`);
      setStep("location");
    }
  }

  async function handleLocation() {
    if (!inputVal.trim()) return;
    const location = inputVal.trim();
    setData(d => ({ ...d, location }));
    setInputVal(""); addMsg("user", location);
    setProgress(25); setStep("loading");
    await botSay("Got it. Do you currently own or rent?");
    setStep("homeStatus");
  }

  async function handleHomeStatus(val, label) {
    setData(d => ({ ...d, homeStatus: val }));
    addMsg("user", label); setProgress(35); setStep("loading");
    await botSay("What kind of home are you looking for?");
    setStep("beds");
  }

  async function handleBeds(val, label) {
    setData(d => ({ ...d, beds: val }));
    addMsg("user", label); setProgress(45); setStep("loading");
    await botSay("What style of home speaks to you?");
    setStep("homeStyle");
  }

  async function handleHomeStyle(val, label) {
    setData(d => ({ ...d, homeStyle: val }));
    addMsg("user", label); setProgress(55); setStep("loading");
    await botSay("What's your timeline for wanting to make a move?");
    setStep("timeline");
  }

  async function handleTimeline(val, label) {
    const isReady = val === "soon" || val === "year";
    setData(d => ({ ...d, timeline: isReady ? "ready" : "future" }));
    addMsg("user", label); setProgress(65); setStep("loading");
    await botSay("What's your approximate household income per year? This stays between us — it just helps me run the numbers accurately. Type 0 if you'd rather keep it private.");
    setStep("income");
  }

  async function handleIncome() {
    const raw = inputVal.replace(/[^0-9.]/g, "");
    const num = parseFloat(raw);
    if (!raw || isNaN(num)) { await botSay("Just type a number — even an estimate works fine. Type 0 to keep it private."); return; }
    const isPrivate = num === 0;
    const actualIncome = isPrivate ? 0 : (num < 1000 ? num * 1000 : num);
    const display = isPrivate ? "Prefer not to say" : (num < 1000 ? "$" + num.toLocaleString() + "k/yr" : "$" + num.toLocaleString() + "/yr");
    setData(d => ({ ...d, income: actualIncome, incomePrivate: isPrivate }));
    setInputVal(""); addMsg("user", display);
    setProgress(75); setStep("loading");
    if (isPrivate) {
      await botSay("No worries at all — it's okay to keep that private. I'd still love to help you find a home of your own. Where in Tennessee are you thinking?");
    } else {
      await botSay("Where in Tennessee are you thinking?");
    }
    setStep("tnLocation");
  }

  async function handleTNLocation(val, label) {
    setData(d => ({ ...d, tnLocation: val }));
    addMsg("user", label); setProgress(88); setStep("loading");
    await botSay("Perfect — here is your Tennessee snapshot.", 800);
    setShowResult(true); setStep("result");
    setTimeout(async () => {
      await botSay("Ready to take the next step? I'd love to connect.", 900);
      setShowContactCTA(true);
    }, 1000);
  }

  async function handleContactType(val, label) {
    setData(d => ({ ...d, contactType: val }));
    addMsg("user", label); setStep("loading");
    await botSay(val === "call" ? "What's the best number to reach you?" : "What's your email address?", 500);
    setStep("contactCapture");
  }

  async function handleContactCapture() {
    if (!inputVal.trim()) return;
    const contact = inputVal.trim();
    const finalData = { ...data, contact };
    setData(finalData);
    setInputVal(""); addMsg("user", contact);
    setProgress(100); setStep("loading");
    logLeadToSheet(finalData);
    if (data.contactType === "call") {
      await botSay(`Perfect — I'll be in touch soon, ${data.name}.`, 700);
      await botSay("Changed your mind? A Google Meet works too.", 600);
      setShowMeetOption(true);
    } else {
      await botSay(`Perfect — pick a time that works for you and I'll see you then, ${data.name}.`, 700);
      setShowBookingLink(true);
    }
    setStep("done");
  }

  async function handleSwitchToMeet() {
    setShowMeetOption(false);
    addMsg("user", "Actually, let's do a Google Meet.");
    const updatedData = { ...data, contactType: "meet" };
    setData(updatedData);
    logLeadToSheet(updatedData);
    await botSay(`No problem — pick a time that works for you and I'll see you then, ${data.name}.`, 600);
    setShowBookingLink(true);
  }

  const tnPower = calcTNBuyingPower(data.income);
  const originPower = calcOriginBuyingPower(data.income);
  const savings = getSavingsTarget(data.income > 0 ? data.income : 50000);

  return (
    <div style={{ background: OFF_WHITE, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <div style={{ background: "#fff", width: "100%", maxWidth: 560, border: `1px solid ${BORDER}`, padding: "44px 40px 36px" }}>

        <div style={{ fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: GRAY, marginBottom: 28 }}>
          Robert Michael <span style={{ color: RED }}>Realty</span> — Relocation Advisor
        </div>
        <div style={{ height: 2, background: LIGHT_GRAY, marginBottom: 32, borderRadius: 2, overflow: "hidden" }}>
          <div style={{ height: "100%", width: progress + "%", background: RED, borderRadius: 2, transition: "width 0.4s ease" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
          {messages.map((m, i) => {
            if (m.type === "bot") return <BotBubble key={i} text={m.text} />;
            if (m.type === "contact") return <ContactBubble key={i} />;
            return <UserBubble key={i} text={m.text} />;
          })}

          {typing && <TypingIndicator />}

          {showResult && (
            data.incomePrivate ? (
              <div style={{ background: OFF_WHITE, border: `1px solid ${BORDER}`, padding: "18px 20px", borderRadius: 4, fontFamily: "Georgia, serif", fontSize: 15, lineHeight: 1.7, color: BLACK }}>
                No buying power snapshot without the numbers — but that's what the conversation is for. Let's connect and figure it out together.
              </div>
            ) : (
              <div style={{ marginTop: 4 }}>
                <div style={{ background: OFF_WHITE, border: `1px solid ${BORDER}`, padding: "18px 20px", borderRadius: 4 }}>
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 15, fontWeight: 600, marginBottom: 14 }}>Rough Estimate Buying Power</div>
                    {[
                      { label: "Where you are now", value: formatCurrency(originPower), color: RED },
                      { label: "In Tennessee", value: formatCurrency(tnPower), color: GREEN },
                      { label: "Difference", value: "+" + formatCurrency(tnPower - originPower), color: GREEN },
                      { label: "TN State Income Tax", value: "None", color: GREEN },
                      { label: "Est. sqft where you are", value: Math.round(originPower / 280).toLocaleString() + " sqft", color: RED },
                      { label: "Est. sqft in Tennessee", value: Math.round(tnPower / 165).toLocaleString() + " sqft", color: GREEN },

                    ].map((r, i, arr) => (
                      <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : "none", fontSize: 13.5 }}>
                        <span style={{ color: GRAY }}>{r.label}</span>
                        <span style={{ fontWeight: 500, color: r.color }}>{r.value}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 12, fontSize: 11.5, color: GRAY, fontStyle: "italic", lineHeight: 1.6 }}>
                      My lender is very good at what they do — your buying power isn't concrete.
                    </div>
                  </div>
              </div>
            )
          )}

          {showContactCTA && step !== "contactCapture" && step !== "done" && step !== "loading" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 4 }}>
              {[
                { value: "call", label: "Call", sub: "Leave your number and I'll be in touch." },
                { value: "meet", label: "Google Meet", sub: "Prefer a video consultation? I'd love to connect." },
              ].map(opt => (
                <button key={opt.value} onClick={() => handleContactType(opt.value, opt.label)}
                  style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "16px 18px", border: `1px solid ${BORDER}`, background: "#fff", cursor: "pointer", textAlign: "left", borderRadius: 4, fontFamily: "inherit" }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 500, color: BLACK, marginBottom: 2 }}>{opt.label}</div>
                    <div style={{ fontSize: 12.5, color: GRAY }}>{opt.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showMeetOption && (
            <button onClick={handleSwitchToMeet}
              style={{ alignSelf: "flex-start", background: "none", border: `1px solid ${BORDER}`, padding: "10px 16px", fontSize: 13, color: GRAY, cursor: "pointer", borderRadius: 4, fontFamily: "inherit", marginTop: 4 }}>
              Actually — let's do a Google Meet instead
            </button>
          )}

          {showBookingLink && (
            <a href="https://calendar.app.google/SnD35axfF1dfsfNz7" target="_blank" rel="noreferrer"
              style={{ display: "block", background: BLACK, color: "#fff", padding: "16px 20px", borderRadius: 4, textDecoration: "none", marginTop: 4 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "#999", marginBottom: 6 }}>Schedule a Call</div>
              <div style={{ fontFamily: "Georgia, serif", fontSize: 15, marginBottom: 4 }}>Tennessee Relocation Consultation — 30 min</div>
              <div style={{ fontSize: 12, color: "#aaa" }}>Book a time →</div>
            </a>
          )}



          <div ref={bottomRef} />
        </div>

        {step === "intro" && <TextInput val={inputVal} setVal={setInputVal} placeholder='e.g. "John from Los Angeles"' onSubmit={handleIntro} onKey={e => enter(e, handleIntro)} />}
        {step === "location" && <TextInput val={inputVal} setVal={setInputVal} placeholder="City, State or Country" onSubmit={handleLocation} onKey={e => enter(e, handleLocation)} />}
        {step === "homeStatus" && <OptionButtons options={[{ label: "I own my home", value: "own" }, { label: "I rent", value: "rent" }, { label: "Living with family / other", value: "other" }]} onSelect={handleHomeStatus} />}
        {step === "beds" && <OptionButtons options={[{ label: "2 bedrooms", value: "2bd" }, { label: "3 bedrooms", value: "3bd" }, { label: "4+ bedrooms", value: "4bd+" }, { label: "Open to anything", value: "flexible" }]} onSelect={handleBeds} />}
        {step === "homeStyle" && <HomeStyleInput onSelect={handleHomeStyle} />}
        {step === "timeline" && <OptionButtons options={[{ label: "Within 6 months", value: "soon" }, { label: "6–12 months", value: "year" }, { label: "1–2 years", value: "couple" }, { label: "Just exploring for now", value: "future" }]} onSelect={handleTimeline} />}
        {step === "income" && <TextInput val={inputVal} setVal={setInputVal} placeholder="e.g. 75000 — or type 0 to keep it private" onSubmit={handleIncome} onKey={e => enter(e, handleIncome)} />}
        {step === "tnLocation" && <TNLocationInput onSelect={handleTNLocation} />}
        {step === "contactCapture" && (
          <TextInput val={inputVal} setVal={setInputVal}
            placeholder={data.contactType === "call" ? "Your phone number" : "Your email address"}
            onSubmit={handleContactCapture} onKey={e => enter(e, handleContactCapture)}
            type={data.contactType === "call" ? "tel" : "email"} label="Submit" />
        )}
        {step === "done" && (
          <div style={{ textAlign: "center", padding: "12px 0", fontSize: 13, color: "#888", letterSpacing: "0.05em" }}>
            You are all set. Speak soon.
          </div>
        )}

        <div style={{ height: 1, background: LIGHT_GRAY, margin: "20px 0 12px" }} />
        <div style={{ fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#999", textAlign: "center" }}>
          Robert Michael <span style={{ color: RED }}>Realty</span>
        </div>
      </div>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}} input::placeholder{color:#aaa;opacity:1;}`}</style>
    </div>
  );
}