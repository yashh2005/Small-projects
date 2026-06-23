/* Password Strength + Crack Time Estimator
   - All runs client-side (no data sent anywhere).
   - Simple entropy model: chars_in_set^length -> entropy bits = length * log2(charset)
*/

const passwordInput = document.getElementById("password");
const toggleBtn = document.getElementById("toggle");
const strengthText = document.getElementById("strength-text");
const suggestions = document.getElementById("suggestions");
const fill = document.getElementById("strength-fill");
const crackTimeDiv = document.getElementById("crack-time");

// Toggle show/hide
toggleBtn.addEventListener("click", () => {
  passwordInput.type = passwordInput.type === "password" ? "text" : "password";
});

// Main listener
passwordInput.addEventListener("input", () => {
  const pwd = passwordInput.value;
  const analysis = analyzePassword(pwd);
  updateUI(analysis);
  updateCrackTimes(analysis);
});

/* Analyze password (score, tips, entropy data) */
function analyzePassword(password) {
  let score = 0;
  let tips = [];

  // Basic rules (same as before) for visual scoring
  if (password.length >= 8) score += 20;
  else tips.push("Use at least 8 characters");

  if (/[A-Z]/.test(password)) score += 20;
  else tips.push("Add uppercase letters");

  if (/[a-z]/.test(password)) score += 20;
  else tips.push("Add lowercase letters");

  if (/[0-9]/.test(password)) score += 20;
  else tips.push("Add numbers");

  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  else tips.push("Add special characters (e.g., !@#$%)");

  // Entropy calculation info
  const charsetSize = estimateCharsetSize(password);
  const entropyBits = password.length > 0 ? password.length * Math.log2(Math.max(2, charsetSize)) : 0;
  const possibleGuesses = Math.pow(2, entropyBits); // may be Infinity for huge exponents; used for conceptual understanding

  return {
    password,
    score,
    tips,
    entropyBits,
    charsetSize,
    possibleGuesses
  };
}

/* Estimate charset size used by this password.
   We approximate available symbol counts:
   - lowercase: 26
   - uppercase: 26
   - digits: 10
   - symbols: 32 (common printable special chars)
*/
function estimateCharsetSize(password) {
  if (!password || password.length === 0) return 0;
  let size = 0;
  if (/[a-z]/.test(password)) size += 26;
  if (/[A-Z]/.test(password)) size += 26;
  if (/[0-9]/.test(password)) size += 10;
  if (/[^A-Za-z0-9]/.test(password)) size += 32;
  // If password uses e.g. unicode/emojis, the real charset is larger;
  // this is a conservative approximation for typical passwords.
  return size;
}

/* Update visual UI: meter, text, suggestions */
function updateUI({ score, tips }) {
  const pct = Math.min(100, Math.max(0, score));
  fill.style.width = pct + "%";

  const color = score <= 40 ? "#e15353" : score <= 60 ? "#f5a623" : score <= 80 ? "#f7d154" : "#34c759";
  fill.style.background = color;

  strengthText.textContent =
    score <= 40 ? "Strength: Weak" :
    score <= 60 ? "Strength: Fair" :
    score <= 80 ? "Strength: Strong" : "Strength: Very Strong";

  suggestions.innerHTML = "";
  tips.forEach(t => {
    const li = document.createElement("li");
    li.textContent = t;
    suggestions.appendChild(li);
  });
}

/* Convert seconds to a human-readable string */
function formatDuration(seconds) {
  if (!isFinite(seconds) || seconds === 0) return "Instant / trivial";
  if (seconds < 1) return (seconds * 1000).toFixed(1) + " ms";
  const units = [
    { name: "year", secs: 365 * 24 * 3600 },
    { name: "day", secs: 24 * 3600 },
    { name: "hour", secs: 3600 },
    { name: "minute", secs: 60 },
    { name: "second", secs: 1 }
  ];
  let out = [];
  let remaining = seconds;
  for (let u of units) {
    if (remaining >= u.secs) {
      const v = Math.floor(remaining / u.secs);
      remaining -= v * u.secs;
      out.push(`${v} ${u.name}${v > 1 ? "s" : ""}`);
      if (out.length === 2) break; // show up to two units for brevity
    }
  }
  return out.length ? out.join(", ") : "less than a second";
}

/* Update crack time estimates and render them */
function updateCrackTimes(analysis) {
  const { entropyBits, charsetSize, password } = analysis;

  if (!password || password.length === 0) {
    crackTimeDiv.innerHTML = "<em>Type a password to see estimates.</em>";
    return;
  }

  // Attacker speeds (guesses per second)
  // These are approximate example rates for demonstration:
  const rates = [
    { label: "Online (throttled, e.g., login attempts)", rate: 100 },      // 100 guesses/sec
    { label: "Offline (single GPU/password hashing attack)", rate: 1e9 },  // 1 billion/sec
    { label: "Powerful attacker (multi-GPU cluster)", rate: 1e12 },        // 1 trillion/sec
    { label: "Extreme (large botnet / massive cluster)", rate: 1e15 }      // 1 quadrillion/sec
  ];

  // Convert entropy -> possible guesses: guesses ~ 2^entropy.
  // We'll compute seconds = 2^entropy / rate = Math.pow(2, entropyBits) / rate
  // To avoid Infinity for very large exponents, compute using logs:
  // log10(guesses) = entropyBits * log10(2)
  const log10Guesses = entropyBits * Math.log10(2); // base-10 log of guesses

  // Build HTML
  let html = `<div>Entropy: <strong>${entropyBits.toFixed(1)} bits</strong> &nbsp; (charset ≈ ${charsetSize})</div><br/>`;
  html += `<table style="width:100%;font-size:13px;border-collapse:collapse">`;
  html += `<tr><th style="text-align:left;padding:4px 0">Attacker</th><th style="text-align:right;padding:4px 0">Est. time</th></tr>`;

  rates.forEach(r => {
    // log10(seconds) = log10(2^entropy / rate) = log10Guesses - log10(rate)
    const log10Secs = log10Guesses - Math.log10(r.rate);
    let est;
    if (log10Secs > 18) {
      // extremely large: give in scientific notation ( > 1e18 seconds ~ huge)
      est = `~10^${Math.round(log10Secs)} seconds`;
    } else {
      const secs = Math.pow(10, log10Secs);
      est = formatDuration(secs);
    }
    html += `<tr><td style="padding:4px 0">${r.label}</td><td style="padding:4px 0;text-align:right">${est}</td></tr>`;
  });

  html += `</table>`;
  crackTimeDiv.innerHTML = html;
}
