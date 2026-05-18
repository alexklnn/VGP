const scenarios = {
  scream: {
    title: "SCREAM",
    type: "SCREAM",
    confidence: "87%",
    timestamp: "23:14",
    date: "12 / 05 / 2025",
    direction: "045° (NE)",
    doaShort: "NE",
    distance: "82 m",
    bearing: "045°",
    description: "Scream detected. High confidence. Possible distress situation.",
    audio: "assets/scream.mp3",
    eventSound: "assets/soloScream.mp3",
    video: "assets/scream.mp4",
    camera: "CAM 05 - Parking Lot",
     cameraIcon: "camIcon05",
    color: "red",
    videoPosition: "20% 10%"
  },

  door: {
    title: "DOOR SLAM",
    type: "DOOR SLAM",
    confidence: "74%",
    timestamp: "23:14",
    date: "12 / 05 / 2025",
    direction: "000° (N)",
    doaShort: "N",
    distance: "120 m",
    bearing: "000°",
    description: "Door slam detected. Normal daytime activity near entrance.",
    audio: "assets/door.mp3",
    eventSound: "assets/soloDoor.mp3",
    video: "assets/door.mp4",
    camera: "CAM 03 - Central",
     cameraIcon: "camIcon03",
    color: "green",
    videoPosition: "90% 120%"
  },
  car: {
    title: "VEHICLE",
    type: "VEHICLE",
    confidence: "81%",
    timestamp: "23:14",
    date: "12 / 05 / 2025",
    direction: "180° (S)",
    doaShort: "S",
    distance: "200 m",
    bearing: "180°",
    description: "Vehicle sound detected at night. Direction and movement require monitoring.",
    audio: "assets/car.mp3",
    eventSound: "assets/soloCar.mp3",
    video: "assets/vehicle.mp4",
    camera: "CAM 04 - South Area",
    cameraIcon: "camIcon06",
    color: "amber",
    videoPosition: "50% 20%"
  },
  
 bang: {
  title: "SCREAM",
  type: "SCREAM",
  confidence: "62%",
  timestamp: "23:15",
  date: "12 / 05 / 2025",
  direction: "180° (S)",
  doaShort: "S",
  distance: "95 m",
  bearing: "180°",

  description:
    "Scream detected. Review history before responging.",

  audio: "assets/scream.mp3",
 eventSound: "assets/soloScream.mp3",

  video: "assets/Scream1.mp4",

  camera: "CAM 06 - South Area",
  cameraIcon: "camIcon06",

  color: "amber",

  videoPosition: "50% 50%"
}
};



let selectedScenarioKey = null;
let currentScenario = null;
let currentDecision = null;
let logbookEntries = [];
let triggerTimer = null;
let timelineLogbookEntriesAdded = false;
let logbookPageIndex = 0;


const setupScreen = document.getElementById("setupScreen");
const idleScreen = document.getElementById("idleScreen");
const vgpInterface = document.getElementById("vgpInterface");
const logbookModal = document.getElementById("logbookModal");
const logbookView = document.getElementById("logbookView");

const eventAudio = document.getElementById("eventAudio");
const cameraVideo = document.getElementById("cameraVideo");
const cameraVideoLarge = document.getElementById("cameraVideoLarge");

/* ---------- SCENARIO FLOW ---------- */

function selectScenario(key) {
  selectedScenarioKey = key;

  setupScreen.classList.add("hidden");
  vgpInterface.classList.add("hidden");
  idleScreen.classList.remove("hidden");

  clearTimeout(triggerTimer);

  triggerTimer = setTimeout(() => {
  showEventNotification(selectedScenarioKey);
}, 5000);
}

function showEventNotification(key) {
  const scenario = scenarios[key];
  if (!scenario) return;

  const notif = document.getElementById("eventNotification");

  document.getElementById("notifTitle").textContent =
    scenario.title;

  document.getElementById("notifMeta").textContent =
    `${scenario.confidence} confidence · ${scenario.camera}`;

  document.getElementById("notifTime").textContent =
    scenario.timestamp;

  notif.classList.remove("hidden");

  // subtle alert sound
  const ping = new Audio("assets/notification.mp3");
  ping.volume = 0.45;
  ping.play().catch(() => {});

}

function openNotificationEvent() {
  document.getElementById("eventNotification")
    .classList.add("hidden");

  triggerScenario(selectedScenarioKey);
}

function triggerScenario(key) {
  currentScenario = scenarios[key];
  if (!currentScenario) return;

  currentDecision = null;

  setupScreen.classList.add("hidden");
  idleScreen.classList.add("hidden");
  vgpInterface.classList.remove("hidden");

  showAlertFlash();
  updateEventInfo();
  updateMedia();
  renderTimeline();
  updateMap();
  drawWaveforms();
  drawCompass();
  addTimelineEventsToLogbook();
}

function updateEventInfo() {
  document.getElementById("eventType").textContent = currentScenario.type;
  document.getElementById("confidence").textContent = currentScenario.confidence;
  document.getElementById("timestamp").textContent = currentScenario.timestamp;
  document.getElementById("eventDate").textContent = currentScenario.date;
  document.getElementById("directionVal").textContent = currentScenario.direction;
  document.getElementById("distanceVal").textContent = currentScenario.distance;
  document.getElementById("eventDescription").textContent = currentScenario.description;

  document.getElementById("camLabel").textContent = currentScenario.camera;
  document.getElementById("camOverlayTime").textContent = currentScenario.timestamp;

  document.getElementById("audioTimestamp").textContent = "00:00 — 00:06";
  switchCamera(currentScenario.camera, currentScenario.cameraIcon);
}

/* ---------- MEDIA ---------- */

function updateMedia() {
  cameraVideo.src = currentScenario.video;
  cameraVideoLarge.src = currentScenario.video;

  videoAudio.src = currentScenario.audio;

  cameraVideo.style.objectPosition = currentScenario.videoPosition || "50% 50%";
  cameraVideoLarge.style.objectPosition = currentScenario.videoPosition || "50% 50%";

  const camNoSource = document.getElementById("camNoSource");

  cameraVideo.onloadeddata = () => {
    cameraVideo.classList.add("visible");
    camNoSource.classList.add("hidden");

    cameraVideo.currentTime = 0;
    videoAudio.currentTime = 0;

    cameraVideo.play().then(() => {
      videoAudio.play().catch(() => {});
      document.getElementById("playPauseBtn").textContent = "⏸ PAUSE";
    }).catch(() => {});
  };

  cameraVideo.load();
}

function toggleEventSound(button) {
  if (!currentScenario || !currentScenario.eventSound) return;

  const correctSound = currentScenario.eventSound;

  // If same sound is already loaded and playing, pause it
  if (!eventAudio.paused && eventAudio.src.includes(correctSound)) {
    eventAudio.pause();
    button.textContent = "▶";
    return;
  }

  // Stop ambience/video audio
  videoAudio.pause();

  // Load ONLY the solo event sound
  eventAudio.pause();
  eventAudio.src = correctSound;
  eventAudio.currentTime = 0;

  eventAudio.play().then(() => {
    button.textContent = "⏸";
  }).catch(() => {});
}

eventAudio.addEventListener("ended", () => {
  document.querySelectorAll(".audio-play-btn, .modal-play-btn").forEach(btn => {
    btn.textContent = "▶";
  });
});

/* ---------- 24H TIMELINE ---------- */

let timelinePage = 0;

const timelinePages = [
  [
    { id: "day1-0715", time: "08 / 05 07:15", displayTime: "07:15", date: "08 / 05 / 2025", pos: 8, status: "done", eventType: "footsteps" },

    { id: "day1-1030", time: "08 / 05 10:30", displayTime: "10:30", date: "08 / 05 / 2025", pos: 29, status: "done", eventType: "gate" },

    { id: "day1-1420", time: "08 / 05 14:20", displayTime: "14:20", date: "08 / 05 / 2025", pos: 50, status: "amber", eventType: "construction" },

    { id: "day1-2045", time: "08 / 05 20:45", displayTime: "20:45", date: "08 / 05 / 2025", pos: 71, status: "amber", eventType: "vehicle" },

    { id: "day1-2315", time: "08 / 05 23:15", displayTime: "23:15", date: "08 / 05 / 2025", pos: 92, status: "critical", eventType: "scream" }
  ],

  [
    { id: "day2-0640", time: "09 / 05 06:40", displayTime: "06:40", date: "09 / 05 / 2025", pos: 8, status: "critical", eventType: "sirene" },

    { id: "day2-1130", time: "09 / 05 11:30", displayTime: "11:30", date: "09 / 05 / 2025", pos: 36, status: "done", eventType: "door" },

    { id: "day2-1740", time: "09 / 05 17:40", displayTime: "17:40", date: "09 / 05 / 2025", pos: 64, status: "done", eventType: "footsteps" },

    { id: "day2-2314", time: "09 / 05 23:14", displayTime: "23:14", date: "09 / 05 / 2025", pos: 92, status: "critical", eventType: "scream" }
  ],

  [
    { id: "day3-0810", time: "10 / 05 08:10", displayTime: "08:10", date: "10 / 05 / 2025", pos: 8, status: "done", eventType: "vehicle" },

    { id: "day3-1200", time: "10 / 05 12:00", displayTime: "12:00", date: "10 / 05 / 2025", pos: 24, status: "critical", eventType: "sirene" },

    { id: "day3-1615", time: "10 / 05 16:15", displayTime: "16:15", date: "10 / 05 / 2025", pos: 40, status: "amber", eventType: "construction" },

    { id: "day3-1930", time: "10 / 05 19:30", displayTime: "19:30", date: "10 / 05 / 2025", pos: 56, status: "done", eventType: "door" },

    { id: "day3-2240", time: "10 / 05 22:40", displayTime: "22:40", date: "10 / 05 / 2025", pos: 72, status: "amber", eventType: "vehicle" },

    { id: "day3-2316", time: "10 / 05 23:16", displayTime: "23:16", date: "10 / 05 / 2025", pos: 88, status: "amber", eventType: "scream" }
  ],

  [
    { id: "yesterday-0915", time: "Yesterday 09:15", displayTime: "09:15", date: "11 / 05 / 2025", pos: 8, status: "done", eventType: "footsteps" },

    { id: "yesterday-1310", time: "Yesterday 13:10", displayTime: "13:10", date: "11 / 05 / 2025", pos: 22, status: "done", eventType: "gate" },

    { id: "yesterday-1645", time: "Yesterday 16:45", displayTime: "16:45", date: "11 / 05 / 2025", pos: 36, status: "amber", eventType: "construction" },

    { id: "yesterday-2015", time: "Yesterday 20:15", displayTime: "20:15", date: "11 / 05 / 2025", pos: 50, status: "done", eventType: "door" },
    
     { id: "yesterday-2023", time: "Yesterday 20:23", displayTime: "20:23", date: "11 / 05 / 2025", pos: 64, status: "done", eventType: "gate" },

    { id: "yesterday-2230", time: "Yesterday 22:30", displayTime: "22:30", date: "11 / 05 / 2025", pos: 78, status: "amber", eventType: "vehicle" },

    { id: "yesterday-2315", time: "Yesterday 23:15", displayTime: "23:15", date: "11 / 05 / 2025", pos: 92, status: "amber", eventType: "scream" }
  ],

  [
    { id: "today-0020", time: "Today 00:20", displayTime: "00:20", date: "12 / 05 / 2025", pos: 8, status: "done", eventType: "gate" },

    { id: "today-0310", time: "Today 03:10", displayTime: "03:10", date: "12 / 05 / 2025", pos: 22, status: "amber", eventType: "vehicle" },

    { id: "today-0815", time: "Today 08:15", displayTime: "08:15", date: "12 / 05 / 2025", pos: 36, status: "done", eventType: "door" },

    { id: "today-1230", time: "Today 12:30", displayTime: "12:30", date: "12 / 05 / 2025", pos: 50, status: "critical", eventType: "sirene" },

    { id: "today-1432", time: "Today 14:32", displayTime: "14:32", date: "12 / 05 / 2025", pos: 64, status: "amber", eventType: "construction" },

    { id: "today-1840", time: "Today 18:40", displayTime: "18:40", date: "12 / 05 / 2025", pos: 78, status: "done", eventType: "footsteps" },

    { id: "current-event", time: "Today 23:14", displayTime: "23:14", date: "12 / 05 / 2025", pos: 92, status: "current", eventType: "scream" }
  ]
];

function addTimelineEventsToLogbook() {
  if (timelineLogbookEntriesAdded) return;

  const uniqueItems = [];

  timelinePages.flat().forEach((item) => {
    if (item.status === "current") return;
    if (uniqueItems.some((existing) => existing.id === item.id)) return;
    uniqueItems.push(item);
  });

  uniqueItems.forEach((item) => {
    const entry = createLogbookEntryFromTimelineItem(item);
    logbookEntries.push(entry);
  });

  sortLogbookEntries();
  timelineLogbookEntriesAdded = true;

  renderLogbook();
  renderFullLogbook();
}
function openLogbookEntryFromTimeline(item) {
  addTimelineEventsToLogbook();

  const cleanTime = item.time.replace("Today ", "").replace("Yesterday ", "");
  const date = item.time.includes("Yesterday") ? "11 / 05 / 2025" : "12 / 05 / 2025";
  const id = `timeline-${date}-${cleanTime}`.replaceAll(" ", "-").replaceAll("/", "-").replaceAll(":", "-");

  renderFullLogbook(id);
  logbookView.classList.remove("hidden");

  setTimeout(() => {
    const row = document.querySelector(`[data-entry-id="${id}"]`);
    if (row) row.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 50);
}

function renderTimeline() {
  const timeline = document.getElementById("timelineEvents");
  if (!timeline) return;

  timeline.innerHTML = "";

  const page = timelinePages[timelinePage];

  page.forEach((item) => {
    const eventDot = document.createElement("button");
    eventDot.type = "button";
    eventDot.className = "tl-event";

    if (item.status === "current") eventDot.classList.add("tl-current");
    if (item.status === "done") eventDot.classList.add("tl-done");
    if (item.status === "amber") eventDot.classList.add("tl-amber");
    if (item.status === "critical") eventDot.classList.add("tl-critical");

    eventDot.style.left = `${item.pos}%`;

    if (item.status !== "current") {
      eventDot.onclick = () => openLogbookEntryFromTimeline(item.id);
    }

    const timeLabel = document.createElement("span");
    timeLabel.className = "tl-time-label";
    if (item.status === "current") timeLabel.classList.add("tl-current-label");

    timeLabel.style.left = `${item.pos}%`;
    timeLabel.textContent = item.time;

    timeline.appendChild(eventDot);
    timeline.appendChild(timeLabel);
  });
}


function timelinePrevious() {
  if (timelinePage > 0) {
    timelinePage--;
    renderTimeline();
  }
}

function timelineNext() {
  if (timelinePage < timelinePages.length - 1) {
    timelinePage++;
    renderTimeline();
  }
}

function goToNow() {
  timelinePage = timelinePages.length - 1;
  renderTimeline();
}

/* ---------- MAP ---------- */

function updateMap() {
  const marker = document.getElementById("eventMarker");
  const doaOverlay = document.getElementById("doaOverlay");

  const positions = {
    scream: {
      eventLeft: "57%", eventTop: "44%",
      coneLeft: "58%", coneTop: "58%",
      coneRotate: -95
    },
    door: {
      eventLeft: "53%", eventTop: "28%",
      coneLeft: "46%", coneTop: "36%",
      coneRotate: -35
    },
   car: {
  eventLeft: "32%",
  eventTop: "88%",

  coneLeft: "35%",
  coneTop: "75%",

  coneRotate: 105
},
    bang: {
      eventLeft: "40%", eventTop: "72%",
      coneLeft: "35%", coneTop: "75%",
      coneRotate: -15
    }
  };

  const pos = positions[selectedScenarioKey] || positions.scream;

  marker.style.left = pos.eventLeft;
  marker.style.top = pos.eventTop;

  doaOverlay.style.left = pos.coneLeft;
  doaOverlay.style.top = pos.coneTop;
  doaOverlay.style.transform =
    `translate(-50%, -50%) rotate(${pos.coneRotate}deg)`;
}

/* ---------- DECISION + LOGBOOK ---------- */

function makeDecision(decision) {
  currentDecision = decision;

  document.getElementById("modalTimestamp").textContent = currentScenario.timestamp;
  document.getElementById("modalDate").value = currentScenario.date;
  document.getElementById("modalDecision").textContent = decision;
  document.getElementById("modalAzimuth").textContent = currentScenario.bearing;
  document.getElementById("modalDoa").textContent = `(${currentScenario.doaShort})`;
  document.getElementById("operatorLabel").value = "";

  drawCompass();
  drawWaveforms();

  logbookModal.classList.remove("hidden");
}

function saveEvent() {
  const labelInput = document.getElementById("operatorLabel");
  const label = labelInput.value.trim();

  if (!label) {
    alert("Please enter an operator label before saving.");
    labelInput.focus();
    return;
  }

const entry = {
  time: document.getElementById("modalTimestamp").textContent || currentScenario.timestamp,
  date: currentScenario.date,
  label,
  type: currentScenario.type,
  camera: currentScenario.camera,
    doa: currentScenario.direction,
    distance: currentScenario.distance,
    confidence: currentScenario.confidence,
    decision: currentDecision,
   color:
  currentDecision === "Take Action"
    ? "red"
    : currentDecision === "Monitor"
    ? "amber"
    : "green",
    audio: currentScenario.audio
  };

  logbookEntries.unshift(entry);
  sortLogbookEntries();
  renderLogbook();
  renderFullLogbook();

  logbookModal.classList.add("hidden");
}

function renderLogbook() {
  const list = document.getElementById("logbookList");
  list.innerHTML = "";

  logbookEntries.forEach((entry, index) => {
    const li = document.createElement("li");

    if (entry.entryType === "note") {
      li.className = "lb-entry note-entry";

      li.innerHTML = `
        <div class="lb-dot note-dot"></div>

        <div class="lb-info">
          <div class="lb-time">${entry.time}</div>
          <div class="lb-type">NOTE: ${entry.label}</div>
          <div class="lb-meta">${entry.camera && entry.camera !== "—" ? entry.camera : ""}</div>
        </div>

        <button class="lb-note-btn" onclick="addNoteToEntry(${index})">
          ${entry.note ? "📝" : "🗒️"}
        </button>
      `;
    } else {
      li.className = "lb-entry";

      const decisionClass =
        entry.decision === "Take Action" ? "action" :
        entry.decision === "Monitor" ? "monitor" : "dismiss";

      li.innerHTML = `
        <div class="lb-dot" style="background:${getColor(entry.color)}"></div>

        <div class="lb-info">
          <div class="lb-time">${entry.time}</div>
          <div class="lb-type">${entry.label}</div>
          <div class="lb-meta">
            ${entry.camera || "Unknown Camera"} · ${entry.distance} · ${entry.doa}
          </div>
        </div>

        <div class="lb-decision ${decisionClass}">${entry.decision}</div>

        <button class="lb-note-btn" onclick="addNoteToEntry(${index})">
          ${entry.note ? "📝" : "🗒️"}
        </button>
      `;
    }

    list.appendChild(li);
  });

    updateQuickAssignOptions();
}

function renderFullLogbook(selectedId = null) {
  const list = document.getElementById("logbookFullList");
  const pageInfo = document.getElementById("lbPageInfo");
  const searchInput = document.getElementById("logbookSearchInput");
  const filterSelect = document.getElementById("logbookFilterSelect");

  if (!list || !pageInfo) return;

  const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const filterValue = filterSelect ? filterSelect.value : "all";
const isSearching = searchText.length > 0;

  let filteredEntries = logbookEntries.filter((entry) => {
    const text = `
      ${entry.time || ""}
      ${entry.date || ""}
      ${entry.label || ""}
      ${entry.camera || ""}
      ${entry.decision || ""}
      ${entry.doa || ""}
      ${entry.distance || ""}
      ${entry.note || ""}
    `.toLowerCase();

    const matchesSearch = text.includes(searchText);
    const matchesFilter =
  filterValue === "all" ||
  entry.decision === filterValue ||
  (filterValue === "NOTE" && entry.entryType === "note");

    return matchesSearch && matchesFilter;
  });

  const groupedByDate = {};

  filteredEntries.forEach((entry) => {
    const date = entry.date || "Unknown date";

    if (!groupedByDate[date]) {
      groupedByDate[date] = [];
    }

    groupedByDate[date].push(entry);
  });

  const dates = Object.keys(groupedByDate).sort((a, b) => {
    return getDateSortValue(b) - getDateSortValue(a);
  });

  if (selectedId) {
  const selectedEntry = logbookEntries.find(entry => entry.id === selectedId);

  if (selectedEntry) {
    const targetDate = selectedEntry.date;
    const targetIndex = dates.indexOf(targetDate);

    if (targetIndex !== -1) {
      logbookPageIndex = targetIndex;
    }
  }
}

if (logbookPageIndex >= dates.length) logbookPageIndex = dates.length - 1;
if (logbookPageIndex < 0) logbookPageIndex = 0;

  list.innerHTML = "";

  if (dates.length === 0) {
    list.innerHTML = `<div style="padding:20px;color:#777;">No matching events.</div>`;
    pageInfo.textContent = "PAGE 0 OF 0";
    return;
  }

  let pageEntries = [];

if (isSearching) {
  dates.forEach((date) => {
    pageEntries = pageEntries.concat(groupedByDate[date]);
  });
} else {
  const currentDate = dates[logbookPageIndex];
  pageEntries = groupedByDate[currentDate];

  const dateHeader = document.createElement("div");
  dateHeader.className = "lb-date-page-title";
  dateHeader.textContent = currentDate;
  list.appendChild(dateHeader);
}

  pageEntries.forEach((entry) => {
    const realIndex = logbookEntries.indexOf(entry);
    const row = document.createElement("div");

    row.className = "lb-full-entry";
    if (entry.id) row.dataset.entryId = entry.id;

    if (selectedId && entry.id === selectedId) {
      row.classList.add("selected-logbook-entry");
    }

    if (entry.entryType === "note") {
      row.innerHTML = `
        <div class="lb-full-time">
          <span class="lb-full-time-dot" style="background:${getColor(entry.color)}"></span>
          <span>${entry.time}<br>${entry.date}</span>
        </div>

        <div class="lb-full-audio">
          <span style="font-family:var(--font-mono); color:#777;">NO AUDIO</span>
        </div>

        <div class="lb-full-compass">—</div>

        <div class="lb-full-camera">
          ${entry.camera && entry.camera !== "—" ? entry.camera : "No camera"}
        </div>

        <div class="lb-label-row">
          <span class="lb-full-label-badge" style="border-color:${getColor(entry.color)}; color:${getColor(entry.color)}">
            NOTE
          </span>

          <button class="lb-note-btn" onclick="addNoteToEntry(${realIndex})">
            ${entry.note ? "📝" : "🗒️"}
          </button>
        </div>
      `;
    } else {
      row.innerHTML = `
        <div class="lb-full-time">
          <span class="lb-full-time-dot" style="background:${getColor(entry.color)}"></span>
          <span>${entry.time}<br>${entry.date}</span>
        </div>

        <div class="lb-full-audio">
          <button class="lb-full-play" onclick="playSavedAudio(${realIndex})">▶</button>
          <div class="lb-full-waveform">
            <canvas width="220" height="36" id="savedWave${realIndex}"></canvas>
          </div>
        </div>

        <div class="lb-full-compass">
          ${entry.doa || "—"}
        </div>

        <div class="lb-full-camera">
          ${entry.camera || "Unknown Camera"}
        </div>

        <div class="lb-label-row">
          <span class="lb-full-label-badge" style="border-color:${getColor(entry.color)}; color:${getColor(entry.color)}">
            ${entry.label}
          </span>

          <button class="lb-note-btn" onclick="addNoteToEntry(${realIndex})">
            ${entry.note ? "📝" : "🗒️"}
          </button>
        </div>
      `;

      setTimeout(() => drawSmallWave(`savedWave${realIndex}`, getColor(entry.color)), 0);
    }

    list.appendChild(row);
  });

pageInfo.textContent = isSearching
  ? `SEARCH RESULTS: ${pageEntries.length}`
  : `DAY ${logbookPageIndex + 1} OF ${dates.length}`;}

function getDateSortValue(dateString) {
  const parts = dateString.split("/").map(part => Number(part.trim()));

  if (parts.length !== 3) return 0;

  const day = parts[0];
  const month = parts[1];
  const year = parts[2];

  return new Date(year, month - 1, day).getTime();
}

function logbookPreviousPage() {
  if (logbookPageIndex > 0) {
    logbookPageIndex--;
    renderFullLogbook();
  }
}

function logbookNextPage() {
  const groupedByDate = groupFilteredLogbookByDate();
  const dates = Object.keys(groupedByDate);

  if (logbookPageIndex < dates.length - 1) {
    logbookPageIndex++;
    renderFullLogbook();
  }
}

function groupFilteredLogbookByDate() {
  const searchInput = document.getElementById("logbookSearchInput");
  const filterSelect = document.getElementById("logbookFilterSelect");

  const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const filterValue = filterSelect ? filterSelect.value : "all";

  const filteredEntries = logbookEntries.filter((entry) => {
    const text = `
      ${entry.time || ""}
      ${entry.date || ""}
      ${entry.label || ""}
      ${entry.camera || ""}
      ${entry.decision || ""}
      ${entry.doa || ""}
      ${entry.distance || ""}
      ${entry.note || ""}
    `.toLowerCase();

    const matchesSearch = text.includes(searchText);
    const matchesFilter =
      filterValue === "all" ||
      entry.decision === filterValue ||
      (filterValue === "NOTE" && entry.entryType === "note");

    return matchesSearch && matchesFilter;
  });

  const groupedByDate = {};

  filteredEntries.forEach((entry) => {
    const date = entry.date || "Unknown date";
    if (!groupedByDate[date]) groupedByDate[date] = [];
    groupedByDate[date].push(entry);
  });

  return groupedByDate;
}

function playSavedAudio(index) {
  const entry = logbookEntries[index];
  if (!entry || !entry.audio) return;

  videoAudio.pause();
  eventAudio.pause();
  eventAudio.src = entry.audio;
  eventAudio.currentTime = 0;
  eventAudio.play().catch(() => {});
}

function openLogbookView() {
  logbookPageIndex = 0;
  renderFullLogbook();
  logbookView.classList.remove("hidden");
}

function closeLogbookView() {
  logbookView.classList.add("hidden");
}

function cancelLogbook() {
  logbookModal.classList.add("hidden");
}

function resetLogbookForm() {
  document.getElementById("operatorLabel").value = "";
}

function resetToIdle() {
  vgpInterface.classList.add("hidden");
  idleScreen.classList.remove("hidden");

  eventAudio.pause();
  cameraVideo.pause();
  cameraVideoLarge.pause();
}

/* ---------- CAMERA CONTROLS ---------- */

function showAlertFlash() {
  const flash = document.getElementById("alertFlash");
  flash.classList.remove("hidden");

  setTimeout(() => {
    flash.classList.add("hidden");
  }, 500);
}

function toggleVideoPlay() {
  const btn = document.getElementById("playPauseBtn");

  if (cameraVideo.paused) {
    cameraVideo.play().catch(() => {});
    btn.textContent = "⏸ PAUSE";
  } else {
    cameraVideo.pause();
    btn.textContent = "▶ PLAY";
  }
}

function seekVideo(value) {
  if (!cameraVideo.duration) return;
  cameraVideo.currentTime = (value / 100) * cameraVideo.duration;
}

function updateVideoTime() {
  const seek = document.getElementById("videoSeek");
  const timeDisplay = document.getElementById("videoTimeDisp");

  if (!cameraVideo.duration) return;

  seek.value = (cameraVideo.currentTime / cameraVideo.duration) * 100;
  timeDisplay.textContent =
    `${formatTime(cameraVideo.currentTime)} / ${formatTime(cameraVideo.duration)}`;
}

function toggleCameraSize() {
  const overlay = document.getElementById("videoExpanded");

  if (overlay.classList.contains("hidden")) {
    cameraVideoLarge.src = cameraVideo.src;
    cameraVideoLarge.currentTime = cameraVideo.currentTime;
    overlay.classList.remove("hidden");
    cameraVideoLarge.play().catch(() => {});
  } else {
    overlay.classList.add("hidden");
    cameraVideoLarge.pause();
  }
}

function switchCamera(name, iconId) {
  document.getElementById("camLabel").textContent = name;

  document.querySelectorAll(".map-cam-icon").forEach((icon) => {
    icon.classList.remove("active-cam");
  });

  if (iconId) {
    document.getElementById(iconId)?.classList.add("active-cam");
  }

  let videoToShow = "";
  let positionToUse = "50% 50%";
  let shouldPlayAudio = false;

  // EVENT CAMERA
  if (currentScenario && iconId === currentScenario.cameraIcon) {
    videoToShow = currentScenario.video;
    positionToUse = currentScenario.videoPosition || "50% 50%";
    shouldPlayAudio = true;
  }

  // NORMAL CAMERA
  // NORMAL CAMERA
else {
  const cam = cameras[iconId];
  if (!cam) return;

  videoToShow = cam.video;
  positionToUse = cam.position || "50% 50%";

  // stop ALL scenario audio
  videoAudio.pause();
  videoAudio.src = "";
  videoAudio.currentTime = 0;

  eventAudio.pause();
  eventAudio.currentTime = 0;
}

  cameraVideo.src = videoToShow;
  cameraVideoLarge.src = videoToShow;

  cameraVideo.style.objectPosition = positionToUse;
  cameraVideoLarge.style.objectPosition = positionToUse;

  cameraVideo.load();

  cameraVideo.onloadeddata = () => {
    cameraVideo.classList.add("visible");
    document.getElementById("camNoSource").classList.add("hidden");

    cameraVideo.currentTime = 0;

    cameraVideo.play().then(() => {
      document.getElementById("playPauseBtn").textContent = "⏸ PAUSE";

  
    }).catch(() => {});
  };
}

/* ---------- DRAWING ---------- */

function drawWaveforms() {
  drawWave("waveCanvas", "#5b6aa8");
  drawWave("modalWaveCanvas", "#5b6aa8");
}

function drawWave(canvasId, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  const center = height / 2;
  ctx.beginPath();

  for (let x = 0; x < width; x += 4) {
    const amp = Math.sin(x * 0.15) * 12 + Math.sin(x * 0.41) * 7;
    ctx.moveTo(x, center - Math.abs(amp));
    ctx.lineTo(x, center + Math.abs(amp));
  }

  ctx.stroke();
}

function drawSmallWave(canvasId, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;

  const center = canvas.height / 2;

  for (let x = 0; x < canvas.width; x += 5) {
    const amp = Math.abs(Math.sin(x * 0.2) * 11 + Math.sin(x * 0.47) * 5);
    ctx.beginPath();
    ctx.moveTo(x, center - amp);
    ctx.lineTo(x, center + amp);
    ctx.stroke();
  }
}

function drawCompass() {
  const canvas = document.getElementById("compassCanvas");
  if (!canvas || !currentScenario) return;

  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const r = 42;

  ctx.clearRect(0, 0, w, h);

  ctx.strokeStyle = "#525f70";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = "#c8cdd6";
  ctx.font = "14px monospace";
  ctx.textAlign = "center";
  ctx.fillText("N", cx, cy - r - 8);
  ctx.fillText("S", cx, cy + r + 18);
  ctx.fillText("W", cx - r - 14, cy + 5);
  ctx.fillText("E", cx + r + 14, cy + 5);

  ctx.strokeStyle = "#6e7a8a";
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx, cy + r);
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx + r, cy);
  ctx.stroke();

  const angle = parseInt(currentScenario.bearing, 10) - 90;
  const rad = (angle * Math.PI) / 180;
  const ex = cx + Math.cos(rad) * r;
  const ey = cy + Math.sin(rad) * r;

  ctx.strokeStyle = "#5b6aa8";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(ex, ey);
  ctx.stroke();

  ctx.fillStyle = "#5b6aa8";
  ctx.beginPath();
  ctx.arc(ex, ey, 8, 0, Math.PI * 2);
  ctx.fill();
}

/* ---------- CLOCK + HELPERS ---------- */

function updateClocks() {
  const fixedTime = "23:14";

  const idleClock = document.getElementById("idleClock");
  const systemClock = document.getElementById("systemClock");

  if (idleClock) idleClock.textContent = fixedTime;
  if (systemClock) systemClock.textContent = fixedTime;
}

function startMeterAnimation() {
  const meter = document.getElementById("meterBar");

  setInterval(() => {
    if (!vgpInterface.classList.contains("hidden")) {
      meter.style.width = `${35 + Math.random() * 55}%`;
    }
  }, 120);
}

function formatTime(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${min}:${sec}`;
}

function getColor(color) {
  if (color === "red") return "#e63946";
  if (color === "amber") return "#f4a824";
  if (color === "green") return "#4caf7d";
  return "#5b9bd5";
}

/* ---------- KEYBOARD CONTROLS ---------- */

cameraVideo.addEventListener("timeupdate", updateVideoTime);

cameraVideo.addEventListener("play", () => {
  if (!currentScenario) return;
  if (!cameraVideo.src.includes(currentScenario.video)) return;

  videoAudio.currentTime = cameraVideo.currentTime;
  videoAudio.play().catch(() => {});
});

cameraVideo.addEventListener("pause", () => {
  videoAudio.pause();
});

cameraVideo.addEventListener("seeked", () => {
  if (!currentScenario) return;
  if (!cameraVideo.src.includes(currentScenario.video)) return;

  videoAudio.currentTime = cameraVideo.currentTime;
});

cameraVideo.addEventListener("ended", () => {
  cameraVideo.currentTime = 0;
  videoAudio.currentTime = 0;

  cameraVideo.play().catch(() => {});
  videoAudio.play().catch(() => {});
});


document.addEventListener("keydown", (event) => {
  const isTyping =
    event.target.tagName === "INPUT" ||
    event.target.tagName === "TEXTAREA";

  // Do nothing when user is typing in fields
  if (isTyping) return;

  // Only allow scenario keys on the setup screen
  const setupIsVisible = !setupScreen.classList.contains("hidden");

  if (setupIsVisible) {
    if (event.key === "1") selectScenario("scream");
    if (event.key === "2") selectScenario("door");
    if (event.key === "3") selectScenario("car");
    if (event.key === "4") selectScenario("bang");
  }

  // Keep reset key available, but not while typing
  if (event.key === "0") {
    clearTimeout(triggerTimer);
    selectedScenarioKey = null;
    currentScenario = null;

    setupScreen.classList.remove("hidden");
    idleScreen.classList.add("hidden");
    vgpInterface.classList.add("hidden");
    logbookModal.classList.add("hidden");
    logbookView.classList.add("hidden");
  }
});

function saveQuickNote() {
  const noteInput = document.getElementById("quickNoteInput");
  const cameraInput = document.getElementById("quickCameraInput");
  const assignSelect = document.getElementById("quickAssignSelect");

  const note = noteInput.value.trim();
  const camera = cameraInput ? cameraInput.value.trim() : "";
  const assignedIndex = assignSelect ? assignSelect.value : "";

  if (!note) {
    alert("Please write a quick note first.");
    noteInput.focus();
    return;
  }

  if (assignedIndex !== "") {
    logbookEntries[assignedIndex].note = note;
    renderLogbook();
    renderFullLogbook();

    noteInput.value = "";
    if (cameraInput) cameraInput.value = "";
    assignSelect.value = "";
    return;
  }

  const entry = {
    entryType: "note",
    time: document.getElementById("systemClock")?.textContent || "23:14",
    date: currentScenario ? currentScenario.date : "12 / 05 / 2025",
    label: note,
    camera: camera || "—",
    decision: "NOTE",
    color: "blue",
    audio: null
  };

  logbookEntries.unshift(entry);

  renderLogbook();
  renderFullLogbook();

  noteInput.value = "";
  if (cameraInput) cameraInput.value = "";
  if (assignSelect) assignSelect.value = "";
}

function updateQuickAssignOptions() {
  const assignSelect = document.getElementById("quickAssignSelect");
  if (!assignSelect) return;

  assignSelect.innerHTML = `<option value="">Standalone note</option>`;

  logbookEntries.forEach((entry, index) => {
    if (entry.entryType === "note") return;

    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${entry.time} - ${entry.label} - ${entry.camera || "Unknown Camera"}`;
    assignSelect.appendChild(option);
  });
}

function updateAudioDurationDisplay() {
  const modalAudioTime = document.getElementById("modalAudioTime");

  if (!modalAudioTime || !eventAudio.duration || isNaN(eventAudio.duration)) {
    if (modalAudioTime) modalAudioTime.textContent = "00:23";
    return;
  }

  modalAudioTime.textContent = formatAudioDuration(eventAudio.duration);
}

function formatAudioDuration(seconds) {
  const min = Math.floor(seconds / 60);
  const sec = Math.round(seconds % 60).toString().padStart(2, "0");
  return `${min.toString().padStart(2, "0")}:${sec}`;
}


function adjustModalTime(change) {
  const display = document.getElementById("modalTimestamp");
  if (!display) return;

  let [hours, minutes] = display.textContent.split(":").map(Number);

  minutes += change;

  if (minutes < 0) {
    minutes = 59;
    hours -= 1;
  }

  if (minutes > 59) {
    minutes = 0;
    hours += 1;
  }

  if (hours < 0) hours = 23;
  if (hours > 23) hours = 0;

  display.textContent =
    String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0");
}

function getEntrySortValue(entry) {
  const dateValue = entry.date.includes("12") ? 2 : 1;

  const [hours, minutes] = entry.time.split(":").map(Number);

  return dateValue * 24 * 60 + hours * 60 + minutes;
}

function createLogbookEntryFromTimelineItem(item) {
  let note = "";

if (item.id === "day1-2315") {
  note = "Source could not be identified.";
}

if (item.id === "day2-2314") {
  note = "Outdoor cinema showing horror/thriller film with scream audio.";
}

if (item.id === "day1-1420") {
  note = "Construction workers active near south entrance.";
}

if (item.id === "day1-2045") {
  note = "Delivery vehicle entered west parking area.";
}

if (item.id === "day2-0640") {
  note = "Emergency siren heard from nearby main road.";
}

if (item.id === "day2-1740") {
  note = "Footsteps detected during routine cleaning shift.";
}

if (item.id === "day3-1200") {
  note = "Possible ambulance passing perimeter road.";
}

if (item.id === "yesterday-1645") {
  note = "Metal impact linked to maintenance activity.";
}

if (item.id === "today-0310") {
  note = "Vehicle sound repeated multiple times within 10 minutes.";
}

if (item.id === "today-1432") {
  note = "Construction noise confirmed by operator.";
}

  // NIGHTLY REPEATED SCREAM
  if (item.status === "Scream") {
    return {
      id: item.id,
      entryType: "timeline",
      time: item.displayTime,
      date: item.date,
      label: "SCREAM",
      type: "Scream",
      camera: "CAM 06 - South Area",
      doa: "180° (S)",
      distance: "95 m",
      confidence: "62%",
      decision: "Monitor",
      color: "amber",
      audio: "assets/soloScream.mp3",
      note: note
    };
  }

  // NORMAL EVENTS
  return {
    id: item.id,
    entryType: "timeline",
    time: item.displayTime,
    date: item.date,

   label:
  item.eventType === "footsteps" ? "FOOTSTEPS" :
  item.eventType === "construction" ? "CONSTRUCTION" :
  item.eventType === "sirene" ? "SIREN" :
  item.eventType === "vehicle" ? "VEHICLE" :
  item.eventType === "door" ? "DOOR SLAM" :
  item.eventType === "gate" ? "GATE" :
  item.eventType === "scream" ? "SCREAM" :
  "UNKNOWN",

type:
  item.eventType === "footsteps" ? "FOOTSTEPS" :
  item.eventType === "construction" ? "CONSTRUCTION NOISE" :
  item.eventType === "sirene" ? "SIREN" :
  item.eventType === "vehicle" ? "VEHICLE" :
  item.eventType === "door" ? "DOOR SLAM" :
  item.eventType === "gate" ? "GATE IMPACT" :
  item.eventType === "scream" ? "SCREAM" :
  "UNKNOWN",

    camera:
      item.status === "critical" ? "CAM 05 - Parking Lot" :
      item.status === "amber" ? "CAM 04 - West Entrance" :
      "CAM 03 - Central",

    doa:
      item.status === "critical" ? "045° (NE)" :
      item.status === "amber" ? "270° (W)" :
      "000° (N)",

    distance:
      item.status === "critical" ? "80 m" :
      item.status === "amber" ? "200 m" :
      "120 m",

    confidence:
      item.status === "critical" ? "84%" :
      item.status === "amber" ? "78%" :
      "67%",

    decision:
      item.status === "critical" ? "Take Action" :
      item.status === "amber" ? "Monitor" :
      "Dismiss",

    color:
      item.status === "critical" ? "red" :
      item.status === "amber" ? "amber" :
      "green",

    audio:
      item.status === "critical" ? "assets/scream.mp3" :
      item.status === "amber" ? "assets/car.mp3" :
      "assets/door_slam.mp3",

    note: note
  };
}

function getEntrySortValue(entry) {
  const dayValue = entry.date.includes("12 / 05 / 2025") ? 2 : 1;
  const [hours, minutes] = entry.time.split(":").map(Number);
  return dayValue * 24 * 60 + hours * 60 + minutes;
}

function sortLogbookEntries() {
  logbookEntries.sort((a, b) => getEntrySortValue(b) - getEntrySortValue(a));
}

function openLogbookEntryFromTimeline(entryId) {
  addTimelineEventsToLogbook();

  renderFullLogbook(entryId);
  logbookView.classList.remove("hidden");

  setTimeout(() => {
    const row = document.querySelector(`[data-entry-id="${entryId}"]`);
    if (row) {
      row.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, 80);
}

let activeNoteEntryIndex = null;

function addNoteToEntry(index) {
  activeNoteEntryIndex = index;

  const entry = logbookEntries[index];
  if (!entry) return;

  document.getElementById("entryNoteInput").value = entry.note || "";
  document.getElementById("entryNoteModal").classList.remove("hidden");
}

function closeEntryNoteModal() {
  document.getElementById("entryNoteModal").classList.add("hidden");
  activeNoteEntryIndex = null;
}

function saveEntryNote() {
  if (activeNoteEntryIndex === null) return;

  const entry = logbookEntries[activeNoteEntryIndex];
  const noteText = document.getElementById("entryNoteInput").value.trim();

  entry.note = noteText;

  renderLogbook();
  renderFullLogbook();
  closeEntryNoteModal();
}

function deleteEntryNote() {
  if (activeNoteEntryIndex === null) return;

  logbookEntries[activeNoteEntryIndex].note = "";

  renderLogbook();
  renderFullLogbook();
  closeEntryNoteModal();
}

/* ---------- LAYOUT ---------- */

let leftWidth = 280;
let rightWidth = 260;
let currentLayout = "default";
let resizingSide = null;

function toggleLayoutMenu() {
  const menu = document.getElementById("layoutMenu");
  if (!menu) return;
  menu.classList.toggle("hidden");
}

function setupResizeHandles() {
  const grid = document.querySelector(".main-grid");
  const left = document.querySelector(".left-panel");
  const center = document.querySelector(".center-panel");
  const right = document.querySelector(".right-panel");

  if (!grid || !left || !center || !right) return;

  if (!document.getElementById("resizeLeft")) {
    const resizeLeft = document.createElement("div");
    resizeLeft.id = "resizeLeft";
    resizeLeft.className = "resize-handle";

    const resizeRight = document.createElement("div");
    resizeRight.id = "resizeRight";
    resizeRight.className = "resize-handle";

    grid.innerHTML = "";
    grid.appendChild(left);
    grid.appendChild(resizeLeft);
    grid.appendChild(center);
    grid.appendChild(resizeRight);
    grid.appendChild(right);

    resizeLeft.addEventListener("mousedown", () => {
      resizingSide = "left";
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    });

    resizeRight.addEventListener("mousedown", () => {
      resizingSide = "right";
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    });
  }

  document.addEventListener("mousemove", (e) => {
    if (!resizingSide) return;

    const rect = grid.getBoundingClientRect();

    if (resizingSide === "left") {
      leftWidth = e.clientX - rect.left;
      leftWidth = Math.max(180, Math.min(520, leftWidth));
    }

    if (resizingSide === "right") {
      rightWidth = rect.right - e.clientX;
      rightWidth = Math.max(180, Math.min(520, rightWidth));
    }

    applyLayout();
  });

  document.addEventListener("mouseup", () => {
    resizingSide = null;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  });
}

function setLayout(layout) {
  currentLayout = layout;

  if (layout === "default") {
    leftWidth = 280;
    rightWidth = 260;
  }

  if (layout === "mapFocus") {
    leftWidth = 200;
    rightWidth = 200;
  }

  if (layout === "cameraFocus") {
    leftWidth = 420;
    rightWidth = 220;
  }

  if (layout === "logbookFocus") {
    leftWidth = 220;
    rightWidth = 420;
  }

  applyLayout();

  const menu = document.getElementById("layoutMenu");
  if (menu) menu.classList.add("hidden");
}

function applyLayout() {
  const grid = document.querySelector(".main-grid");
  const left = document.querySelector(".left-panel");
  const center = document.querySelector(".center-panel");
  const right = document.querySelector(".right-panel");
  const resizeLeft = document.getElementById("resizeLeft");
  const resizeRight = document.getElementById("resizeRight");

  if (!grid || !left || !center || !right) return;

  left.style.display = "";
  center.style.display = "";
  right.style.display = "";

  if (resizeLeft) resizeLeft.style.display = "";
  if (resizeRight) resizeRight.style.display = "";

  if (currentLayout === "mapOnly") {
    left.style.display = "none";
    right.style.display = "none";

    if (resizeLeft) resizeLeft.style.display = "none";
    if (resizeRight) resizeRight.style.display = "none";

    grid.style.gridTemplateColumns = "1fr";
    return;
  }

  grid.style.gridTemplateColumns =
    `${leftWidth}px 6px minmax(300px, 1fr) 6px ${rightWidth}px`;
}


let mapZoom = 1;

function setActiveMapTool(index) {
  const tools = document.querySelectorAll(".map-tool");
  tools.forEach(tool => tool.classList.remove("active"));
  if (tools[index]) tools[index].classList.add("active");
}

function showPlainMap() {
  document.getElementById("plainMap").classList.remove("hidden-map");
  document.getElementById("satelliteMap").classList.add("hidden-map");
  setActiveMapTool(0);
}

function showSatelliteMap() {
  document.getElementById("plainMap").classList.add("hidden-map");
  document.getElementById("satelliteMap").classList.remove("hidden-map");
  setActiveMapTool(1);
}

function toggleCameraList() {
  document.getElementById("cameraListPanel").classList.toggle("hidden");
  setActiveMapTool(2);
}

function zoomMap(change) {
  mapZoom += change;
  mapZoom = Math.max(1, Math.min(2.2, mapZoom));

  const layer = document.getElementById("mapZoomLayer");
  if (layer) {
    layer.style.transform = `scale(${mapZoom})`;
  }
}

const cameras = {
  camIcon01: { name: "CAM 01 - Main Gate", video: "assets/MainEntrance.mp4", position: "50% 50%" },
  camIcon02: { name: "CAM 02 - North Perimeter", video: "assets/construction.mp4", position: "50% 50%" },
  camIcon03: { name: "CAM 03 - Central", video: "assets/busy street.mp4", position: "50% 50%" },
  camIcon04: { name: "CAM 04 - West Entrance", video: "assets/parking lot2.mp4", position: "50% 50%" },
  camIcon05: { name: "CAM 05 - Parking Lot", video: "assets/parking lot.mp4", position: "50% 50%" },
  camIcon06: { name: "CAM 06 - South Area", video: "assets/cam06.mp4", position: "50% 50%" }
};

const videoAudio = document.getElementById("videoAudio");


eventAudio.addEventListener("loadedmetadata", updateAudioDurationDisplay);
/* ---------- STARTUP ---------- */

updateClocks();
setupResizeHandles();
applyLayout();
startMeterAnimation();
timelinePage = timelinePages.length - 1;
renderTimeline();
renderFullLogbook();
