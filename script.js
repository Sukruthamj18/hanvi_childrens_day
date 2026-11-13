import gsap from "gsap";

const fxLayer = document.getElementById("fxLayer");
const scenes = {
  door: document.getElementById("sceneDoor"),
  welcome: document.getElementById("sceneWelcome"),
  flowers: document.getElementById("sceneFlowers"),
  party: document.getElementById("sceneParty"),
  gallery: document.getElementById("sceneGallery"),
  finale: document.getElementById("sceneFinale"),
};

const openDoor = document.getElementById("openDoor");
const hugBtn = document.getElementById("hugBtn");
const toFlowers = document.getElementById("toFlowers");
const acceptFlowers = document.getElementById("acceptFlowers");
const toChocolates = document.getElementById("toChocolates");
const acceptChocolates = document.getElementById("acceptChocolates");
const toGallery = document.getElementById("toGallery");
const toFinale = document.getElementById("toFinale");
const startFight = document.getElementById("startFight");
const endingBlock = document.getElementById("endingBlock");
const replayStory = document.getElementById("replayStory");
const hugHint = document.getElementById("hugHint");
const fightImpact = document.getElementById("fightImpact");
const galleryTitle = document.getElementById("galleryTitle");
const galleryCaption = document.getElementById("galleryCaption");
const galleryDots = [...document.querySelectorAll("#galleryDots span")];
const gallerySlides = [...document.querySelectorAll(".gallery-slide")];

let speaking = false;
let voiceReady = false;
let cuteVoice = null;
let speakToken = 0;
let galleryRunId = 0;

const CUTE = { pitch: 1.28, rate: 0.98 };

const GALLERY_LINES = [
  {
    title: "Shine bright, Hanvi!",
    caption: "In your golden dress you look like a little princess. May your days stay this beautiful!",
    voice: "Shine bright, Hanvi! In your golden dress you look like a little princess!",
  },
  {
    title: "A heart full of love",
    caption: "That sweet smile with your family is pure magic. Wishing you hugs, laughter and endless love!",
    voice: "A heart full of love! That sweet smile is pure magic, Hanvi!",
  },
  {
    title: "Adventure queen!",
    caption: "Always ready for fun and play. May your childhood be full of giggles, games and wonder!",
    voice: "Adventure queen Hanvi! May your childhood be full of giggles and wonder!",
  },
  {
    title: "Clever little star",
    caption: "Your crafts and ideas are so special. Keep creating, dreaming and making the world brighter!",
    voice: "Clever little star Hanvi! Keep creating and dreaming!",
  },
];

const FLOWERS = ["🌸", "🌼", "🌺", "🌷", "💮", "🌻", "✨"];
const CHOCOLATES = ["🍫", "🍬", "🍭", "🧁", "✨", "💖"];
const SPARKLES = ["✨", "★", "✧", "💫", "🌟"];
const SNOW = ["❄️", "❅", "✦", "✨"];

function sprinkleStars() {
  const host = document.getElementById("stars");
  const count = window.matchMedia("(max-width: 600px)").matches ? 40 : 80;
  for (let i = 0; i < count; i++) {
    const star = document.createElement("span");
    star.className = i % 11 === 0 ? "star big" : "star";
    star.style.left = `${Math.random() * 100}%`;
    star.style.top = `${Math.random() * 100}%`;
    star.style.setProperty("--dur", `${1.4 + Math.random() * 3}s`);
    star.style.animationDelay = `${Math.random() * 3}s`;
    host.appendChild(star);
  }
}

function sprinkleFireflies() {
  const host = document.getElementById("fireflies");
  for (let i = 0; i < 16; i++) {
    const f = document.createElement("i");
    f.className = "firefly";
    f.style.left = `${Math.random() * 100}%`;
    f.style.top = `${Math.random() * 100}%`;
    f.style.setProperty("--f-dur", `${3 + Math.random() * 5}s`);
    f.style.animationDelay = `${Math.random() * 5}s`;
    host.appendChild(f);
  }
}

function scoreCuteVoice(v) {
  const n = `${v.name} ${v.lang}`;
  let score = 0;
  if (/^Samantha\b/i.test(v.name)) score += 100;
  if (/Google UK English Female/i.test(n)) score += 95;
  if (/Google US English/i.test(n) && !/Male/i.test(n)) score += 88;
  if (/Karen|Moira|Tessa|Fiona|Victoria|Kathy|Zira/i.test(v.name)) score += 85;
  if (/female/i.test(n)) score += 50;
  if (/en-/i.test(v.lang)) score += 20;
  if (/whisper|princess|bubbles|zarvox|horror/i.test(n)) score -= 200;
  if (/male|david|mark|daniel|fred|tom/i.test(n) && !/female/i.test(n)) score -= 100;
  return score;
}

function pickVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  if (!voices.length) return cuteVoice;
  cuteVoice = [...voices].sort((a, b) => scoreCuteVoice(b) - scoreCuteVoice(a))[0] || null;
  return cuteVoice;
}

function stopSpeaking() {
  speakToken += 1;
  speaking = false;
  window.speechSynthesis?.cancel();
}

function speak(text, { onend } = {}) {
  const myToken = ++speakToken;
  let finished = false;
  let keepAlive = null;
  const done = () => {
    if (finished || myToken !== speakToken) return;
    finished = true;
    speaking = false;
    if (keepAlive) clearInterval(keepAlive);
    onend?.();
  };
  if (!window.speechSynthesis) {
    done();
    return;
  }
  window.speechSynthesis.cancel();
  speaking = true;
  const utter = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) {
    utter.voice = voice;
    utter.lang = voice.lang || "en-US";
  } else {
    utter.lang = "en-US";
  }
  // Slightly slower so cute lines finish clearly
  utter.pitch = CUTE.pitch;
  utter.rate = Math.min(CUTE.rate, 0.92);
  utter.onend = done;
  utter.onerror = done;
  // Long safety net only — never cut a greeting short
  const safetyMs = Math.min(45000, 6000 + text.length * 140);
  setTimeout(() => {
    if (myToken === speakToken) done();
  }, safetyMs);
  setTimeout(() => {
    if (myToken !== speakToken) return;
    window.speechSynthesis.speak(utter);
    // Chrome can pause mid-sentence — keep it alive until onend
    keepAlive = setInterval(() => {
      if (myToken !== speakToken || finished) {
        clearInterval(keepAlive);
        return;
      }
      if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
    }, 200);
  }, 60);
}

function speakAsync(text) {
  return new Promise((resolve) => speak(text, { onend: resolve }));
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function warmVoices() {
  if (!window.speechSynthesis) return;
  const load = () => {
    pickVoice();
    voiceReady = true;
  };
  load();
  window.speechSynthesis.onvoiceschanged = load;
}

function shower(items, count = 36) {
  for (let i = 0; i < count; i++) {
    const bit = document.createElement("span");
    bit.className = "fx-bit";
    bit.textContent = items[Math.floor(Math.random() * items.length)];
    bit.style.left = `${Math.random() * 100}%`;
    bit.style.fontSize = `${1 + Math.random() * 1.5}rem`;
    fxLayer.appendChild(bit);
    gsap.fromTo(
      bit,
      { y: -30, opacity: 1 },
      {
        y: window.innerHeight + 50,
        x: (Math.random() - 0.5) * 200,
        rotation: 400 + Math.random() * 300,
        opacity: 0.15,
        duration: 2.8 + Math.random() * 3,
        delay: Math.random() * 0.8,
        ease: "power1.in",
        onComplete: () => bit.remove(),
      }
    );
  }
}

function burstHearts(count = 16) {
  const host = document.getElementById("hugHearts");
  if (!host) return;
  for (let i = 0; i < count; i++) {
    const h = document.createElement("span");
    h.className = "hug-heart";
    h.textContent = ["💗", "💖", "💕", "✨"][i % 4];
    h.style.left = `${20 + Math.random() * 60}%`;
    h.style.top = `${40 + Math.random() * 30}%`;
    host.appendChild(h);
    gsap.fromTo(
      h,
      { opacity: 1, y: 0, scale: 0.5 },
      {
        opacity: 0,
        y: -90,
        x: (Math.random() - 0.5) * 80,
        scale: 1.3,
        duration: 1.2,
        ease: "power2.out",
        onComplete: () => h.remove(),
      }
    );
  }
}

function showScene(key) {
  Object.entries(scenes).forEach(([name, el]) => {
    if (!el) return;
    const active = name === key;
    el.hidden = !active;
    el.classList.toggle("is-active", active);
  });
  document.querySelectorAll("video").forEach((vid) => {
    const inActive = scenes[key]?.contains(vid);
    if (inActive) {
      vid.currentTime = 0;
      vid.play()?.catch?.(() => {});
    } else {
      vid.pause();
    }
  });
}

async function transitionTo(key, enterAnim) {
  const current = Object.values(scenes).find((s) => s?.classList.contains("is-active"));
  if (current) await gsap.to(current, { opacity: 0, duration: 0.35, ease: "power2.in" });
  showScene(key);
  const next = scenes[key];
  gsap.set(next, { opacity: 0 });
  await gsap.to(next, { opacity: 1, duration: 0.55, ease: "power3.out" });
  enterAnim?.(next);
}

async function startWelcome() {
  hugBtn.hidden = false;
  toFlowers.hidden = true;
  if (hugHint) hugHint.textContent = "A magical hug is waiting for you.";
  gsap.set("#mashaWelcome", { clearProps: "all" });

  await transitionTo("welcome", () => {
    gsap.fromTo("#mashaWelcome", { x: -60, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease: "back.out(1.3)" });
    gsap.from("#hugHud", { y: 24, opacity: 0, duration: 0.6, delay: 0.15 });
  });
  shower(SPARKLES, 20);
  speak("Hi! Welcome, Hanvi! Come here for a big warm hug!");
}

function doHug() {
  const masha = document.getElementById("mashaWelcome");
  if (!masha) return;
  hugBtn.hidden = true;
  if (hugHint) hugHint.textContent = "Aww — biggest hug for Hanvi!";
  const mobile = window.matchMedia("(max-width: 720px)").matches;

  gsap
    .timeline({
      onComplete: () => {
        burstHearts(18);
        shower(["💗", "✨", "💖"], 28);
        toFlowers.hidden = false;
        gsap.fromTo(toFlowers, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(2)" });
        speak("Mmm! Big hug for Hanvi! You are so special!");
      },
    })
    .to(masha, {
      x: mobile ? 0 : "14vw",
      y: mobile ? "-4vh" : "-3vh",
      scale: 1.08,
      duration: 0.85,
      ease: "power2.inOut",
    });
}

async function startFlowers() {
  toChocolates.hidden = true;
  acceptFlowers.hidden = false;
  await transitionTo("flowers", () => {
    gsap.from(".scene-flowers .fs-hud", { y: 20, opacity: 0, duration: 0.55 });
  });
  speak("Hanvi, I want to give you flowers! Especially for you!");
}

function giveFlowers() {
  shower(FLOWERS, 50);
  speak("For you, Hanvi! Pretty flowers from Masha!");
  acceptFlowers.hidden = true;
  toChocolates.hidden = false;
  gsap.fromTo(toChocolates, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 });
}

async function startParty() {
  toGallery.hidden = true;
  acceptChocolates.hidden = false;
  await transitionTo("party", () => {
    gsap.from(".scene-party .fs-hud", { y: 20, opacity: 0, duration: 0.55 });
  });
  speak("Happy Children's Day, Hanvi! Masha has chocolates just for you!");
}

function giveChocolates() {
  shower(CHOCOLATES, 45);
  shower(SPARKLES, 20);
  speak("Chocolates for Hanvi! Yummy chocolates just for you!");
  acceptChocolates.hidden = true;
  toGallery.hidden = false;
  gsap.fromTo(toGallery, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 });
}

function setGallerySlide(i) {
  gallerySlides.forEach((s, idx) => s.classList.toggle("is-active", idx === i));
  galleryDots.forEach((d, idx) => d.classList.toggle("is-on", idx === i));
  const line = GALLERY_LINES[i];
  if (galleryTitle) galleryTitle.textContent = line.title;
  if (galleryCaption) galleryCaption.textContent = line.caption;
  return line;
}

async function startGallery() {
  const runId = ++galleryRunId;
  toFinale.hidden = true;
  setGallerySlide(0);

  await transitionTo("gallery", () => {
    gsap.fromTo("#mashaPresenter", { x: -80, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease: "back.out(1.2)" });
    gsap.from("#galleryHud", { y: 20, opacity: 0, duration: 0.55, delay: 0.1 });
  });
  if (runId !== galleryRunId) return;

  for (let i = 0; i < gallerySlides.length; i++) {
    if (runId !== galleryRunId) return;
    const line = setGallerySlide(i);
    await speakAsync(line.voice);
    if (runId !== galleryRunId) return;
    await wait(1600); // pause so wish can land before next photo
  }

  if (runId !== galleryRunId) return;
  toFinale.hidden = false;
  gsap.fromTo(toFinale, { y: 10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.35 });
  speak("Happy Children's Day, Hanvi! Keep shining!");
}

async function startFinaleScene() {
  galleryRunId += 1;
  endingBlock.hidden = true;
  startFight.hidden = false;
  if (fightImpact) {
    fightImpact.textContent = "";
    gsap.set(fightImpact, { opacity: 0 });
  }
  await transitionTo("finale", () => {
    gsap.from("#fightHud", { y: 20, opacity: 0, duration: 0.55 });
  });
  speak("Oh no! A real play fight! Masha versus Bear!");
}

async function runFight() {
  startFight.hidden = true;
  shower(SNOW, 60);
  shower(SPARKLES, 25);
  const vid = document.getElementById("fightImg");
  const impacts = ["BAM!", "WHOOSH!", "POW!", "HA!"];

  const animDone = new Promise((resolve) => {
    gsap
      .timeline({
        onComplete: () => {
          if (fightImpact) gsap.to(fightImpact, { opacity: 0, duration: 0.25 });
          resolve();
        },
      })
      .to(vid, { x: -16, rotation: -4, duration: 0.12, yoyo: true, repeat: 10, ease: "power1.inOut" })
      .call(() => {
        if (!fightImpact) return;
        fightImpact.textContent = impacts[Math.floor(Math.random() * impacts.length)];
        gsap.fromTo(fightImpact, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1.15, duration: 0.2, yoyo: true, repeat: 1 });
      }, null, 0.3)
      .to({}, { duration: 1.4 });
  });

  // Let the fight line finish fully before the goodbye
  await speakAsync("Haha! What a real playful fight! Happy Children's Day, Hanvi!");
  await animDone;
  await wait(400);
  await endStory();
}

async function endStory() {
  endingBlock.hidden = false;
  shower(SPARKLES, 35);
  gsap.fromTo(endingBlock, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.55 });
  await speakAsync(
    "Happy Children's Day this year, Hanvi! Wishing you love, laughter, and lots of magic. Bye bye, Hanvi!"
  );
}

async function replay() {
  stopSpeaking();
  galleryRunId += 1;
  endingBlock.hidden = true;
  await transitionTo("door", () => {
    gsap.from(".fs-copy", { opacity: 0, scale: 0.95, duration: 0.5 });
  });
}

sprinkleStars();
sprinkleFireflies();
warmVoices();
gsap.from(".fs-copy", { opacity: 0, y: 22, duration: 0.9, ease: "power3.out" });

openDoor.addEventListener("click", () => {
  if (!voiceReady) warmVoices();
  const panel = openDoor.querySelector(".door-panel");
  gsap.to(panel, {
    rotateY: -70,
    transformOrigin: "left center",
    duration: 0.45,
    ease: "power2.in",
    onComplete: () => {
      gsap.set(panel, { rotateY: 0 });
      startWelcome();
    },
  });
  shower(SPARKLES, 16);
});

hugBtn?.addEventListener("click", () => {
  stopSpeaking();
  doHug();
});
toFlowers?.addEventListener("click", () => {
  stopSpeaking();
  startFlowers();
});
acceptFlowers?.addEventListener("click", giveFlowers);
toChocolates?.addEventListener("click", () => {
  stopSpeaking();
  startParty();
});
acceptChocolates?.addEventListener("click", giveChocolates);
toGallery?.addEventListener("click", () => {
  stopSpeaking();
  startGallery();
});
toFinale?.addEventListener("click", () => {
  stopSpeaking();
  startFinaleScene();
});
startFight?.addEventListener("click", runFight);
replayStory?.addEventListener("click", replay);
