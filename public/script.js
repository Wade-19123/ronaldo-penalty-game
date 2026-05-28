const homeScreen = document.querySelector("#home-screen");
const fieldScreen = document.querySelector("#field-screen");
const mediaScreen = document.querySelector("#media-screen");
const shootoutScreen = document.querySelector("#shootout-screen");
const endScreen = document.querySelector("#end-screen");
const enterButton = document.querySelector("#enter-button");
const player = document.querySelector("#player");
const restartButton = document.querySelector("#restart-button");
const skipButton = document.querySelector("#skip-button");
const appealPanel = document.querySelector("#appeal-panel");
const appealChoices = document.querySelectorAll(".appeal-choice");
const goalZones = document.querySelectorAll(".goal-zone");
const mosaicResult = document.querySelector("#mosaic-result");
const mosaicText = document.querySelector("#mosaic-text");
const video = document.querySelector("#game-video");
const resultImage = document.querySelector("#result-image");
const cinemaFlash = document.querySelector("#cinema-flash");
const stageLabel = document.querySelector("#stage-label");
const varOverlay = document.querySelector("#var-overlay");
const endingKicker = document.querySelector("#ending-kicker");
const endingTitle = document.querySelector("#ending-title");
const endingCopy = document.querySelector("#ending-copy");

// Encode each filename so spaces and symbols like # are requested correctly.
function assetPath(fileName) {
  return `assets/${encodeURIComponent(fileName)}`;
}

const ASSETS = {
  diveVideo: assetPath("5月27日.mp4"),
  penaltyImage: assetPath("image penalty.png"),
  failImage: assetPath("image fail penalty.png"),
  shootoutImage: assetPath("penalty.jpeg"),
  cryVideo: assetPath("Cristiano Ronaldo crying in tunnel  4k free clips for editing  no watermark  #4k #fifa_144p.mp4"),
  siuVideo: assetPath("RONALDO SIU_144p.mp4")
};

const RESULT_DELAY_MS = 1900;
const MOSAIC_DELAY_MS = 1600;
const OPENING_FLASH_MS = 520;
const NORMAL_SPEED = 1;
const FAST_SPEED = 2;
let activeTimers = [];
let lastResult = "siuuu";

function showScreen(screen) {
  [homeScreen, fieldScreen, mediaScreen, shootoutScreen, endScreen].forEach((item) => item.classList.remove("active"));
  screen.classList.add("active");
}

function setStage(text) {
  stageLabel.textContent = text;
  stageLabel.classList.remove("pulse");
  window.requestAnimationFrame(() => stageLabel.classList.add("pulse"));
}

function flashCinema() {
  cinemaFlash.classList.remove("active");
  window.requestAnimationFrame(() => cinemaFlash.classList.add("active"));
}

function schedule(callback, delay) {
  const timer = setTimeout(() => {
    activeTimers = activeTimers.filter((item) => item !== timer);
    callback();
  }, delay);

  activeTimers.push(timer);
}

function hideMedia() {
  activeTimers.forEach(clearTimeout);
  activeTimers = [];
  video.pause();
  video.playbackRate = NORMAL_SPEED;
  skipButton.classList.remove("active");
  skipButton.textContent = "2x Speed";
  video.removeAttribute("src");
  video.load();
  video.classList.remove("visible");
  resultImage.removeAttribute("src");
  resultImage.classList.remove("visible");
  varOverlay.classList.remove("active");
  appealPanel.classList.remove("active");
  appealPanel.setAttribute("aria-hidden", "true");
  mediaScreen.classList.remove("playing");
  mosaicResult.classList.remove("active", "goal", "miss");
  goalZones.forEach((zone) => {
    zone.disabled = false;
    zone.classList.remove("chosen", "keeper");
  });
  cinemaFlash.classList.remove("active");
}

function playVideo(src, onEnded, label) {
  resultImage.classList.remove("visible");
  varOverlay.classList.remove("active");
  appealPanel.classList.remove("active");
  appealPanel.setAttribute("aria-hidden", "true");
  mediaScreen.classList.add("playing");
  video.classList.add("visible");
  video.src = src;
  video.currentTime = 0;
  video.playbackRate = NORMAL_SPEED;
  skipButton.classList.remove("active");
  skipButton.textContent = "2x Speed";
  video.onended = onEnded;
  setStage(label);
  video.onerror = () => {
    alert("Video failed to load. Please check that the file exists in public/assets.");
    finishGame();
  };

  // The first play starts from a user click, which allows browsers to play it with sound.
  video.play().catch(() => {
    video.muted = true;
    video.play();
  });
}

function showResultImage() {
  showAppealPanel();
}

function showAppealPanel() {
  video.classList.remove("visible");
  video.removeAttribute("src");
  video.load();
  mediaScreen.classList.remove("playing");
  setStage("Referee Pressure");
  appealPanel.classList.add("active");
  appealPanel.setAttribute("aria-hidden", "false");
}

function resolveVar(choice) {
  const penaltyChance = choice === "appeal" ? 0.7 : 0.6;
  appealPanel.classList.remove("active");
  appealPanel.setAttribute("aria-hidden", "true");
  setStage("VAR Check");
  varOverlay.classList.add("active");

  // Appeal raises the penalty chance to 70%; staying silent keeps the original 60%.
  const isPenalty = Math.random() < penaltyChance;
  resultImage.src = isPenalty ? ASSETS.penaltyImage : ASSETS.failImage;

  schedule(() => {
    flashCinema();
    varOverlay.classList.remove("active");
    resultImage.classList.add("visible");
    setStage(isPenalty ? "Penalty Awarded" : "Penalty Denied");
  }, 700);

  schedule(() => {
    if (isPenalty) {
      showShootout();
      return;
    }

    lastResult = "cry";
    playVideo(ASSETS.cryVideo, finishGame, "Penalty Denied");
  }, RESULT_DELAY_MS);
}

function showShootout() {
  hideMedia();
  showScreen(shootoutScreen);
  mosaicResult.classList.remove("active", "goal", "miss");
  goalZones.forEach((zone) => {
    zone.disabled = false;
    zone.classList.remove("chosen", "keeper");
  });
}

function takePenalty(event) {
  const shotDirection = event.currentTarget.dataset.shot;
  const keeperDirection = Math.random() < 0.5 ? "left" : "right";
  const isSaved = shotDirection === keeperDirection;

  goalZones.forEach((zone) => {
    zone.disabled = true;
    zone.classList.toggle("chosen", zone.dataset.shot === shotDirection);
    zone.classList.toggle("keeper", zone.dataset.shot === keeperDirection);
  });

  lastResult = isSaved ? "cry" : "siuuu";
  mosaicText.textContent = isSaved ? "No you miss the penalty" : "GOAL!!!";
  mosaicResult.classList.add("active", isSaved ? "miss" : "goal");

  schedule(() => {
    showScreen(mediaScreen);
    flashCinema();
    playVideo(
      isSaved ? ASSETS.cryVideo : ASSETS.siuVideo,
      finishGame,
      isSaved ? "Saved By Keeper" : "GOAL Replay"
    );
  }, MOSAIC_DELAY_MS);
}

function fastForwardVideo() {
  if (!video.classList.contains("visible")) {
    return;
  }

  const shouldSpeedUp = video.playbackRate === NORMAL_SPEED;
  video.playbackRate = shouldSpeedUp ? FAST_SPEED : NORMAL_SPEED;
  skipButton.classList.toggle("active", shouldSpeedUp);
  skipButton.textContent = shouldSpeedUp ? "1x Speed" : "2x Speed";
}

function startGame() {
  showScreen(mediaScreen);
  hideMedia();
  video.muted = false;
  setStage("Camera Rolling");
  flashCinema();

  schedule(() => {
    playVideo(ASSETS.diveVideo, showResultImage, "Pool Dive Replay");
  }, OPENING_FLASH_MS);
}

function finishGame() {
  hideMedia();
  if (lastResult === "siuuu") {
    endingKicker.textContent = "Final Whistle";
    endingTitle.textContent = "SIUUU Ending";
    endingCopy.textContent = "The referee pointed, the crowd blinked, and the celebration survived.";
  } else {
    endingKicker.textContent = "Tunnel Cam";
    endingTitle.textContent = "Crying Ending";
    endingCopy.textContent = "The penalty universe chose drama today.";
  }

  showScreen(endScreen);
}

function restartGame() {
  hideMedia();
  showScreen(homeScreen);
}

enterButton.addEventListener("click", () => showScreen(fieldScreen));
player.addEventListener("click", startGame);
restartButton.addEventListener("click", restartGame);
skipButton.addEventListener("click", fastForwardVideo);
appealChoices.forEach((button) => {
  button.addEventListener("click", () => resolveVar(button.dataset.choice));
});
goalZones.forEach((zone) => {
  zone.addEventListener("click", takePenalty);
});
