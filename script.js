/* 情绪点歌机 Mood Player
 * - 选心情 → 随机点歌
 * - 主题切换：颜色 + 背景粒子动效
 * - 每个心情独立“页面”：index.html?mood=relax | heartbreak | hype | quiet（或 #relax 等）
 * - 刷新：无 mood 时回首页；有 ?mood= 或 #mood 时打开对应心情页
 */

// 音频路径：GitHub Pages 会部署在子路径（如 /repo-name/），需用当前路径拼出 URL
function getAssetPath(filename) {
  const base = location.pathname.replace(/\/[^/]*$/, "") || ".";
  return base === "." ? filename : base + "/" + filename;
}
const TRACK_FILE = "chill 01.mp3";
const TRACK_URL = getAssetPath(TRACK_FILE);

const MOODS = {
  relax: {
    tag: "😌 リラックス",
    copy: ["肩の力を抜いて、深呼吸しよう。", "今日もおつかれさま。少し休もう。", "休みたいあなたに、この一曲を。"],
    particles: { speed: 0.35, drift: 0.25, size: [1.2, 3.2], count: 56 },
    tracks: [{ title: "夜に溶けるまま", url: getAssetPath(TRACK_FILE) }],
  },
  hype: {
    tag: "🔥 ハイプ",
    copy: ["音量を少し上げよう。", "今日はあなたが主役。", "鼓動のカウントでいこう、3・2・1。"],
    particles: { speed: 1.25, drift: 0.42, size: [1.4, 4.2], count: 92 },
    tracks: [{ title: "夜に溶けるまま", url: getAssetPath(TRACK_FILE) }],
  },
  quiet: {
    tag: "🌧 静か",
    copy: ["静かな時間も悪くない。", "この一曲が、そっと寄り添う。", "言葉はいらない、音楽がわかってくれる。"],
    particles: { speed: 0.45, drift: 0.14, size: [1.0, 2.8], count: 64 },
    tracks: [{ title: "夜に溶けるまま", url: getAssetPath(TRACK_FILE) }],
  },
  fun: {
    tag: "🎉 楽し",
    copy: [
      "今日はクールより、楽しさ優先。",
      "好きな人と笑う時間がいちばん効く。",
      "この曲は、ノって跳ねるためにある。"
    ],
    particles: { speed: 0.9, drift: 0.36, size: [1.4, 3.6], count: 88 },
    tracks: [{ title: "夜に溶けるまま", url: getAssetPath(TRACK_FILE) }],
  },
};

const STORAGE_KEY = "mood-player:lastMood";

/* Firebase 配置（用于登录系统）。チャット/友だち模块仍是旧 Supabase 逻辑，暂未迁移。 */
const FIREBASE_CONFIG = window.MOOD_PLAYER_FIREBASE || {};
/* 保留旧常量，确保未迁移的 Supabase チャット/友だち代码继续安全降级为不可用状态。 */
const SUPABASE_CONFIG = { url: "", anonKey: "" };
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;

const CHAT_USER_KEY = "mood-player:chatUserId";
const CHAT_NAME_KEY = "mood-player:chatUserName";

const els = {
  bgCanvas: document.getElementById("bgCanvas"),
  panel: document.querySelector(".panel"),
  burst: document.getElementById("burst"),
  pickLeft: document.getElementById("pickLeft"),
  pickRight: document.getElementById("pickRight"),
  playerLeft: document.getElementById("playerLeft"),
  playerRight: document.getElementById("playerRight"),
  trackList: document.getElementById("trackList"),
  playlistSub: document.getElementById("playlistSub"),
  leftPill: document.getElementById("leftPill"),
  moodTag: document.getElementById("moodTag"),
  moodCopy: document.getElementById("moodCopy"),
  trackTitle: document.getElementById("trackTitle"),
  playBtn: document.getElementById("playBtn"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  repeatBtn: document.getElementById("repeatBtn"),
  shuffleBtn: document.getElementById("shuffleBtn"),
  volumeMute: document.getElementById("volumeMute"),
  volumeSlider: document.getElementById("volumeSlider"),
  progressBar: document.getElementById("progressBar"),
  chatBtn: document.getElementById("chatBtn"),
  chatPanel: document.getElementById("chatPanel"),
  chatClose: document.getElementById("chatClose"),
  chatLoadMore: document.getElementById("chatLoadMore"),
  chatMessages: document.getElementById("chatMessages"),
  chatInput: document.getElementById("chatInput"),
  chatSend: document.getElementById("chatSend"),
  chatUserMenu: document.getElementById("chatUserMenu"),
  chatMenuAddFriend: document.getElementById("chatMenuAddFriend"),
  chatMenuViewProfile: document.getElementById("chatMenuViewProfile"),
  chatUserProfileCard: document.getElementById("chatUserProfileCard"),
  chatUserProfileClose: document.getElementById("chatUserProfileClose"),
  chatUserProfileAvatar: document.getElementById("chatUserProfileAvatar"),
  chatUserProfileName: document.getElementById("chatUserProfileName"),
  chatUserProfileBio: document.getElementById("chatUserProfileBio"),
  backLink: document.getElementById("backLink"),
  backBtn: document.getElementById("backBtn"),
  resetBtn: document.getElementById("resetBtn"),
  shareBtn: document.getElementById("shareBtn"),
  resetBtn2: document.getElementById("resetBtn2"),
  shareBtn2: document.getElementById("shareBtn2"),
  progressInner: document.getElementById("progressInner"),
  timeNow: document.getElementById("timeNow"),
  timeDur: document.getElementById("timeDur"),
  detailArtist: document.getElementById("detailArtist"),
  detailAlbum: document.getElementById("detailAlbum"),
  detailTime: document.getElementById("detailTime"),
  audio: document.getElementById("audio"),
  loginBtn: document.getElementById("loginBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  userInfo: document.getElementById("userInfo"),
  userName: document.getElementById("userName"),
  hamburgerMenu: document.getElementById("hamburgerMenu"),
  userMenu: document.getElementById("userMenu"),
  homeBtn: document.getElementById("homeBtn"),
  myPageBtn: document.getElementById("myPageBtn"),
  friendChatBtn: document.getElementById("friendChatBtn"),
  backToHomeBtn: document.getElementById("backToHomeBtn"),
  authModal: document.getElementById("authModal"),
  authClose: document.getElementById("authClose"),
  authTabLogin: document.getElementById("authTabLogin"),
  authTabSignup: document.getElementById("authTabSignup"),
  authFormLogin: document.getElementById("authFormLogin"),
  authFormSignup: document.getElementById("authFormSignup"),
  loginEmail: document.getElementById("loginEmail"),
  loginPassword: document.getElementById("loginPassword"),
  loginSubmit: document.getElementById("loginSubmit"),
  loginError: document.getElementById("loginError"),
  signupEmail: document.getElementById("signupEmail"),
  signupPassword: document.getElementById("signupPassword"),
  signupName: document.getElementById("signupName"),
  signupSubmit: document.getElementById("signupSubmit"),
  signupError: document.getElementById("signupError"),
  userLeft: document.getElementById("userLeft"),
  userRight: document.getElementById("userRight"),
  userName: document.getElementById("userName"),
  userEmail: document.getElementById("userEmail"),
  profileName: document.getElementById("profileName"),
  profileBioText: document.getElementById("profileBioText"),
  profileAvatarImg: document.getElementById("profileAvatarImg"),
  profileAvatarFallback: document.getElementById("profileAvatarFallback"),
  profileEditName: document.getElementById("profileEditName"),
  profileEditBio: document.getElementById("profileEditBio"),
  profileAvatarUrl: document.getElementById("profileAvatarUrl"),
  profileSaveBtn: document.getElementById("profileSaveBtn"),
  profileSaveMsg: document.getElementById("profileSaveMsg"),
  profileNewPassword: document.getElementById("profileNewPassword"),
  profileConfirmPassword: document.getElementById("profileConfirmPassword"),
  profilePasswordBtn: document.getElementById("profilePasswordBtn"),
  profilePasswordMsg: document.getElementById("profilePasswordMsg"),
  friendCount: document.getElementById("friendCount"),
  searchFriend: document.getElementById("searchFriend"),
  searchFriendBtn: document.getElementById("searchFriendBtn"),
  searchResults: document.getElementById("searchResults"),
  friendRequests: document.getElementById("friendRequests"),
  requestCount: document.getElementById("requestCount"),
  friendsList: document.getElementById("friendsList"),
  friendChatModal: document.getElementById("friendChatModal"),
  friendChatClose: document.getElementById("friendChatClose"),
  friendChatFriendsList: document.getElementById("friendChatFriendsList"),
  friendChatTargetName: document.getElementById("friendChatTargetName"),
  friendChatMessages: document.getElementById("friendChatMessages"),
  friendChatInput: document.getElementById("friendChatInput"),
  friendChatSend: document.getElementById("friendChatSend"),
};

let state = {
  mood: null,
  currentTrack: null,
  trackHistory: [],
  repeatMode: "off",
  shuffle: false,
  volumeBeforeMute: 1,
  canChat: false,
  chatRoomId: null,
  user: null,
  friends: [],
  friendUsers: [],
  friendRequests: [],
  profile: null,
};

/* ---------------------------
 * UI：切屏
 * --------------------------- */
function showPick() {
  els.playerLeft?.classList.remove("view--active");
  els.playerRight?.classList.remove("view--active");
  els.userLeft?.classList.remove("view--active");
  els.userRight?.classList.remove("view--active");
  els.pickLeft?.classList.add("view--active");
  els.pickRight?.classList.add("view--active");
  document.body.classList.add("is-index");
  document.body.classList.remove("is-player");
  document.body.classList.remove("is-user");
  document.body.classList.remove("is-playing");
  bgFX.setBreathing(false);
}

function showPlayer() {
  els.pickLeft?.classList.remove("view--active");
  els.pickRight?.classList.remove("view--active");
  els.userLeft?.classList.remove("view--active");
  els.userRight?.classList.remove("view--active");
  els.playerLeft?.classList.add("view--active");
  els.playerRight?.classList.add("view--active");
  document.body.classList.remove("is-index");
  document.body.classList.remove("is-user");
  document.body.classList.add("is-player");
  bgFX.setBreathing(true);
}

function showUserPage() {
  if (!state.user) {
    openAuthModal("login");
    return;
  }
  els.pickLeft?.classList.remove("view--active");
  els.pickRight?.classList.remove("view--active");
  els.playerLeft?.classList.remove("view--active");
  els.playerRight?.classList.remove("view--active");
  els.userLeft?.classList.add("view--active");
  els.userRight?.classList.add("view--active");
  document.body.classList.remove("is-index");
  document.body.classList.remove("is-player");
  document.body.classList.add("is-user");
  bgFX.setBreathing(false);
  loadUserProfile();
  loadFriends();
  loadFriendRequests();
}

function mountTopNavEveryPage() {
  const rightPanel = document.querySelector(".deck__right");
  const topNav = document.querySelector(".indexTopNav");
  if (!rightPanel || !topNav) return;
  if (topNav.parentElement !== rightPanel) {
    rightPanel.insertBefore(topNav, rightPanel.firstChild);
  }
  rightPanel.classList.add("deck__right--hasGlobalNav");
}

/* ---------------------------
 * 业务：选心情 & 点歌
 * --------------------------- */
function setMood(moodKey, { autoplay = true, pushUrl = true, burst = true, burstOrigin = null } = {}) {
  if (!MOODS[moodKey]) return;

  state.mood = moodKey;
  document.body.setAttribute("data-mood", moodKey);
  document.body.classList.remove("is-index");
  localStorage.setItem(STORAGE_KEY, moodKey);

  els.moodTag.textContent = MOODS[moodKey].tag;
  els.moodCopy.textContent = pickRandom(MOODS[moodKey].copy);
  if (els.playlistSub) els.playlistSub.textContent = `気分: ${MOODS[moodKey].tag}`;
  if (els.leftPill) els.leftPill.textContent = "再生中";
  if (els.detailArtist) els.detailArtist.textContent = "気分プレーヤー";
  if (els.detailAlbum) els.detailAlbum.textContent = `アルバム: ${moodKey.toUpperCase()} セッション`;

  if (pushUrl) setUrlMood(moodKey);
  bgFX.setPreset(moodKey);

  if (burst) runEnterBurst(burstOrigin);

  renderTrackList();

  // 每次切 mood 自动换一首（进入时音乐淡入）
  pickTrack({ autoplay, fadeIn: true });
  showPlayer();
}

function getCurrentTrackIndex() {
  const mood = MOODS[state.mood];
  if (!mood || !state.currentTrack) return -1;
  return mood.tracks.findIndex((t) => t.url === state.currentTrack.url);
}

function goNext({ autoplay = true, fadeIn = false } = {}) {
  const mood = MOODS[state.mood];
  if (!mood) return;
  const tracks = mood.tracks;
  if (tracks.length === 0) return;

  let next;
  if (state.shuffle && tracks.length > 1) {
    const prevUrl = state.currentTrack?.url;
    for (let i = 0; i < 8; i++) {
      const candidate = pickRandom(tracks);
      if (candidate.url !== prevUrl) {
        next = candidate;
        break;
      }
    }
    next = next || tracks[(getCurrentTrackIndex() + 1) % tracks.length];
  } else {
    const idx = getCurrentTrackIndex();
    next = tracks[(idx + 1) % tracks.length];
  }

  state.currentTrack = next;
  state.trackHistory.push({ mood: state.mood, url: next.url, at: Date.now() });

  const willCrossfade = !fadeIn && !els.audio.paused && !prefersReducedMotion();
  if (willCrossfade) {
    fadeAudio(els.audio, 1, 0, 180).then(() => {
      loadTrack(next, { autoplay, fadeIn: false });
      fadeAudio(els.audio, 0, 1, 220);
    });
  } else {
    loadTrack(next, { autoplay, fadeIn });
  }
}

function goPrev({ autoplay = true } = {}) {
  const mood = MOODS[state.mood];
  if (!mood) return;
  const tracks = mood.tracks;
  if (tracks.length === 0) return;

  const idx = getCurrentTrackIndex();
  const prevIndex = idx <= 0 ? tracks.length - 1 : idx - 1;
  const next = tracks[prevIndex];

  state.currentTrack = next;
  state.trackHistory.push({ mood: state.mood, url: next.url, at: Date.now() });

  const willCrossfade = !els.audio.paused && !prefersReducedMotion();
  if (willCrossfade) {
    fadeAudio(els.audio, 1, 0, 180).then(() => {
      loadTrack(next, { autoplay, fadeIn: false });
      fadeAudio(els.audio, 0, 1, 220);
    });
  } else {
    loadTrack(next, { autoplay, fadeIn: false });
  }
}

function pickTrack({ autoplay = true, fadeIn = false } = {}) {
  const mood = MOODS[state.mood];
  if (!mood) return;

  const tracks = mood.tracks;
  const prevUrl = state.currentTrack?.url;
  let next = null;

  if (tracks.length <= 1) {
    next = tracks[0];
  } else if (state.shuffle) {
    for (let i = 0; i < 8; i++) {
      const candidate = pickRandom(tracks);
      if (candidate.url !== prevUrl) {
        next = candidate;
        break;
      }
    }
    next = next || tracks[(tracks.findIndex((t) => t.url === prevUrl) + 1) % tracks.length];
  } else {
    const idx = getCurrentTrackIndex();
    next = tracks[(idx + 1) % tracks.length];
  }

  state.currentTrack = next;
  state.trackHistory.push({ mood: state.mood, url: next.url, at: Date.now() });

  const willCrossfade = !fadeIn && !els.audio.paused && !prefersReducedMotion();
  if (willCrossfade) {
    fadeAudio(els.audio, 1, 0, 180).then(() => {
      loadTrack(next, { autoplay, fadeIn: false });
      fadeAudio(els.audio, 0, 1, 220);
    });
  } else {
    loadTrack(next, { autoplay, fadeIn });
  }
}

function loadTrack(track, { autoplay = true, fadeIn = false } = {}) {
  try {
    chatLeaveRoom();
  } catch (_) {}
  els.trackTitle.textContent = normalizeTrackTitle(track.title);
  els.audio.src = track.url || "";
  els.audio.currentTime = 0;
  if (els.progressInner) els.progressInner.style.width = "0%";
  els.timeNow.textContent = "0:00";
  els.timeDur.textContent = "0:00";
  if (els.detailTime) els.detailTime.textContent = "—";
  setPlayBtn(false);
  highlightCurrentTrack();

  if (autoplay) {
    if (fadeIn) {
      els.audio.volume = 0;
    } else {
      els.audio.volume = 1;
    }
    const p = els.audio.play();
    if (p && typeof p.then === "function") {
      p.then(() => {
        setPlayBtn(true);
        if (fadeIn) fadeAudio(els.audio, 0, 1, 680);
      }).catch(() => {
        setPlayBtn(false);
        els.audio.volume = 1;
      });
    }
  }
  try {
    chatJoinRoom();
  } catch (_) {}
}

function togglePlay() {
  if (!state.currentTrack) return;
  if (els.audio.paused) {
    if (els.audio.volume < 0.1) els.audio.volume = 1;
    els.audio
      .play()
      .then(() => setPlayBtn(true))
      .catch(() => setPlayBtn(false));
  } else {
    els.audio.pause();
    setPlayBtn(false);
  }
}

function setPlayBtn(isPlaying) {
  if (!els.playBtn) return;
  els.playBtn.classList.toggle("is-playing", Boolean(isPlaying));
  const label = isPlaying ? "暂停" : "播放";
  const textEl = els.playBtn.querySelector(".btn__text");
  if (textEl) textEl.textContent = "";
  els.playBtn.setAttribute("aria-label", label);
}

function updateVolumeButtonIcon(volume) {
  if (!els.volumeMute) return;
  const v = Number(volume);
  const level = v <= 0 ? "mute" : v < 0.5 ? "low" : "high";
  els.volumeMute.setAttribute("data-volume-level", level);
}

function updateRepeatButtonIcon(mode) {
  if (!els.repeatBtn) return;
  els.repeatBtn.setAttribute("data-repeat-mode", mode === "one" ? "one" : "all");
}

/* ---------------------------
 * URL：分享 / 直达
 * --------------------------- */
function setUrlMood(moodKey) {
  const url = new URL(window.location.href);
  url.searchParams.set("mood", moodKey);
  url.hash = moodKey;
  history.replaceState({}, "", url);
}

function getUrlMood() {
  const url = new URL(window.location.href);
  const fromQuery = url.searchParams.get("mood");
  if (fromQuery && MOODS[fromQuery]) return fromQuery;
  const hash = (window.location.hash || "").replace(/^#/, "").trim();
  if (hash && MOODS[hash]) return hash;
  return null;
}

async function copyShareLink() {
  const url = new URL(window.location.href);
  if (state.mood) url.searchParams.set("mood", state.mood);
  const text = url.toString();

  try {
    await navigator.clipboard.writeText(text);
    toast("已复制链接");
  } catch {
    // 回退：prompt 让ユーザー手动复制
    window.prompt("复制这个链接：", text);
  }
}

/* ---------------------------
 * 进度条 & 时间
 * --------------------------- */
function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function syncProgress() {
  const dur = els.audio.duration || 0;
  const cur = els.audio.currentTime || 0;
  if (dur > 0) {
    if (els.progressInner) els.progressInner.style.width = `${Math.min(100, (cur / dur) * 100)}%`;
    els.timeDur.textContent = formatTime(dur);
    if (els.detailTime) els.detailTime.textContent = `${formatTime(cur)} / ${formatTime(dur)}`;
  } else {
    if (els.progressInner) els.progressInner.style.width = "0%";
    els.timeDur.textContent = "0:00";
    if (els.detailTime) els.detailTime.textContent = "—";
  }
  els.timeNow.textContent = formatTime(cur);
}

/* ---------------------------
 * 背景：轻量粒子（不依赖库）
 * --------------------------- */
function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

const bgFX = (() => {
  const canvas = els.bgCanvas;
  const ctx = canvas.getContext("2d", { alpha: true });
  let raf = 0;
  let w = 0;
  let h = 0;
  let dpr = 1;
  let particles = [];
  let preset = "relax";
  let breathing = false;

  function resize() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    w = Math.floor(window.innerWidth);
    h = Math.floor(window.innerHeight);
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    rebuild();
  }

  function rebuild() {
    const p = MOODS[preset]?.particles || MOODS.relax.particles;
    const count = prefersReducedMotion() ? Math.floor(p.count * 0.35) : p.count;
    particles = new Array(count).fill(0).map(() => spawnOne(p));
  }

  function spawnOne(p) {
    const [smin, smax] = p.size;
    const r = rand(smin, smax);
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r,
      vx: rand(-p.drift, p.drift),
      vy: rand(p.speed * 0.4, p.speed * 1.1),
      a: rand(0.05, 0.14),
      tw: rand(0.2, 0.9),
    };
  }

  function tick() {
    raf = requestAnimationFrame(tick);
    ctx.clearRect(0, 0, w, h);

    // 让粒子颜色随主题变一点点（用当前 CSS 变量读取）
    const accent = getCssVar("--accent") || "#74b9ff";
    const accent2 = getCssVar("--accent-2") || "#00f5d4";

    const grad = ctx.createRadialGradient(w * 0.2, h * 0.2, 10, w * 0.2, h * 0.2, Math.max(w, h));
    grad.addColorStop(0, withAlpha(accent, 0.10));
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    for (const pt of particles) {
      pt.x += pt.vx;
      pt.y += pt.vy;
      if (breathing) pt.tw += 0.02;

      // 环绕
      if (pt.y - pt.r > h) pt.y = -pt.r;
      if (pt.x - pt.r > w) pt.x = -pt.r;
      if (pt.x + pt.r < 0) pt.x = w + pt.r;

      const pulse = breathing ? 0.5 + 0.5 * Math.sin(pt.tw) : 0.22;
      const alpha = pt.a * (0.65 + pulse * 0.6);

      const g = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, pt.r * 6);
      g.addColorStop(0, withAlpha(accent2, alpha));
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.r * 3.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function setPreset(nextPreset) {
    preset = nextPreset;
    rebuild();
  }

  function setBreathing(next) {
    breathing = Boolean(next);
  }

  function start() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  function stop() {
    cancelAnimationFrame(raf);
  }

  window.addEventListener("resize", resize, { passive: true });

  return { start, stop, resize, setPreset, setBreathing };
})();

function getCssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function withAlpha(hex, a) {
  // hex like #rrggbb
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return `rgba(255,255,255,${a})`;
  const r = parseInt(m[1], 16);
  const g = parseInt(m[2], 16);
  const b = parseInt(m[3], 16);
  return `rgba(${r},${g},${b},${a})`;
}

function rand(min, max) {
  return min + Math.random() * (max - min);
}

/* ---------------------------
 * 小工具：淡入淡出 / 随机 / toast
 * --------------------------- */
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function parseTrackTitle(url, index) {
  try {
    const raw = decodeURIComponent(String(url).split("/").pop()?.split("?")[0] || "");
    const base = raw.replace(/\.mp3$/i, "").replaceAll("_", " ").trim();
    return normalizeTrackTitle(base || `Track ${index + 1}`);
  } catch (_) {
    return normalizeTrackTitle(`Track ${index + 1}`);
  }
}

function normalizeTrackTitle(title) {
  const t = String(title || "").trim();
  if (!t) return "";
  return t.replace(/^(title|タイトル)\s*[:：-]?\s*/i, "").trim();
}

async function loadTracksFromTxt() {
  const moodTxtMap = {
    relax: "chill.txt",
    hype: "EDM.txt",
    quiet: "slow.txt",
    fun: "happy.txt",
  };

  const loadOneMood = async (moodKey, filename) => {
    try {
      const res = await fetch(getAssetPath(filename), { cache: "no-store" });
      if (!res.ok) return;
      const text = await res.text();
      const urls = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => /^https?:\/\//i.test(line) && /\.mp3(\?|$)/i.test(line));
      if (!urls.length) return;
      MOODS[moodKey].tracks = urls.map((url, i) => ({
        title: parseTrackTitle(url, i),
        url,
      }));
    } catch (e) {
      console.warn(`${filename} の読み込みに失敗、${moodKey} は既定音源を使用:`, e);
    }
  };

  await Promise.all(
    Object.entries(moodTxtMap)
      .filter(([moodKey]) => Boolean(MOODS[moodKey]))
      .map(([moodKey, filename]) => loadOneMood(moodKey, filename))
  );
}

function fadeAudio(audioEl, from, to, ms) {
  return new Promise((resolve) => {
    if (prefersReducedMotion()) {
      audioEl.volume = to;
      resolve();
      return;
    }
    const start = performance.now();
    audioEl.volume = clamp(from, 0, 1);
    const step = (t) => {
      const p = clamp((t - start) / ms, 0, 1);
      audioEl.volume = from + (to - from) * p;
      if (p < 1) requestAnimationFrame(step);
      else resolve();
    };
    requestAnimationFrame(step);
  });
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

let toastTimer = 0;
function toast(msg) {
  let el = document.getElementById("toast");
  if (!el) {
    el = document.createElement("div");
    el.id = "toast";
    el.className = "toast";
    document.body.appendChild(el);
  }

  el.textContent = msg;
  el.classList.add("toast--show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove("toast--show");
  }, 1100);
}

/* ---------------------------
 * 事件绑定
 * --------------------------- */
function bind() {
  document.querySelectorAll(".moodCard").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const mood = btn.getAttribute("data-mood");
      setMood(mood, {
        autoplay: true,
        pushUrl: true,
        burst: true,
        burstOrigin: { clientX: e.clientX, clientY: e.clientY },
      });
    });
  });

  els.playBtn.addEventListener("click", togglePlay);
  els.prevBtn?.addEventListener("click", () => {
    if (!state.mood) return;
    els.moodCopy.textContent = pickRandom(MOODS[state.mood].copy);
    goPrev({ autoplay: true });
  });
  els.nextBtn.addEventListener("click", () => {
    if (!state.mood) return;
    els.moodCopy.textContent = pickRandom(MOODS[state.mood].copy);
    goNext({ autoplay: true, fadeIn: false });
  });

  // 进度条点击 / 拖动寻址
  els.progressBar?.addEventListener("click", (e) => {
    if (!els.audio.duration || !Number.isFinite(els.audio.duration)) return;
    const rect = els.progressBar.getBoundingClientRect();
    const p = clamp((e.clientX - rect.left) / rect.width, 0, 1);
    els.audio.currentTime = p * els.audio.duration;
  });

  // 音量
  els.volumeSlider?.addEventListener("input", () => {
    const v = Number(els.volumeSlider.value) / 100;
    els.audio.volume = v;
    updateVolumeButtonIcon(v);
  });
  els.volumeMute?.addEventListener("click", () => {
    if (els.audio.volume > 0) {
      state.volumeBeforeMute = els.audio.volume;
      els.audio.volume = 0;
      els.volumeSlider.value = 0;
      updateVolumeButtonIcon(0);
    } else {
      els.audio.volume = state.volumeBeforeMute;
      els.volumeSlider.value = Math.round(state.volumeBeforeMute * 100);
      updateVolumeButtonIcon(state.volumeBeforeMute);
    }
  });

  // 循环：off -> one -> all
  els.repeatBtn?.addEventListener("click", () => {
    const modes = ["off", "one", "all"];
    const i = modes.indexOf(state.repeatMode);
    state.repeatMode = modes[(i + 1) % modes.length];
    updateRepeatButtonIcon(state.repeatMode);
    els.repeatBtn.title = state.repeatMode === "off" ? "リピートオフ" : state.repeatMode === "one" ? "1曲リピート" : "全曲リピート";
  });

  // 随机
  els.shuffleBtn?.addEventListener("click", () => {
    state.shuffle = !state.shuffle;
    els.shuffleBtn.classList.toggle("btn--active", state.shuffle);
    els.shuffleBtn.title = state.shuffle ? "随机开" : "随机关";
  });

  els.chatBtn?.addEventListener("click", () => {
    if (!state.canChat) return;
    const isOpen = Boolean(els.chatPanel?.classList.contains("chatPanel--open"));
    if (isOpen) closeChatPanel();
    else openChatPanel();
  });
  els.chatClose?.addEventListener("click", closeChatPanel);
  els.chatSend?.addEventListener("click", () => {
    const t = els.chatInput?.value?.trim();
    if (t) {
      chatSendMessage(t);
      els.chatInput.value = "";
    }
  });
  els.chatInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const t = els.chatInput?.value?.trim();
      if (t) {
        chatSendMessage(t);
        els.chatInput.value = "";
      }
    }
  });
  // 事件委派兜底：支持 click 与 pointerdown，避免某些环境下 click 丢失
  const delegateChatNameOpen = (e) => {
    const targetEl = e.target instanceof Element ? e.target : e.target?.parentElement;
    if (!targetEl) return;
    const clickedTarget = resolveChatClickTarget(targetEl);
    if (!clickedTarget) return;
    handleChatNameButtonClick(clickedTarget, e);
  };
  els.chatMessages?.addEventListener("click", delegateChatNameOpen);
  els.chatMessages?.addEventListener("pointerdown", delegateChatNameOpen, true);
  els.chatMenuAddFriend?.addEventListener("click", async (e) => {
    e.stopPropagation();
    const userId = chatUserMenuTarget.userId;
    if (!userId) {
      toast("无法添加：缺少ユーザーID");
      return;
    }
    const myId = getCurrentUserId();
    if (myId && myId === userId) {
      toast("不能添加自己");
      return;
    }
    await sendFriendRequest(userId);
    closeChatUserMenu();
  });
  els.chatMenuViewProfile?.addEventListener("click", async (e) => {
    e.stopPropagation();
    await openChatUserProfileCard(chatUserMenuTarget.userId, chatUserMenuTarget.userName);
    closeChatUserMenu();
  });
  els.chatUserProfileClose?.addEventListener("click", (e) => {
    e.stopPropagation();
    closeChatUserProfileCard();
  });

  // 汉堡菜单切换
  els.hamburgerMenu?.addEventListener("click", (e) => {
    e.stopPropagation();
    const isActive = els.hamburgerMenu?.classList.toggle("active");
    if (els.userMenu) {
      els.userMenu.setAttribute("aria-hidden", !isActive);
    }
  });

  // 点击外部关闭菜单
  document.addEventListener("click", (e) => {
    if (Date.now() - chatUserMenuOpenedAt < 300) return;
    const targetEl = e.target instanceof Element ? e.target : e.target?.parentElement;
    const clickedMetaBtn = targetEl?.closest?.(".chatMsg__nameBtn");
    const clickedMetaRow = targetEl?.closest?.(".chatMsg__meta");

    if (els.hamburgerMenu && els.userMenu && 
        !els.hamburgerMenu.contains(targetEl) && 
        !els.userMenu.contains(targetEl)) {
      els.hamburgerMenu.classList.remove("active");
      els.userMenu.setAttribute("aria-hidden", "true");
    }
    if (els.chatUserMenu && !els.chatUserMenu.contains(targetEl) && !clickedMetaBtn && !clickedMetaRow) {
      closeChatUserMenu();
    }
    if (
      els.chatUserProfileCard &&
      !els.chatUserProfileCard.contains(targetEl) &&
      !clickedMetaBtn &&
      !clickedMetaRow &&
      (!els.chatUserMenu || !els.chatUserMenu.contains(targetEl))
    ) {
      closeChatUserProfileCard();
    }
  });

  // 首页按钮
  els.homeBtn?.addEventListener("click", () => {
    resetToPick();
    // 关闭菜单
    if (els.hamburgerMenu) els.hamburgerMenu.classList.remove("active");
    if (els.userMenu) els.userMenu.setAttribute("aria-hidden", "true");
  });
  
  // 返回首页按钮（在ユーザー页面）
  els.backToHomeBtn?.addEventListener("click", () => {
    resetToPick();
  });

  // 登录系统
  els.loginBtn?.addEventListener("click", () => openAuthModal("login"));
  els.logoutBtn?.addEventListener("click", signOut);
  
  // 我的页面按钮
  els.myPageBtn?.addEventListener("click", () => {
    showUserPage();
    // 关闭菜单
    if (els.hamburgerMenu) els.hamburgerMenu.classList.remove("active");
    if (els.userMenu) els.userMenu.setAttribute("aria-hidden", "true");
  });
  els.friendChatBtn?.addEventListener("click", async () => {
    if (!state.user) {
      openAuthModal("login");
      return;
    }
    // 关闭菜单
    if (els.hamburgerMenu) els.hamburgerMenu.classList.remove("active");
    if (els.userMenu) els.userMenu.setAttribute("aria-hidden", "true");
    await openFriendChatModal();
  });
  
  els.authClose?.addEventListener("click", closeAuthModal);
  els.authModal?.addEventListener("click", (e) => {
    if (e.target.classList.contains("authModal__backdrop") || e.target.classList.contains("authModal")) {
      closeAuthModal();
    }
  });
  els.authTabLogin?.addEventListener("click", () => switchAuthTab("login"));
  els.authTabSignup?.addEventListener("click", () => switchAuthTab("signup"));
  els.loginSubmit?.addEventListener("click", async () => {
    const email = els.loginEmail?.value?.trim();
    const password = els.loginPassword?.value;
    if (!email || !password) {
      if (els.loginError) els.loginError.textContent = "メールアドレスとパスワードを入力してください";
      return;
    }
    await signIn(email, password);
  });
  els.signupSubmit?.addEventListener("click", async () => {
    const email = els.signupEmail?.value?.trim();
    const password = els.signupPassword?.value;
    const name = els.signupName?.value?.trim();
    if (!email || !password) {
      if (els.signupError) els.signupError.textContent = "メールアドレスとパスワードを入力してください";
      return;
    }
    if (password.length < 6) {
      if (els.signupError) els.signupError.textContent = "パスワードは6文字以上です";
      return;
    }
    await signUp(email, password, name);
  });
  els.loginPassword?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") els.loginSubmit?.click();
  });
  els.signupPassword?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") els.signupSubmit?.click();
  });

  // ユーザー页面
  els.userName?.addEventListener("click", showUserPage);
  els.profileSaveBtn?.addEventListener("click", saveUserProfile);
  els.profilePasswordBtn?.addEventListener("click", changeUserPassword);
  els.profileAvatarUrl?.addEventListener("input", () => {
    const url = String(els.profileAvatarUrl?.value || "").trim();
    if (!url) {
      renderProfileAvatar("");
      setProfileSaveMessage("");
      return;
    }
    renderProfileAvatar(url);
    setProfileSaveMessage("アイコンをプレビューしました。保存してください");
  });
  els.chatLoadMore?.addEventListener("click", () => {
    chatLoadMessages({ appendOlder: true });
  });
  els.searchFriendBtn?.addEventListener("click", async () => {
    const q = els.searchFriend?.value?.trim();
    await renderSearchResults(q);
  });
  els.searchFriend?.addEventListener("keydown", async (e) => {
    if (e.key === "Enter") {
      const q = els.searchFriend?.value?.trim();
      await renderSearchResults(q);
    }
  });
  els.friendChatClose?.addEventListener("click", closeFriendChatModal);
  els.friendChatModal?.addEventListener("click", (e) => {
    if (e.target.classList.contains("friendChatModal") || e.target.classList.contains("friendChatModal__backdrop")) {
      closeFriendChatModal();
    }
  });
  els.friendChatSend?.addEventListener("click", sendFriendChatMessage);
  els.friendChatInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendFriendChatMessage();
    }
  });

  els.backLink?.addEventListener("click", (e) => {
    e.preventDefault();
    resetToPick();
  });
  els.backBtn?.addEventListener("click", resetToPick);
  els.resetBtn?.addEventListener("click", resetToPick);
  els.shareBtn?.addEventListener("click", copyShareLink);
  els.resetBtn2?.addEventListener("click", resetToPick);
  els.shareBtn2?.addEventListener("click", copyShareLink);

  els.audio.addEventListener("timeupdate", syncProgress);
  els.audio.addEventListener("loadedmetadata", syncProgress);
  els.audio.addEventListener("ended", () => {
    if (state.repeatMode === "one" && state.currentTrack) {
      els.audio.currentTime = 0;
      els.audio.play().then(() => setPlayBtn(true)).catch(() => setPlayBtn(false));
      return;
    }
    setPlayBtn(false);
    document.body.classList.remove("is-playing");
    if (state.repeatMode === "all") {
      goNext({ autoplay: true, fadeIn: true });
    } else {
      const idx = getCurrentTrackIndex();
      const total = MOODS[state.mood]?.tracks?.length ?? 0;
      const isLast = total > 0 && idx === total - 1;
      if (!isLast) goNext({ autoplay: true, fadeIn: true });
    }
  });
  els.audio.addEventListener("play", () => {
    setPlayBtn(true);
    document.body.classList.add("is-playing");
  });
  els.audio.addEventListener("pause", () => {
    setPlayBtn(false);
    document.body.classList.remove("is-playing");
  });
  els.audio.addEventListener("error", () => {
    setPlayBtn(false);
    toast("音声を再生できません。music フォルダに MP3 があり、ローカルサーバーで開いているか確認してください（例: npx serve .）");
  });

  window.addEventListener("keydown", (e) => {
    // 避免在输入框里劫持（本项目基本没有输入框，但还是做一下）
    const t = e.target;
    const isTyping =
      t &&
      (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable === true);
    if (isTyping) return;

    if (e.key === "Escape") {
      resetToPick();
      return;
    }
    if (e.key === "Enter") {
      togglePlay();
      return;
    }
    if (e.key.toLowerCase() === "n") {
      if (state.mood) {
        els.moodCopy.textContent = pickRandom(MOODS[state.mood].copy);
        goNext({ autoplay: true, fadeIn: false });
      }
      return;
    }
    if (e.key === "ArrowLeft" || e.key.toLowerCase() === "p") {
      if (state.mood) goPrev({ autoplay: true });
      return;
    }
    if (e.key === " ") {
      e.preventDefault();
      togglePlay();
    }
  });
}

function resetToPick() {
  els.audio.pause();
  setPlayBtn(false);
  showPick();
  // 不清空 mood，让背景保持最后主题也可以；这里回到默认（更像“换心情”）
  document.body.removeAttribute("data-mood");
  document.body.classList.add("is-index");
  const url = new URL(window.location.href);
  url.searchParams.delete("mood");
  url.hash = "";
  history.replaceState({}, "", url);
  state.mood = null;
  state.currentTrack = null;
  if (els.leftPill) els.leftPill.textContent = "Select mood";
  chatLeaveRoom();
  closeChatPanel();
  toast("気分選択に戻りました");
}

/* ---------------------------
 * 同听チャット：只有与正在听同一首歌的人才能打开チャット
 * 依赖 Supabase（Presence + 表 chat_messages）
 *
 * Supabase 建表 SQL（在 SQL Editor 中执行）：
 *   create table chat_messages (
 *     id uuid default gen_random_uuid() primary key,
 *     room_id text not null,
 *     user_id text not null,
 *     user_name text not null,
 *     message text not null,
 *     created_at timestamptz default now()
 *   );
 *   alter publication supabase_realtime add table chat_messages;
 * 然后在 index.html 前加：<script>window.MOOD_PLAYER_SUPABASE={url:'あなた的项目URL',anonKey:'あなた的anon key'};</script>
 * --------------------------- */
let chatMessagesUnsub = null;
let chatPresenceUnsub = null;
let chatPresenceHeartbeat = 0;
let chatPresenceDocRef = null;
const CHAT_PRESENCE_TTL_MS = 12000;
const CHAT_PAGE_SIZE = 30;
const CHAT_MESSAGE_TTL_MS = 30 * 60 * 1000;
let chatOldestDoc = null;
let chatHasMore = true;
let chatLoadingMore = false;
let chatRenderedMessageIds = new Set();
let chatMessageSweepTimer = 0;
let chatUserMenuTarget = { userId: "", userName: "" };
let chatPanelOpenedAt = 0;
let chatUserMenuOpenedAt = 0;
let friendChatUnsub = null;
let currentFriendChatId = "";
let currentFriendTarget = null;

function getRoomId() {
  if (!state.mood || !state.currentTrack?.url) return null;
  return state.mood + "|" + state.currentTrack.url;
}

function getRoomIdHash(roomId) {
  if (!roomId) return "";
  let h = 0;
  for (let i = 0; i < roomId.length; i++) h = ((h << 5) - h + roomId.charCodeAt(i)) | 0;
  return "r_" + Math.abs(h).toString(36);
}

function getChatUserId() {
  if (state.user?.id) return state.user.id;
  if (state.user?.uid) return state.user.uid;
  let id = localStorage.getItem(CHAT_USER_KEY);
  if (!id) {
    id = "u_" + Math.random().toString(36).slice(2, 12);
    localStorage.setItem(CHAT_USER_KEY, id);
  }
  return id;
}

function getChatUserName() {
  if (state.user?.user_metadata?.name) return state.user.user_metadata.name;
  if (state.user?.displayName) return state.user.displayName;
  if (state.user?.email) return state.user.email.split("@")[0];
  let name = localStorage.getItem(CHAT_NAME_KEY);
  if (!name) {
    name = "User_" + Math.random().toString(36).slice(2, 6);
    localStorage.setItem(CHAT_NAME_KEY, name);
  }
  return name;
}

function getRoomMessagesRef(roomHash) {
  const fb = getFirebase();
  if (!fb) return null;
  return fb.db.collection("chat_rooms").doc(roomHash).collection("messages");
}

function getRoomPresenceRef(roomHash) {
  const fb = getFirebase();
  if (!fb) return null;
  return fb.db.collection("chat_rooms").doc(roomHash).collection("presence");
}

async function getActivePresenceStats(roomHash) {
  const presenceRef = getRoomPresenceRef(roomHash);
  if (!presenceRef) return { activeCount: 0, hasOtherUser: false };
  const now = Date.now();
  const selfId = getChatUserId();
  const snap = await presenceRef.get();
  const activeUserIds = new Set();
  snap.docs.forEach((doc) => {
    const data = doc.data() || {};
    const lastSeen = Number(data.last_seen || 0);
    if (now - lastSeen <= CHAT_PRESENCE_TTL_MS) {
      activeUserIds.add(String(data.user_id || doc.id));
    }
  });
  return {
    activeCount: activeUserIds.size,
    hasOtherUser: Array.from(activeUserIds).some((id) => id !== selfId),
  };
}

function getSupabase() {
  if (!SUPABASE_CONFIG.url || !SUPABASE_CONFIG.anonKey) {
    console.log("[Chat] Supabase config missing - url:", !!SUPABASE_CONFIG.url, "key:", !!SUPABASE_CONFIG.anonKey);
    return null;
  }
  if (!window.supabaseClient) {
    const { createClient } = window.supabase || {};
    if (!createClient) {
      console.error("[Chat] Supabase JS library not loaded");
      return null;
    }
    const url = SUPABASE_CONFIG.url.replace(/\/$/, "");
    try {
      window.supabaseClient = createClient(url, SUPABASE_CONFIG.anonKey);
      console.log("[Chat] Supabase client created:", url);
    } catch (e) {
      console.error("[Chat] Failed to create Supabase client:", e);
      return null;
    }
  }
  return window.supabaseClient || null;
}

function getFirebase() {
  if (!FIREBASE_CONFIG.apiKey || !FIREBASE_CONFIG.projectId) {
    return null;
  }
  if (!window.firebase) {
    console.error("[Auth] Firebase SDK not loaded");
    return null;
  }
  if (!firebaseApp) {
    firebaseApp = window.firebase.apps?.length ? window.firebase.app() : window.firebase.initializeApp(FIREBASE_CONFIG);
    firebaseAuth = window.firebase.auth();
    firebaseDb = window.firebase.firestore();
  }
  return { app: firebaseApp, auth: firebaseAuth, db: firebaseDb };
}

function chatJoinRoom() {
  chatLeaveRoom();
  const roomId = getRoomId();
  if (!roomId) {
    updateChatButton(false, "曲が未選択です");
    return;
  }
  const fb = getFirebase();
  if (!fb) {
    updateChatButton(false, "Firebase を設定してからチャットを利用してください");
    return;
  }

  state.chatRoomId = roomId;
  state.canChat = false;
  updateChatButton(false, "同時視聴人数を確認中...");
  const roomHash = getRoomIdHash(roomId);
  const presenceRef = getRoomPresenceRef(roomHash);
  if (!presenceRef) {
    updateChatButton(false, "Firebase チャットの初期化に失敗しました");
    return;
  }

  const userId = getChatUserId();
  const userName = getChatUserName();
  chatPresenceDocRef = presenceRef.doc(userId);

  const heartbeat = () =>
    chatPresenceDocRef?.set(
      {
        user_id: userId,
        user_name: userName,
        mood: state.mood || "",
        track_url: state.currentTrack?.url || "",
        last_seen: Date.now(),
      },
      { merge: true }
    );

  heartbeat().catch((e) => console.warn("chat presence heartbeat error:", e));
  clearInterval(chatPresenceHeartbeat);
  chatPresenceHeartbeat = setInterval(() => {
    heartbeat().catch((e) => console.warn("chat presence heartbeat error:", e));
  }, 5000);

  if (chatPresenceUnsub) chatPresenceUnsub();
  chatPresenceUnsub = presenceRef.onSnapshot(
    (snap) => {
      const now = Date.now();
      const activeUserIds = new Set();
      snap.docs.forEach((doc) => {
        const lastSeen = Number(doc.data()?.last_seen || 0);
        if (now - lastSeen <= CHAT_PRESENCE_TTL_MS) {
          activeUserIds.add(String(doc.data()?.user_id || doc.id));
        }
      });
      const activeCount = activeUserIds.size;
      const selfId = getChatUserId();
      const hasOtherUser = Array.from(activeUserIds).some((id) => id !== selfId);
      state.canChat = activeCount >= 2 && hasOtherUser;
      updateChatButton(
        state.canChat,
        state.canChat ? `このルームは ${activeCount} 人オンライン。チャット可能です` : `このルームは ${activeCount} 人オンライン。2人以上（他ユーザー含む）が必要です`
      );
    },
    (error) => {
      console.warn("chat presence subscribe error:", error);
      state.canChat = false;
      updateChatButton(false, "チャットのオンライン状態同期に失敗しました");
    }
  );
}

function chatLeaveRoom() {
  if (chatPresenceUnsub) {
    chatPresenceUnsub();
    chatPresenceUnsub = null;
  }
  if (chatMessagesUnsub) {
    chatMessagesUnsub();
    chatMessagesUnsub = null;
  }
  clearInterval(chatMessageSweepTimer);
  chatMessageSweepTimer = 0;
  clearInterval(chatPresenceHeartbeat);
  chatPresenceHeartbeat = 0;
  if (chatPresenceDocRef) {
    chatPresenceDocRef.delete().catch(() => {});
    chatPresenceDocRef = null;
  }
  state.chatRoomId = null;
  state.canChat = false;
  closeChatUserMenu();
  closeChatUserProfileCard();
  resetChatPagination();
  updateChatButton(false);
}

function updateChatButton(canOpen, tooltip) {
  if (!els.chatBtn) return;
  els.chatBtn.disabled = !canOpen;
  const defaultMsg = canOpen ? "同じ曲を聴いている人とチャット" : "他の同時視聴ユーザーがいないためチャットできません";
  els.chatBtn.title = tooltip || defaultMsg;
  const textEl = els.chatBtn.querySelector(".btn__text");
  if (textEl) textEl.textContent = canOpen ? "チャット" : "チャット (2人必要)";
}

function renderChatRows(rows) {
  const selfId = getChatUserId();
  return rows
    .filter((row) => !isChatMessageExpired(row))
    .map((row) => {
      const createdAt = row.created_at && typeof row.created_at.toDate === "function" ? row.created_at.toDate() : null;
      const time = createdAt ? createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
      const name = escapeHtml(String(row.user_name || "?"));
      const msg = escapeHtml(String(row.message || ""));
      const rawUserId = String(row.user_id || "");
      const userId = escapeHtml(rawUserId);
      const userName = escapeHtml(String(row.user_name || ""));
      const isSelf = rawUserId && rawUserId === selfId ? "1" : "0";
      return `<div class="chatMsg" data-id="${escapeHtml(String(row.id || ""))}" data-chat-self="${isSelf}" data-chat-user-id="${userId}" data-chat-user-name="${userName}"><div class="chatMsg__meta" data-chat-self="${isSelf}" data-chat-user-id="${userId}" data-chat-user-name="${userName}" onclick="window.__chatMetaClick && window.__chatMetaClick(event, this)"><button class="chatMsg__nameBtn" type="button" data-chat-self="${isSelf}" data-chat-user-id="${userId}" data-chat-user-name="${userName}">${name}</button><span class="chatMsg__time">${time}</span></div><div class="chatMsg__text">${msg}</div></div>`;
    })
    .join("");
}

function getChatMessageExpiryMillis(row) {
  const expiresAtMs = toMillisSafe(row?.expires_at);
  if (Number.isFinite(expiresAtMs)) return expiresAtMs;
  const createdAtMs = toMillisSafe(row?.created_at);
  if (Number.isFinite(createdAtMs)) return createdAtMs + CHAT_MESSAGE_TTL_MS;
  // 旧数据无可解析时间时，按过期处理，避免永久可见。
  return 0;
}

function isChatMessageExpired(row) {
  return getChatMessageExpiryMillis(row) <= Date.now();
}

function toMillisSafe(value) {
  if (!value) return NaN;
  if (typeof value.toMillis === "function") return Number(value.toMillis());
  if (typeof value.toDate === "function") return Number(value.toDate().getTime());
  if (value instanceof Date) return Number(value.getTime());
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? NaN : parsed;
  }
  return NaN;
}

function resetChatPagination() {
  chatOldestDoc = null;
  chatHasMore = true;
  chatLoadingMore = false;
  chatRenderedMessageIds = new Set();
  if (els.chatLoadMore) {
    els.chatLoadMore.disabled = false;
    els.chatLoadMore.style.display = "none";
    els.chatLoadMore.textContent = "更早消息";
  }
}

async function chatLoadMessages({ appendOlder = false } = {}) {
  if (!els.chatMessages || !state.chatRoomId) return;
  if (chatLoadingMore) return;

  const roomHash = getRoomIdHash(state.chatRoomId);
  const messagesRef = getRoomMessagesRef(roomHash);
  if (!messagesRef) return;
  if (appendOlder && (!chatHasMore || !chatOldestDoc)) return;

  try {
    chatLoadingMore = true;
    if (els.chatLoadMore) {
      els.chatLoadMore.disabled = true;
      els.chatLoadMore.textContent = "読み込み中...";
    }
    let query = messagesRef.orderBy("created_at", "desc").limit(CHAT_PAGE_SIZE);
    if (appendOlder && chatOldestDoc) {
      query = query.startAfter(chatOldestDoc);
    }
    const snap = await query.get();
    const docs = snap.docs;
    const rows = docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .reverse()
      .filter((row) => !isChatMessageExpired(row));

    if (!appendOlder) {
      els.chatMessages.innerHTML = renderChatRows(rows);
      bindChatMessageNameButtons();
      els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
      chatRenderedMessageIds = new Set(rows.map((r) => String(r.id)));
    } else if (rows.length) {
      const oldHeight = els.chatMessages.scrollHeight;
      const oldTop = els.chatMessages.scrollTop;
      els.chatMessages.insertAdjacentHTML("afterbegin", renderChatRows(rows));
      bindChatMessageNameButtons();
      rows.forEach((r) => chatRenderedMessageIds.add(String(r.id)));
      const newHeight = els.chatMessages.scrollHeight;
      els.chatMessages.scrollTop = oldTop + (newHeight - oldHeight);
    }

    if (docs.length > 0) {
      chatOldestDoc = docs[docs.length - 1];
    }
    chatHasMore = docs.length === CHAT_PAGE_SIZE;
  } catch (e) {
    console.warn("Firebase chat load:", e);
    if (!appendOlder) {
      els.chatMessages.innerHTML =
        `<div class="chatMsg">` +
        `<div class="chatMsg__meta">読み込み失敗</div>` +
        `<div class="chatMsg__text">${escapeHtml(String(e?.message || e || "不明なエラー"))}</div>` +
        `</div>`;
    }
  } finally {
    chatLoadingMore = false;
    if (els.chatLoadMore) {
      els.chatLoadMore.disabled = false;
      els.chatLoadMore.textContent = chatHasMore ? "更早消息" : "没有更早消息";
      els.chatLoadMore.style.display = "inline-flex";
    }
  }
}

function chatSubscribeMessages() {
  if (!state.chatRoomId) return;
  const roomHash = getRoomIdHash(state.chatRoomId);
  const messagesRef = getRoomMessagesRef(roomHash);
  if (!messagesRef) return;
  if (chatMessagesUnsub) chatMessagesUnsub();
  chatMessagesUnsub = messagesRef
    .orderBy("created_at", "asc")
    .limitToLast(CHAT_PAGE_SIZE)
    .onSnapshot(
      (snap) => {
        if (!els.chatMessages) return;
        snap.docs.forEach((doc) => {
          if (chatRenderedMessageIds.has(doc.id)) return;
          const row = { id: doc.id, ...doc.data() };
          if (isChatMessageExpired(row)) return;
          els.chatMessages.insertAdjacentHTML("beforeend", renderChatRows([row]));
          bindChatMessageNameButtons();
          chatRenderedMessageIds.add(doc.id);
        });
        els.chatMessages.scrollTop = els.chatMessages.scrollHeight;
      },
      (error) => {
        console.warn("Firebase chat subscribe:", error);
      }
    );
}

function chatSendMessage(text) {
  const t = String(text).trim();
  if (!t || !state.chatRoomId) return;
  const fb = getFirebase();
  if (!fb) return;

  const roomId = state.chatRoomId;
  const roomHash = getRoomIdHash(roomId);
  const messagesRef = getRoomMessagesRef(roomHash);
  if (!messagesRef) return;
  messagesRef
    .add({
      room_id: roomHash,
      user_id: getChatUserId(),
      user_name: getChatUserName(),
      message: t,
      created_at: window.firebase.firestore.FieldValue.serverTimestamp(),
      expires_at: window.firebase.firestore.Timestamp.fromMillis(Date.now() + CHAT_MESSAGE_TTL_MS),
    })
    .then(() => {});
}

async function openChatPanel() {
  if (!state.chatRoomId || !els.chatPanel) return;
  closeChatUserMenu();
  closeChatUserProfileCard();
  const roomHash = getRoomIdHash(state.chatRoomId);
  const { activeCount, hasOtherUser } = await getActivePresenceStats(roomHash);
  if (activeCount < 2 || !hasOtherUser) {
    state.canChat = false;
    updateChatButton(false, `このルームは ${activeCount} 人オンライン。2人以上（他ユーザー含む）が必要です`);
    toast("需要至少 2 人同听（且有其他ユーザー）才能チャット");
    return;
  }
  state.canChat = true;
  updateChatButton(true, `このルームは ${activeCount} 人オンライン。チャット可能です`);
  els.chatPanel.classList.add("chatPanel--open");
  els.chatPanel.setAttribute("aria-hidden", "false");
  chatPanelOpenedAt = Date.now();
  resetChatPagination();
  await chatLoadMessages();
  chatSubscribeMessages();
  clearInterval(chatMessageSweepTimer);
  chatMessageSweepTimer = setInterval(() => {
    chatLoadMessages().catch(() => {});
  }, 60000);
  setTimeout(() => els.chatInput?.focus(), 100);
}

function closeChatPanel() {
  if (chatMessagesUnsub) {
    chatMessagesUnsub();
    chatMessagesUnsub = null;
  }
  clearInterval(chatMessageSweepTimer);
  chatMessageSweepTimer = 0;
  if (els.chatPanel) {
    els.chatPanel.classList.remove("chatPanel--open");
    els.chatPanel.setAttribute("aria-hidden", "true");
  }
  closeChatUserMenu();
  closeChatUserProfileCard();
  resetChatPagination();
}

function renderTrackList() {
  if (!els.trackList || !state.mood) return;
  const tracks = MOODS[state.mood].tracks || [];
  els.trackList.innerHTML = tracks
    .map((t, i) => {
      const idx = String(i + 1).padStart(2, "0");
      const safeTitle = escapeHtml(normalizeTrackTitle(t.title));
      return `
        <button class="listItem trackItem" type="button" data-track-index="${i}" role="listitem">
          <div class="listItem__idx">${idx}</div>
          <div class="listItem__icon">♪</div>
          <div class="listItem__meta">
            <div class="listItem__title">${safeTitle}</div>
            <div class="listItem__desc">${escapeHtml(MOODS[state.mood].tag)}</div>
          </div>
          <div class="listItem__dur">—</div>
        </button>
      `;
    })
    .join("");

  els.trackList.querySelectorAll(".trackItem").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const i = Number(btn.getAttribute("data-track-index"));
      const track = MOODS[state.mood].tracks[i];
      if (!track) return;
      runEnterBurst({ clientX: e.clientX, clientY: e.clientY });
      loadTrack(track, { autoplay: true, fadeIn: true });
    });
  });
}

function highlightCurrentTrack() {
  if (!els.trackList || !state.currentTrack) return;
  const url = state.currentTrack.url;
  els.trackList.querySelectorAll(".trackItem").forEach((btn) => {
    const i = Number(btn.getAttribute("data-track-index"));
    const track = MOODS[state.mood]?.tracks?.[i];
    const isCurrent = track && track.url === url;
    btn.setAttribute("aria-current", isCurrent ? "true" : "false");
  });
}

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getUserAvatarHtml(user) {
  const avatar = String(user?.avatar_url || "").trim();
  const fallback = "👤";
  if (!avatar) return `<div class="listItem__icon">${fallback}</div>`;
  return `<div class="listItem__icon listItem__icon--avatar"><img src="${escapeHtml(avatar)}" alt="avatar" loading="lazy" /></div>`;
}

function handleChatNameButtonClick(btn, event) {
  if (!btn) return;
  if (!els.chatPanel?.classList.contains("chatPanel--open")) return;

  const clickedUserId = String(btn.getAttribute("data-chat-user-id") || "").trim();
  const clickedUserName = String(btn.getAttribute("data-chat-user-name") || "").trim() || String(btn.textContent || "").trim();
  if (!clickedUserName) return;

  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const rect = btn.getBoundingClientRect();
  openChatUserMenu({
    userId: clickedUserId,
    userName: clickedUserName,
    x: event?.clientX || rect.left + rect.width / 2,
    y: event?.clientY || rect.bottom,
  });
}

function resolveChatClickTarget(targetEl) {
  if (!targetEl) return null;
  const metaBtn = targetEl.closest?.(".chatMsg__nameBtn");
  if (metaBtn) return metaBtn;
  const metaRow = targetEl.closest?.(".chatMsg__meta");
  if (metaRow) return metaRow;
  return targetEl.closest?.(".chatMsg") || null;
}

if (typeof window !== "undefined") {
  window.__chatMetaClick = (event, el) => {
    handleChatNameButtonClick(el, event);
  };
}

function ensureChatOverlayMounted() {
  const body = document.body;
  if (!body) return;
  if (els.chatUserMenu && els.chatUserMenu.parentElement !== body) {
    body.appendChild(els.chatUserMenu);
  }
  if (els.chatUserProfileCard && els.chatUserProfileCard.parentElement !== body) {
    body.appendChild(els.chatUserProfileCard);
  }
}

function bindChatMessageNameButtons() {
  if (!els.chatMessages) return;
  const buttons = els.chatMessages.querySelectorAll(".chatMsg__nameBtn");
  buttons.forEach((btn) => {
    if (btn.dataset.boundClick === "1") return;
    btn.dataset.boundClick = "1";
    btn.addEventListener("click", (e) => {
      handleChatNameButtonClick(btn, e);
    });
  });
}

function openChatUserMenu({ userId, userName, x, y }) {
  if (!els.chatUserMenu) return;
  const targetId = String(userId || "").trim();
  chatUserMenuTarget = {
    userId: targetId,
    userName: String(userName || "ユーザー"),
  };
  updateChatAddFriendActionState().catch(() => {});
  els.chatUserMenu.hidden = false;
  els.chatUserMenu.style.display = "grid";
  const menuWidth = 180;
  const left = Math.max(12, Math.min(window.innerWidth - menuWidth - 12, x));
  const top = Math.max(12, Math.min(window.innerHeight - 150, y + 8));
  els.chatUserMenu.style.left = `${left}px`;
  els.chatUserMenu.style.top = `${top}px`;
  chatUserMenuOpenedAt = Date.now();
}

async function updateChatAddFriendActionState() {
  if (!els.chatMenuAddFriend) return;
  const targetId = String(chatUserMenuTarget.userId || "");
  const myId = getCurrentUserId();
  if (!targetId || !myId || targetId === myId) {
    els.chatMenuAddFriend.disabled = true;
    els.chatMenuAddFriend.textContent = targetId === myId ? "友だち追加（自分）" : "友だち追加（利用不可）";
    return;
  }
  const fb = getFirebase();
  if (!fb) {
    els.chatMenuAddFriend.disabled = true;
    els.chatMenuAddFriend.textContent = "友だち追加（利用不可）";
    return;
  }
  try {
    const friendDoc = await fb.db.collection("friends").doc(`${myId}_${targetId}`).get();
    if (friendDoc.exists) {
      els.chatMenuAddFriend.disabled = true;
      els.chatMenuAddFriend.textContent = "すでに友だちです";
      return;
    }
    const pending = await fb.db
      .collection("friend_requests")
      .where("from_user_id", "==", myId)
      .where("to_user_id", "==", targetId)
      .where("status", "==", "pending")
      .limit(1)
      .get();
    if (!pending.empty) {
      els.chatMenuAddFriend.disabled = true;
      els.chatMenuAddFriend.textContent = "申請送信済み";
      return;
    }
    els.chatMenuAddFriend.disabled = false;
    els.chatMenuAddFriend.textContent = "友だち追加";
  } catch (_) {
    els.chatMenuAddFriend.disabled = true;
    els.chatMenuAddFriend.textContent = "友だち追加（利用不可）";
  }
}

function closeChatUserMenu() {
  if (!els.chatUserMenu) return;
  els.chatUserMenu.hidden = true;
  els.chatUserMenu.style.display = "none";
  if (els.chatMenuAddFriend) {
    els.chatMenuAddFriend.disabled = false;
    els.chatMenuAddFriend.textContent = "友だち追加";
  }
}

function closeChatUserProfileCard() {
  if (!els.chatUserProfileCard) return;
  els.chatUserProfileCard.hidden = true;
  els.chatUserProfileCard.style.display = "none";
}

async function openChatUserProfileCard(userId, fallbackName) {
  if (!els.chatUserProfileCard) return;
  let user = null;
  const fb = getFirebase();
  if (fb && userId) {
    try {
      const doc = await fb.db.collection("users").doc(userId).get();
      if (doc.exists) user = doc.data();
    } catch (error) {
      console.warn("load chat user profile failed:", error);
    }
  } else if (fb && fallbackName) {
    try {
      const snap = await fb.db.collection("users").where("name", "==", fallbackName).limit(1).get();
      if (!snap.empty) user = snap.docs[0].data();
    } catch (error) {
      console.warn("load chat user profile by name failed:", error);
    }
  }
  const name = user?.name || fallbackName || "ユーザー";
  const bio = String(user?.bio || "").trim() || "このユーザーはまだ自己紹介を書いていません。";
  const avatar = String(user?.avatar_url || "").trim();
  if (els.chatUserProfileName) els.chatUserProfileName.textContent = name;
  if (els.chatUserProfileBio) els.chatUserProfileBio.textContent = bio;
  if (els.chatUserProfileAvatar) {
    if (avatar) {
      els.chatUserProfileAvatar.className = "listItem__icon listItem__icon--avatar";
      els.chatUserProfileAvatar.innerHTML = `<img src="${escapeHtml(avatar)}" alt="avatar" loading="lazy" />`;
    } else {
      els.chatUserProfileAvatar.className = "listItem__icon";
      els.chatUserProfileAvatar.textContent = "👤";
    }
  }
  els.chatUserProfileCard.hidden = false;
  els.chatUserProfileCard.style.display = "block";
}

function runEnterBurst(origin) {
  // 设置爆发中心点：优先用点击位置（相对 panel），否则默认 50%/45%
  if (els.panel) {
    const r = els.panel.getBoundingClientRect();
    if (origin && Number.isFinite(origin.clientX) && Number.isFinite(origin.clientY)) {
      const x = clamp(origin.clientX - r.left, 0, r.width);
      const y = clamp(origin.clientY - r.top, 0, r.height);
      document.body.style.setProperty("--burst-x", `${x}px`);
      document.body.style.setProperty("--burst-y", `${y}px`);
    } else {
      document.body.style.setProperty("--burst-x", "50%");
      document.body.style.setProperty("--burst-y", "45%");
    }
  }

  document.body.classList.remove("is-entering");
  // 触发重排，确保连续点击也能重播动画
  void document.body.offsetWidth;
  document.body.classList.add("is-entering");
  window.clearTimeout(runEnterBurst._t);
  runEnterBurst._t = window.setTimeout(() => {
    document.body.classList.remove("is-entering");
  }, 820);
}
runEnterBurst._t = 0;

/* ---------------------------
 * 登录系统：Firebase Auth
 * --------------------------- */
async function checkAuthSession() {
  const fb = getFirebase();
  if (!fb) {
    updateUserUI(false);
    return;
  }
  const user = fb.auth.currentUser;
  if (user) {
    state.user = user;
    updateUserUI(true);
    await ensureUserRecord(user);
  } else {
    state.user = null;
    updateUserUI(false);
  }
}

async function ensureUserRecord(user) {
  const fb = getFirebase();
  if (!fb || !user?.uid) return;
  const name = user.displayName || user.user_metadata?.name || user.email?.split("@")[0] || "ユーザー";
  try {
    const basePayload = {
      id: user.uid,
      email: user.email || "",
      name,
      updated_at: Date.now(),
    };
    if (user.photoURL) {
      basePayload.avatar_url = user.photoURL;
    }
    await fb.db.collection("users").doc(user.uid).set(
      basePayload,
      { merge: true }
    );
  } catch (error) {
    console.error("创建ユーザー记录失败:", error);
  }
}

async function signUp(email, password, name) {
  const fb = getFirebase();
  if (!fb) {
    toast("Firebase 未設定");
    return false;
  }
  try {
    const credential = await fb.auth.createUserWithEmailAndPassword(email, password);
    if (credential?.user && name) {
      await credential.user.updateProfile({ displayName: name });
    }
    const userName = name || email.split("@")[0];
    await ensureUserRecord({
      ...credential.user,
      displayName: credential?.user?.displayName || userName,
    });
    if (els.signupError) els.signupError.textContent = "";
    toast("登録しました");
    closeAuthModal();
    return true;
  } catch (error) {
    if (els.signupError) els.signupError.textContent = error?.message || "登録失敗";
    return false;
  }
}

async function signIn(email, password) {
  const fb = getFirebase();
  if (!fb) {
    toast("Firebase 未設定");
    return false;
  }
  try {
    const credential = await fb.auth.signInWithEmailAndPassword(email, password);
    if (!credential?.user) return false;
    state.user = credential.user;
    updateUserUI(true);
    await ensureUserRecord(credential.user);
    if (els.loginError) els.loginError.textContent = "";
    toast("ログインしました");
    closeAuthModal();
    return true;
  } catch (error) {
    if (els.loginError) els.loginError.textContent = error?.message || "ログイン失敗";
    return false;
  }
}

async function signOut() {
  const fb = getFirebase();
  if (fb) {
    await fb.auth.signOut();
  }
  closeFriendChatModal();
  state.user = null;
  updateUserUI(false);
  chatLeaveRoom();
  toast("ログアウトしました");
}

function updateUserUI(isLoggedIn) {
  if (!els.loginBtn || !els.userInfo || !els.userName) return;
  if (isLoggedIn) {
    els.loginBtn.style.display = "none";
    els.userInfo.style.display = "flex";
    const name = state.user?.displayName || state.user?.user_metadata?.name || state.user?.email?.split("@")[0] || "ユーザー";
    els.userName.textContent = name;
    // 显示我的页面按钮
    if (els.myPageBtn) els.myPageBtn.style.display = "block";
    if (els.friendChatBtn) els.friendChatBtn.style.display = "block";
  } else {
    els.loginBtn.style.display = "block";
    els.userInfo.style.display = "none";
    // 隐藏我的页面按钮
    if (els.myPageBtn) els.myPageBtn.style.display = "none";
    if (els.friendChatBtn) els.friendChatBtn.style.display = "none";
  }
}

function renderProfileAvatar(url) {
  if (!els.profileAvatarImg || !els.profileAvatarFallback) return;
  if (url) {
    els.profileAvatarImg.src = url;
    els.profileAvatarImg.style.display = "block";
    els.profileAvatarFallback.style.display = "none";
  } else {
    els.profileAvatarImg.removeAttribute("src");
    els.profileAvatarImg.style.display = "none";
    els.profileAvatarFallback.style.display = "inline";
  }
}

function setProfileSaveMessage(text, isError = false) {
  if (!els.profileSaveMsg) return;
  els.profileSaveMsg.textContent = text || "";
  els.profileSaveMsg.style.color = isError ? "#ff7b7b" : "";
}

function setProfilePasswordMessage(text, isError = false) {
  if (!els.profilePasswordMsg) return;
  els.profilePasswordMsg.textContent = text || "";
  els.profilePasswordMsg.style.color = isError ? "#ff7b7b" : "";
}

async function loadUserProfile() {
  const fb = getFirebase();
  const uid = getCurrentUserId();
  if (!fb || !uid) return;

  const fallbackName = state.user?.displayName || state.user?.email?.split("@")[0] || "ユーザー";
  const fallbackEmail = state.user?.email || "—";
  try {
    const doc = await fb.db.collection("users").doc(uid).get();
    const data = doc.exists ? doc.data() : null;
    const name = data?.name || fallbackName;
    const email = data?.email || fallbackEmail;
    const bio = data?.bio || "まだ自己紹介がありません。";
    const avatarUrl = data?.avatar_url || state.user?.photoURL || "";

    state.profile = { ...(data || {}), name, email, bio, avatar_url: avatarUrl };
    if (els.profileName) els.profileName.textContent = name;
    if (els.userEmail) els.userEmail.textContent = email;
    if (els.profileBioText) els.profileBioText.textContent = bio;
    if (els.profileEditName) els.profileEditName.value = name;
    if (els.profileEditBio) els.profileEditBio.value = data?.bio || "";
    if (els.profileAvatarUrl) els.profileAvatarUrl.value = avatarUrl || "";
    renderProfileAvatar(avatarUrl);

    // 导航栏ユーザー名也同步为 Firestore 昵称
    if (els.userName) els.userName.textContent = name;
  } catch (error) {
    console.warn("load user profile failed:", error);
    if (els.profileName) els.profileName.textContent = fallbackName;
    if (els.userEmail) els.userEmail.textContent = fallbackEmail;
    if (els.profileBioText) els.profileBioText.textContent = "プロフィールの読み込みに失敗しました";
    renderProfileAvatar(state.user?.photoURL || "");
  }
}

async function saveUserProfile() {
  const fb = getFirebase();
  const uid = getCurrentUserId();
  if (!fb || !uid) {
    setProfileSaveMessage("先にログインしてください", true);
    return;
  }

  const name = String(els.profileEditName?.value || "").trim();
  const bio = String(els.profileEditBio?.value || "").trim();
  const avatarInput = String(els.profileAvatarUrl?.value || "").trim();
  if (!name) {
    setProfileSaveMessage("表示名は必須です", true);
    return;
  }

  if (avatarInput && !/^https?:\/\/.+/i.test(avatarInput)) {
    setProfileSaveMessage("アイコン URL の形式が正しくありません", true);
    return;
  }

  try {
    setProfileSaveMessage("保存中...");
    const avatarUrl = avatarInput;

    await fb.db.collection("users").doc(uid).set(
      {
        id: uid,
        email: state.user?.email || "",
        name,
        bio,
        avatar_url: avatarUrl,
        updated_at: Date.now(),
      },
      { merge: true }
    );

    if (state.user?.updateProfile) {
      await state.user.updateProfile({
        displayName: name,
        photoURL: avatarUrl || null,
      });
    }

    state.profile = {
      ...(state.profile || {}),
      name,
      bio,
      avatar_url: avatarUrl,
    };
    if (els.profileName) els.profileName.textContent = name;
    if (els.profileBioText) els.profileBioText.textContent = bio || "まだ自己紹介がありません。";
    if (els.userName) els.userName.textContent = name;
    renderProfileAvatar(avatarUrl);
    setProfileSaveMessage("保存しました");
    toast("プロフィールを更新しました");
  } catch (error) {
    console.error("save profile failed:", error);
    setProfileSaveMessage(error?.message || "保存に失敗しました", true);
  }
}

async function changeUserPassword() {
  const fb = getFirebase();
  const user = fb?.auth?.currentUser;
  if (!user) {
    setProfilePasswordMessage("先にログインしてください", true);
    return;
  }
  const password = String(els.profileNewPassword?.value || "");
  const confirm = String(els.profileConfirmPassword?.value || "");
  if (password.length < 6) {
    setProfilePasswordMessage("パスワードは 6 文字以上です", true);
    return;
  }
  if (password !== confirm) {
    setProfilePasswordMessage("パスワードが一致しません", true);
    return;
  }
  try {
    setProfilePasswordMessage("更新中...");
    await user.updatePassword(password);
    if (els.profileNewPassword) els.profileNewPassword.value = "";
    if (els.profileConfirmPassword) els.profileConfirmPassword.value = "";
    setProfilePasswordMessage("パスワードを更新しました");
    toast("パスワードを更新しました");
  } catch (error) {
    const msg = String(error?.message || "");
    if (msg.includes("requires-recent-login")) {
      setProfilePasswordMessage("再ログイン後にパスワードを変更してください", true);
    } else {
      setProfilePasswordMessage(msg || "パスワード更新に失敗しました", true);
    }
  }
}

/* ---------------------------
 * 友だち系统
 * Firestore collections:
 * - users
 * - friend_requests
 * - friends
 * --------------------------- */
function getCurrentUserId() {
  return state.user?.uid || state.user?.id || null;
}

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function getUsersByIds(ids) {
  const fb = getFirebase();
  if (!fb || !ids?.length) return [];
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (!uniqueIds.length) return [];

  const chunks = chunkArray(uniqueIds, 10);
  const all = await Promise.all(
    chunks.map((part) =>
      fb.db.collection("users").where("id", "in", part).get().then((snap) => snap.docs.map((d) => d.data()))
    )
  );
  return all.flat();
}

async function searchUsers(query) {
  if (!query?.trim()) return [];
  const fb = getFirebase();
  const myId = getCurrentUserId();
  if (!fb || !myId) {
    console.warn("Search users: Firebase not initialized or user not logged in");
    return [];
  }
  const q = query.trim().toLowerCase();

  try {
    // Firestore 不支持 ilike '%keyword%'，这里采用小规模列表后前端过滤
    const snap = await fb.db.collection("users").limit(200).get();
    const users = snap.docs.map((doc) => doc.data());
    return users
      .filter((u) => {
        if (!u?.id || u.id === myId) return false;
        const email = String(u.email || "").toLowerCase();
        const name = String(u.name || "").toLowerCase();
        return email.includes(q) || name.includes(q);
      })
      .slice(0, 20);
  } catch (error) {
    console.error("搜索ユーザー异常:", error);
    return [];
  }
}

async function sendFriendRequest(toUserId) {
  const fb = getFirebase();
  const myId = getCurrentUserId();
  if (!fb || !myId || !toUserId || myId === toUserId) return false;

  try {
    const directId = `${myId}_${toUserId}`;
    const friendDoc = await fb.db.collection("friends").doc(directId).get();
    if (friendDoc.exists) {
      toast("すでに友だちです");
      return false;
    }

    const pending = await fb.db
      .collection("friend_requests")
      .where("from_user_id", "==", myId)
      .where("to_user_id", "==", toUserId)
      .where("status", "==", "pending")
      .limit(1)
      .get();
    if (!pending.empty) {
      toast("申請送信済み");
      return false;
    }

    await fb.db.collection("friend_requests").add({
      from_user_id: myId,
      to_user_id: toUserId,
      status: "pending",
      created_at: window.firebase.firestore.FieldValue.serverTimestamp(),
      updated_at: window.firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Send friend request:", error);
    toast("送信失敗：" + (error?.message || "不明なエラー"));
    return false;
  }
  toast("友だち申請を送信しました");
  return true;
}

async function acceptFriendRequest(requestId, fromUserId) {
  const fb = getFirebase();
  const myId = getCurrentUserId();
  if (!fb || !myId || !requestId || !fromUserId) return false;
  try {
    const batch = fb.db.batch();
    batch.set(
      fb.db.collection("friend_requests").doc(requestId),
      {
        status: "accepted",
        updated_at: window.firebase.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    batch.set(fb.db.collection("friends").doc(`${myId}_${fromUserId}`), {
      user_id: myId,
      friend_id: fromUserId,
      created_at: window.firebase.firestore.FieldValue.serverTimestamp(),
    });
    batch.set(fb.db.collection("friends").doc(`${fromUserId}_${myId}`), {
      user_id: fromUserId,
      friend_id: myId,
      created_at: window.firebase.firestore.FieldValue.serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    console.error("Create friendship:", error);
    return false;
  }
  toast("友だち申請を承認しました");
  loadFriends();
  loadFriendRequests();
  return true;
}

async function rejectFriendRequest(requestId) {
  const fb = getFirebase();
  if (!fb || !requestId) return false;
  try {
    await fb.db.collection("friend_requests").doc(requestId).set(
      {
        status: "rejected",
        updated_at: window.firebase.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error("Reject request:", error);
    return false;
  }
  toast("已拒否");
  loadFriendRequests();
  return true;
}

async function loadFriends() {
  const fb = getFirebase();
  const myId = getCurrentUserId();
  if (!fb || !myId) return;
  try {
    const snap = await fb.db.collection("friends").where("user_id", "==", myId).get();
    state.friends = snap.docs.map((d) => d.data()?.friend_id).filter(Boolean);
  } catch (error) {
    console.warn("Load friends:", error);
    return;
  }
  if (els.friendCount) els.friendCount.textContent = state.friends.length;
  renderFriendsList();
}

async function loadFriendRequests() {
  const fb = getFirebase();
  const myId = getCurrentUserId();
  if (!fb || !myId) return;
  try {
    const snap = await fb.db
      .collection("friend_requests")
      .where("to_user_id", "==", myId)
      .where("status", "==", "pending")
      .get();
    state.friendRequests = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.warn("Load requests:", error);
    return;
  }
  if (els.requestCount) els.requestCount.textContent = `${state.friendRequests.length} 件`;
  renderFriendRequests();
}

async function renderFriendsList() {
  if (!els.friendsList) return;
  if (!state.friends.length) {
    els.friendsList.innerHTML = "<div class=\"listItem listItem--empty\">友だちがいません</div>";
    return;
  }
  let users = [];
  try {
    users = await getUsersByIds(state.friends);
  } catch (error) {
    console.warn("Load friend users:", error);
    return;
  }
  els.friendsList.innerHTML = users
    .map((u) => {
      const name = u.name || u.email?.split("@")[0] || "ユーザー";
      const bio = (String(u.bio || "").trim() || "この友だちはまだ自己紹介を書いていません。");
      return `
        <div class="listItem listItem--person">
          ${getUserAvatarHtml(u)}
          <div class="listItem__meta">
            <button class="friendNameBtn listItem__title listItem__title--full" type="button" data-friend-id="${escapeHtml(String(u.id || ""))}">${escapeHtml(name)}</button>
            <div class="friendBioInline" data-friend-bio-id="${escapeHtml(String(u.id || ""))}" hidden>${escapeHtml(bio)}</div>
          </div>
          <div class="listItem__actions">
            <button class="btn btn--ghost btn--small" data-action="friend-chat" data-friend-id="${escapeHtml(String(u.id || ""))}" data-friend-name="${escapeHtml(name)}">チャット</button>
          </div>
        </div>
      `;
    })
    .join("");
  els.friendsList.querySelectorAll(".friendNameBtn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const friendId = btn.getAttribute("data-friend-id");
      els.friendsList.querySelectorAll(".friendBioInline").forEach((el) => {
        if (el.getAttribute("data-friend-bio-id") !== friendId) el.hidden = true;
      });
      const bioEl = els.friendsList.querySelector(`.friendBioInline[data-friend-bio-id="${CSS.escape(friendId || "")}"]`);
      if (!bioEl) return;
      bioEl.hidden = !bioEl.hidden;
    });
  });
  els.friendsList.querySelectorAll("[data-action='friend-chat']").forEach((btn) => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const friendId = String(btn.getAttribute("data-friend-id") || "");
      const friendName = String(btn.getAttribute("data-friend-name") || "");
      if (!friendId) return;
      await openFriendChatModal({ friendId, friendName });
    });
  });
}

function getFriendChatId(uidA, uidB) {
  return [String(uidA || ""), String(uidB || "")].sort().join("__");
}

function cleanupFriendChatSubscription() {
  if (friendChatUnsub) {
    friendChatUnsub();
    friendChatUnsub = null;
  }
}

function closeFriendChatModal() {
  cleanupFriendChatSubscription();
  currentFriendChatId = "";
  currentFriendTarget = null;
  if (els.friendChatModal) {
    els.friendChatModal.classList.remove("friendChatModal--open");
    els.friendChatModal.setAttribute("aria-hidden", "true");
  }
  if (els.friendChatMessages) {
    els.friendChatMessages.innerHTML = "";
  }
  if (els.friendChatTargetName) {
    els.friendChatTargetName.textContent = "友だちを選んでチャットを開始";
  }
}

async function openFriendChatModal(target = null) {
  if (!state.user) {
    openAuthModal("login");
    return;
  }
  if (els.friendChatModal) {
    els.friendChatModal.classList.add("friendChatModal--open");
    els.friendChatModal.setAttribute("aria-hidden", "false");
  }
  await loadFriends();
  await renderFriendChatFriendList(target?.friendId || "");
  if (target?.friendId) {
    await openConversationWithFriend(target.friendId, target.friendName || "");
  }
}

async function renderFriendChatFriendList(activeFriendId = "") {
  if (!els.friendChatFriendsList) return;
  if (!state.friends.length) {
    els.friendChatFriendsList.innerHTML = `<div class="listItem listItem--empty">友だちがいません</div>`;
    return;
  }

  let users = [];
  try {
    users = await getUsersByIds(state.friends);
  } catch (error) {
    console.warn("friend chat users load failed:", error);
  }
  state.friendUsers = users;
  els.friendChatFriendsList.innerHTML = users
    .map((u) => {
      const name = u.name || u.email?.split("@")[0] || "ユーザー";
      const active = String(u.id) === String(activeFriendId) ? " friendChatFriend--active" : "";
      return `<button class="friendChatFriend${active}" type="button" data-friend-id="${escapeHtml(String(u.id || ""))}" data-friend-name="${escapeHtml(name)}">${escapeHtml(name)}</button>`;
    })
    .join("");

  els.friendChatFriendsList.querySelectorAll(".friendChatFriend").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const friendId = String(btn.getAttribute("data-friend-id") || "");
      const friendName = String(btn.getAttribute("data-friend-name") || "");
      await openConversationWithFriend(friendId, friendName);
      els.friendChatFriendsList
        .querySelectorAll(".friendChatFriend")
        .forEach((el) => el.classList.toggle("friendChatFriend--active", el === btn));
    });
  });
}

async function openConversationWithFriend(friendId, friendName) {
  const fb = getFirebase();
  const myId = getCurrentUserId();
  if (!fb || !myId || !friendId) return;

  cleanupFriendChatSubscription();
  currentFriendTarget = { id: friendId, name: friendName || "友だち" };
  currentFriendChatId = getFriendChatId(myId, friendId);
  try {
    await fb.db.collection("friend_chats").doc(currentFriendChatId).set(
      {
        users: [myId, friendId],
        updated_at: window.firebase.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  } catch (error) {
    console.warn("init friend chat doc failed:", error);
  }
  if (els.friendChatTargetName) {
    els.friendChatTargetName.textContent = `与 ${currentFriendTarget.name} チャット中`;
  }
  if (els.friendChatMessages) {
    els.friendChatMessages.innerHTML = `<div class="listItem listItem--empty">読み込み中...</div>`;
  }

  const messagesRef = fb.db.collection("friend_chats").doc(currentFriendChatId).collection("messages");
  friendChatUnsub = messagesRef
    .orderBy("created_at", "asc")
    .limitToLast(120)
    .onSnapshot(
      (snap) => {
        if (!els.friendChatMessages) return;
        if (snap.empty) {
          els.friendChatMessages.innerHTML = `<div class="listItem listItem--empty">まだメッセージがありません。挨拶してみましょう</div>`;
          return;
        }
        els.friendChatMessages.innerHTML = snap.docs
          .map((doc) => {
            const row = doc.data() || {};
            const isSelf = String(row.from_user_id || "") === String(myId);
            const name = isSelf ? "あなた" : (currentFriendTarget?.name || "友だち");
            const ts = row.created_at && typeof row.created_at.toDate === "function" ? row.created_at.toDate() : null;
            const time = ts ? ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";
            const cls = isSelf ? "friendChatMsg friendChatMsg--self" : "friendChatMsg";
            return `<div class="${cls}"><div class="friendChatMsg__meta">${escapeHtml(name)} ${escapeHtml(time)}</div><div>${escapeHtml(String(row.message || ""))}</div></div>`;
          })
          .join("");
        els.friendChatMessages.scrollTop = els.friendChatMessages.scrollHeight;
      },
      (error) => {
        console.warn("friend chat subscribe failed:", error);
        if (els.friendChatMessages) {
          const msg = escapeHtml(String(error?.message || "メッセージの読み込みに失敗しました"));
          els.friendChatMessages.innerHTML = `<div class="listItem listItem--empty">${msg}</div>`;
        }
      }
    );
}

async function sendFriendChatMessage() {
  const fb = getFirebase();
  const myId = getCurrentUserId();
  const text = String(els.friendChatInput?.value || "").trim();
  if (!fb || !myId || !currentFriendChatId || !currentFriendTarget?.id || !text) return;
  try {
    await fb.db.collection("friend_chats").doc(currentFriendChatId).set(
      {
        users: [myId, currentFriendTarget.id],
        updated_at: window.firebase.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    await fb.db.collection("friend_chats").doc(currentFriendChatId).collection("messages").add({
      from_user_id: myId,
      to_user_id: currentFriendTarget.id,
      message: text,
      created_at: window.firebase.firestore.FieldValue.serverTimestamp(),
    });
    if (els.friendChatInput) els.friendChatInput.value = "";
  } catch (error) {
    console.warn("send friend chat failed:", error);
    toast("送信失敗：" + (error?.message || "不明なエラー"));
  }
}

async function renderFriendRequests() {
  if (!els.friendRequests) return;
  if (!state.friendRequests.length) {
    els.friendRequests.innerHTML = "<div class=\"listItem listItem--empty\">処理待ちの申請はありません</div>";
    return;
  }
  const fromIds = state.friendRequests.map((r) => r.from_user_id);
  let users = [];
  try {
    users = await getUsersByIds(fromIds);
  } catch (error) {
    console.warn("Load request users:", error);
    return;
  }
  els.friendRequests.innerHTML = state.friendRequests
    .map((req) => {
      const fromUser = users.find((u) => u.id === req.from_user_id);
      if (!fromUser) return "";
      const name = fromUser.name || fromUser.email?.split("@")[0] || "ユーザー";
      return `
        <div class="listItem listItem--person">
          ${getUserAvatarHtml(fromUser)}
          <div class="listItem__meta">
            <div class="listItem__title listItem__title--full">${escapeHtml(name)}</div>
          </div>
          <div class="listItem__actions">
            <button class="btn btn--primary btn--small" data-action="accept" data-request-id="${req.id}" data-from-id="${req.from_user_id}">承認</button>
            <button class="btn btn--ghost btn--small" data-action="reject" data-request-id="${req.id}">拒否</button>
          </div>
        </div>
      `;
    })
    .join("");
  els.friendRequests.querySelectorAll("[data-action]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const action = btn.getAttribute("data-action");
      const requestId = btn.getAttribute("data-request-id");
      if (action === "accept") {
        const fromId = btn.getAttribute("data-from-id");
        await acceptFriendRequest(requestId, fromId);
      } else if (action === "reject") {
        await rejectFriendRequest(requestId);
      }
    });
  });
}

async function renderSearchResults(query) {
  if (!els.searchResults) return;
  if (!query?.trim()) {
    els.searchResults.innerHTML = "";
    return;
  }
  els.searchResults.innerHTML = "<div class=\"listItem listItem--empty\">検索中...</div>";
  
  // 检查ユーザー是否登录
  const fb = getFirebase();
  const myId = getCurrentUserId();
  if (!fb || !myId) {
    els.searchResults.innerHTML = "<div class=\"listItem listItem--empty\">先にログインしてください</div>";
    return;
  }
  
  
  let users = [];
  try {
    users = await searchUsers(query);
    console.log("搜索结果:", users, "查询:", query);
    
    if (users.length === 0) {
      els.searchResults.innerHTML = "<div class=\"listItem listItem--empty\">ユーザーが見つかりません</div>";
      return;
    }
  } catch (error) {
    console.error("検索エラー:", error);
    els.searchResults.innerHTML = "<div class=\"listItem listItem--empty\">検索エラー: " + (error.message || "不明なエラー") + "</div>";
    return;
  }
  let requests = [];
  let friends = [];
  try {
    const [reqSnap, friendSnap] = await Promise.all([
      fb.db.collection("friend_requests").where("from_user_id", "==", myId).where("status", "==", "pending").get(),
      fb.db.collection("friends").where("user_id", "==", myId).get(),
    ]);
    requests = reqSnap.docs.map((d) => d.data());
    friends = friendSnap.docs.map((d) => d.data());
  } catch (error) {
    console.error("加载友だち关系失败:", error);
  }
  const sentIds = new Set((requests || []).map((r) => r.to_user_id));
  const friendIds = new Set((friends || []).map((f) => f.friend_id));
  els.searchResults.innerHTML = users
    .map((u) => {
      const name = u.name || u.user_metadata?.name || u.email?.split("@")[0] || "ユーザー";
      const isFriend = friendIds.has(u.id);
      const hasRequest = sentIds.has(u.id);
      let actionBtn = "";
      if (isFriend) {
        actionBtn = '<span class="muted">すでに友だちです</span>';
      } else if (hasRequest) {
        actionBtn = '<span class="muted">申請送信済み</span>';
      } else {
        actionBtn = `<button class="btn btn--primary btn--small" data-action="add" data-user-id="${u.id}">添加友だち</button>`;
      }
      return `
        <div class="listItem listItem--person">
          ${getUserAvatarHtml(u)}
          <div class="listItem__meta">
            <div class="listItem__title listItem__title--full">${escapeHtml(name)}</div>
          </div>
          <div class="listItem__actions">${actionBtn}</div>
        </div>
      `;
    })
    .join("");
  els.searchResults.querySelectorAll("[data-action='add']").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const userId = btn.getAttribute("data-user-id");
      await sendFriendRequest(userId);
      renderSearchResults(query);
    });
  });
}

function openAuthModal(tab = "login") {
  if (!els.authModal) return;
  els.authModal.classList.add("authModal--open");
  els.authModal.setAttribute("aria-hidden", "false");
  if (tab === "signup") {
    switchAuthTab("signup");
  } else {
    switchAuthTab("login");
  }
}

function closeAuthModal() {
  if (!els.authModal) return;
  els.authModal.classList.remove("authModal--open");
  els.authModal.setAttribute("aria-hidden", "true");
  if (els.loginError) els.loginError.textContent = "";
  if (els.signupError) els.signupError.textContent = "";
  if (els.loginEmail) els.loginEmail.value = "";
  if (els.loginPassword) els.loginPassword.value = "";
  if (els.signupEmail) els.signupEmail.value = "";
  if (els.signupPassword) els.signupPassword.value = "";
  if (els.signupName) els.signupName.value = "";
}

function switchAuthTab(tab) {
  if (tab === "signup") {
    if (els.authTabLogin) els.authTabLogin.classList.remove("authModal__tab--active");
    if (els.authTabSignup) els.authTabSignup.classList.add("authModal__tab--active");
    if (els.authFormLogin) els.authFormLogin.style.display = "none";
    if (els.authFormSignup) els.authFormSignup.style.display = "block";
  } else {
    if (els.authTabLogin) els.authTabLogin.classList.add("authModal__tab--active");
    if (els.authTabSignup) els.authTabSignup.classList.remove("authModal__tab--active");
    if (els.authFormLogin) els.authFormLogin.style.display = "block";
    if (els.authFormSignup) els.authFormSignup.style.display = "none";
  }
}

/* ---------------------------
 * 启动
 * --------------------------- */
async function init() {
  await loadTracksFromTxt();
  mountTopNavEveryPage();
  ensureChatOverlayMounted();
  bind();
  updateVolumeButtonIcon(1);
  updateRepeatButtonIcon(state.repeatMode);
  closeChatUserMenu();
  closeChatUserProfileCard();
  if (els.chatUserMenu) els.chatUserMenu.style.display = "none";
  if (els.chatUserProfileCard) els.chatUserProfileCard.style.display = "none";
  bgFX.resize();
  bgFX.start();
  bgFX.setBreathing(false);

  // 保持滑动提示始终显示（不再自动隐藏）
  const swipeHint = document.getElementById("swipeHint");
  if (swipeHint) {
    // 确保提示始终显示
    swipeHint.style.display = "flex";
    swipeHint.classList.remove("hidden");
  }

  // 检查登录状态
  checkAuthSession();
  
  // 监听 auth 状态变化
  const fb = getFirebase();
  if (fb) {
    fb.auth.onAuthStateChanged(async (user) => {
      if (user) {
        state.user = user;
        updateUserUI(true);
        await ensureUserRecord(user);
      } else {
        state.user = null;
        updateUserUI(false);
      }
    });
  }

  // 仅根据 URL 决定：有 ?mood= 或 #mood 才打开该心情页，否则一律显示首页（不再用 localStorage 恢复）
  const initial = getUrlMood();
  if (initial) {
    setMood(initial, { autoplay: false, pushUrl: true, burst: true, burstOrigin: null });
  } else {
    showPick();
  }
}

init();
