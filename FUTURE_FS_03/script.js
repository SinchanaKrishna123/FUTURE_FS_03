/* ---------- Data (edit these to match the real clinic) ---------- */
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

// Clinic hours by day number (0 = Sunday). null = closed. Times in 24h "HH:MM".
const CLINIC_HOURS = {
  0: null,
  1: ["09:00", "19:00"],
  2: ["09:00", "19:00"],
  3: ["09:00", "19:00"],
  4: ["09:00", "19:00"],
  5: ["09:00", "19:00"],
  6: ["09:00", "14:00"]
};

// Each doctor has a schedule: day number -> [start, end]. Missing day = not in.
const DOCTORS = [
  {
    id: "d1", name: "Dr. Anita Sharma", role: "General Physician",
    degree: "MBBS, MD (Internal Medicine)", exp: "14 years",
    languages: "English, Hindi, Marathi", fee: "Rs. 500",
    about: "Treats fever, infections, diabetes, blood pressure and thyroid problems. Known for taking time to explain the plan.",
    schedule: {
      1: ["09:00", "13:00"], 2: ["09:00", "13:00"], 3: ["09:00", "13:00"],
      4: ["09:00", "13:00"], 5: ["09:00", "13:00"]
    }
  },
  {
    id: "d2", name: "Dr. Rahul Mehta", role: "Pediatrician",
    degree: "MBBS, DCH", exp: "10 years",
    languages: "English, Hindi, Gujarati", fee: "Rs. 600",
    about: "Looks after babies, children and teenagers. Handles vaccinations, growth checks and common childhood illnesses.",
    schedule: {
      1: ["10:00", "14:00"], 3: ["10:00", "14:00"], 5: ["10:00", "14:00"], 6: ["09:00", "13:00"]
    }
  },
  {
    id: "d3", name: "Dr. Priya Nair", role: "Dermatologist",
    degree: "MBBS, DVD", exp: "8 years",
    languages: "English, Hindi, Malayalam", fee: "Rs. 700",
    about: "Treats acne, allergies, rashes, hair fall and long-term skin conditions with simple, step-by-step care plans.",
    schedule: {
      2: ["14:00", "19:00"], 4: ["14:00", "19:00"], 6: ["10:00", "14:00"]
    }
  },
  {
    id: "d4", name: "Dr. Imran Qureshi", role: "Dentist",
    degree: "BDS, MDS", exp: "12 years",
    languages: "English, Hindi, Urdu", fee: "Rs. 400",
    about: "Does cleaning, fillings, root canals and checkups. Patient and gentle with children and nervous adults.",
    schedule: {
      1: ["15:00", "19:00"], 2: ["15:00", "19:00"], 3: ["15:00", "19:00"],
      4: ["15:00", "19:00"], 5: ["15:00", "19:00"]
    }
  }
];

const SLOT_MINUTES = 30;
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first

/* ---------- Helpers ---------- */
const $ = (id) => document.getElementById(id);

const toMinutes = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

function formatTime(t) {
  const mins = typeof t === "number" ? t : toMinutes(t);
  const h = Math.floor(mins / 60), m = mins % 60;
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

// Short form: "9 AM" or "2:30 PM"
function shortTime(t) {
  const mins = toMinutes(t);
  const h = Math.floor(mins / 60), m = mins % 60;
  return `${h % 12 || 12}${m ? ":" + String(m).padStart(2, "0") : ""} ${h >= 12 ? "PM" : "AM"}`;
}

const range = (r) => `${shortTime(r[0])} to ${shortTime(r[1])}`;
const dayShort = (d) => DAY_NAMES[d].slice(0, 3);

function initials(name) {
  return name.replace("Dr. ", "").split(" ").map((w) => w[0]).join("");
}

/* ---------- Live open/closed status ---------- */
function updateStatus() {
  const now = new Date();
  const today = now.getDay();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const hours = CLINIC_HOURS[today];
  const dot = $("statusDot");

  if (hours && nowMin >= toMinutes(hours[0]) && nowMin < toMinutes(hours[1])) {
    dot.className = "dot open";
    $("statusTitle").textContent = "We are open now";
    $("statusSub").textContent = `Open until ${formatTime(hours[1])} today.`;
    return;
  }

  dot.className = "dot closed";
  $("statusTitle").textContent = "We are closed right now";

  // Find the next opening time
  for (let i = 0; i < 8; i++) {
    const day = (today + i) % 7;
    const h = CLINIC_HOURS[day];
    if (!h) continue;
    if (i === 0 && nowMin >= toMinutes(h[0])) continue; // already passed today
    const when = i === 0 ? "today" : i === 1 ? "tomorrow" : DAY_NAMES[day];
    $("statusSub").textContent = `Opens ${when} at ${formatTime(h[0])}.`;
    return;
  }
}

/* ---------- Doctors ---------- */
function renderDoctors() {
  const today = new Date().getDay();

  $("doctorGrid").innerHTML = DOCTORS.map((d) => {
    const todaySlot = d.schedule[today];
    const badge = todaySlot
      ? `<span class="badge on">In today: ${range(todaySlot)}</span>`
      : `<span class="badge off">Not in today</span>`;

    const tags = WEEK_ORDER.map((day) =>
      `<span class="${d.schedule[day] ? "on" : ""}">${dayShort(day)}</span>`).join("");

    return `
    <article class="doctor">
      <div class="doc-top">
        <div class="avatar" aria-hidden="true">${initials(d.name)}</div>
        <div>
          <h3>${d.name}</h3>
          <p class="role">${d.role}</p>
        </div>
      </div>
      ${badge}
      <p class="about">${d.about}</p>
      <ul class="facts">
        <li><span>Qualification</span><b>${d.degree}</b></li>
        <li><span>Experience</span><b>${d.exp}</b></li>
        <li><span>Languages</span><b>${d.languages}</b></li>
        <li><span>Consultation fee</span><b>${d.fee}</b></li>
      </ul>
      <div class="week-tags" aria-label="Days available">${tags}</div>
      <a class="btn" href="#book" data-doctor="${d.id}">Book with ${d.name.split(" ")[1]}</a>
    </article>`;
  }).join("");

  $("doctorGrid").addEventListener("click", (e) => {
    const link = e.target.closest("[data-doctor]");
    if (!link) return;
    $("doctor").value = link.dataset.doctor;
    refreshTimes();
  });
}

/* ---------- Weekly timetable ---------- */
function renderTimetable() {
  const today = new Date().getDay();

  const head = `<thead><tr>
    <th scope="col">Day</th>
    <th scope="col">Clinic hours</th>
    ${DOCTORS.map((d) => `<th scope="col">${d.name}<small>${d.role}</small></th>`).join("")}
  </tr></thead>`;

  const rows = WEEK_ORDER.map((day) => {
    const clinic = CLINIC_HOURS[day];
    const clinicCell = clinic ? range(clinic) : `<span class="shut">Closed</span>`;
    const docCells = DOCTORS.map((d) => {
      const s = d.schedule[day];
      return s ? `<td>${range(s)}</td>` : `<td class="none">Off</td>`;
    }).join("");
    return `<tr class="${day === today ? "today" : ""}">
      <th scope="row">${DAY_NAMES[day]}</th><td>${clinicCell}</td>${docCells}</tr>`;
  }).join("");

  $("timetable").innerHTML = head + `<tbody>${rows}</tbody>`;
}

/* ---------- Form setup ---------- */
function setupForm() {
  // Doctor dropdown
  $("doctor").innerHTML = `<option value="">Select a doctor</option>` +
    DOCTORS.map((d) => `<option value="${d.id}">${d.name} (${d.role})</option>`).join("");

  // Date limits: today to 60 days ahead
  const dateInput = $("date");
  const today = new Date();
  const max = new Date(); max.setDate(today.getDate() + 60);
  const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
  dateInput.min = iso(today);
  dateInput.max = iso(max);

  $("doctor").addEventListener("change", refreshTimes);
  dateInput.addEventListener("change", refreshTimes);
  $("appointmentForm").addEventListener("submit", handleSubmit);

  $("newRequest").addEventListener("click", () => {
    $("confirmation").hidden = true;
    $("appointmentForm").hidden = false;
    $("appointmentForm").reset();
    refreshTimes();
  });
}

// Build available time slots for the chosen doctor and date
function refreshTimes() {
  const timeSel = $("time");
  const doctor = DOCTORS.find((d) => d.id === $("doctor").value);
  const dateVal = $("date").value;

  // Hint showing which days this doctor sees patients
  $("doctorHint").textContent = doctor
    ? "Available: " + WEEK_ORDER.filter((d) => doctor.schedule[d]).map(dayShort).join(", ")
    : "";

  if (!doctor || !dateVal) {
    timeSel.innerHTML = `<option value="">Choose a doctor and date first</option>`;
    return;
  }

  const [y, m, d] = dateVal.split("-").map(Number);
  const picked = new Date(y, m - 1, d);
  const hours = doctor.schedule[picked.getDay()];

  if (!hours) {
    timeSel.innerHTML = `<option value="">${doctor.name} is not in on ${DAY_NAMES[picked.getDay()]}s</option>`;
    return;
  }

  const isToday = picked.toDateString() === new Date().toDateString();
  const nowMin = new Date().getHours() * 60 + new Date().getMinutes();
  const slots = [];
  for (let t = toMinutes(hours[0]); t + SLOT_MINUTES <= toMinutes(hours[1]); t += SLOT_MINUTES) {
    if (!isToday || t > nowMin) slots.push(t);
  }

  timeSel.innerHTML = slots.length
    ? `<option value="">Select a time</option>` + slots.map((t) => `<option value="${t}">${formatTime(t)}</option>`).join("")
    : `<option value="">No slots left today. Try another date</option>`;
}

/* ---------- Validation and submit ---------- */
function setError(fieldId, message) {
  const field = $(fieldId).closest(".field");
  $(fieldId + "Error").textContent = message;
  field.classList.toggle("invalid", Boolean(message));
  return !message;
}

function validate() {
  const name = $("name").value.trim();
  const phone = $("phone").value.replace(/[\s-]/g, "");
  let ok = true;

  ok = setError("name", name.length < 2 ? "Enter your full name." : "") && ok;
  ok = setError("phone", /^(\+91)?[6-9]\d{9}$/.test(phone) ? "" : "Enter a valid 10-digit mobile number.") && ok;
  ok = setError("doctor", $("doctor").value ? "" : "Select a doctor.") && ok;
  ok = setError("date", $("date").value ? "" : "Choose a date.") && ok;
  ok = setError("time", $("time").value ? "" : "Choose a time slot.") && ok;
  return ok;
}

function handleSubmit(e) {
  e.preventDefault();
  if (!validate()) return;

  const doctor = DOCTORS.find((d) => d.id === $("doctor").value);
  const [y, m, d] = $("date").value.split("-").map(Number);
  const dateText = new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long"
  });

  // In a real project, send this data to a server or email service here.
  const request = {
    name: $("name").value.trim(),
    phone: $("phone").value.trim(),
    doctor: doctor.name,
    date: $("date").value,
    time: formatTime(Number($("time").value)),
    reason: $("reason").value.trim()
  };
  console.log("Appointment request:", request);

  $("confirmText").textContent =
    `Thank you, ${request.name.split(" ")[0]}. We received your request for ${doctor.name} on ${dateText} at ${request.time}. ` +
    `Our reception will call ${request.phone} to confirm.`;
  $("appointmentForm").hidden = true;
  $("confirmation").hidden = false;
  $("confirmation").scrollIntoView({ behavior: "smooth", block: "center" });
}

/* ---------- Doctor filter chips ---------- */
$("doctorChips").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("active", c === chip));
  const filter = chip.dataset.filter;
  document.querySelectorAll("#doctorGrid .doctor").forEach((card) => {
    const role = card.querySelector(".role").textContent;
    card.hidden = filter !== "all" && !role.includes(filter);
  });
});

/* ---------- Dark mode (remembers the choice) ---------- */
const themeBtn = $("themeToggle");
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  themeBtn.textContent = theme === "dark" ? "Light" : "Dark";
  themeBtn.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
}
let savedTheme = null;
try { savedTheme = localStorage.getItem("theme"); } catch (err) {}
applyTheme(savedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

themeBtn.addEventListener("click", () => {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
  try { localStorage.setItem("theme", next); } catch (err) {}
});

/* ---------- Mobile menu ---------- */
const menuBtn = $("menuBtn");
const mainNav = $("mainNav");
menuBtn.addEventListener("click", () => {
  const open = mainNav.classList.toggle("open");
  menuBtn.setAttribute("aria-expanded", open);
  menuBtn.textContent = open ? "Close" : "Menu";
});
mainNav.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    mainNav.classList.remove("open");
    menuBtn.setAttribute("aria-expanded", "false");
    menuBtn.textContent = "Menu";
  }
});

/* ---------- Count-up numbers ---------- */
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function showNumber(el, value) {
  const dec = Number(el.dataset.decimals || 0);
  el.textContent = value.toLocaleString("en-IN", { minimumFractionDigits: dec, maximumFractionDigits: dec }) +
    (el.dataset.suffix || "");
}
function runCount(el) {
  const target = parseFloat(el.dataset.target);
  if (reduceMotion) { showNumber(el, target); return; }
  const start = performance.now(), duration = 1400;
  (function tick(now) {
    const p = Math.min((now - start) / duration, 1);
    showNumber(el, target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  })(start);
}
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) { runCount(entry.target); counterObserver.unobserve(entry.target); }
  });
}, { threshold: 0.6 });
document.querySelectorAll(".count").forEach((el) => counterObserver.observe(el));

/* ---------- Back-to-top button ---------- */
const toTop = $("toTop");
window.addEventListener("scroll", () => { toTop.hidden = window.scrollY < 600; });
toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

/* ---------- Start ---------- */
renderDoctors();
renderTimetable();
setupForm();
updateStatus();
setInterval(updateStatus, 60000); // keep the open/closed status fresh