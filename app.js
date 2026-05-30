const checkpoints = [
  {
    id: 1,
    name: "路地の小さな飲食店",
    prefecture: "東京都",
    placeName: "新宿西口思い出横丁",
    image: "https://images.unsplash.com/photo-1554797589-7241bb691973?auto=format&fit=crop&w=1000&q=80",
    difficulty: 2,
    radius: 500,
    points: 70,
    lat: 35.6817,
    lng: 139.7689,
  },
  {
    id: 2,
    name: "川沿いの小さなベーカリー",
    prefecture: "東京都",
    placeName: "丸の内ベーカリー",
    image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1000&q=80",
    difficulty: 1,
    radius: 300,
    points: 50,
    lat: 35.6841,
    lng: 139.7626,
  },
  {
    id: 3,
    name: "路地にある古い看板",
    prefecture: "京都府",
    placeName: "京都 先斗町",
    image: "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?auto=format&fit=crop&w=1000&q=80",
    difficulty: 3,
    radius: 900,
    points: 110,
    lat: 35.6767,
    lng: 139.7657,
  },
];

const sampleReviews = [
  {
    checkpoint: "路地の小さな飲食店",
    prefecture: "東京都",
    placeName: "新宿西口思い出横丁",
    catchCopy: "灯りに誘われて、もう一軒寄り道したくなる路地",
    rating: 4,
    comment: "灯りがきれいで、歩いているだけでも楽しい路地でした。",
    image: checkpoints[0].image,
  },
  {
    checkpoint: "川沿いの小さなベーカリー",
    prefecture: "東京都",
    placeName: "丸の内ベーカリー",
    catchCopy: "朝の散歩が少し特別になる、香ばしい寄り道",
    rating: 5,
    comment: "焼きたての香りが外までしていました。朝の寄り道にちょうどいいです。",
    image: checkpoints[1].image,
  },
  {
    checkpoint: "路地にある古い看板",
    prefecture: "京都府",
    placeName: "京都 先斗町",
    catchCopy: "見上げた先に、昔のまちの気配が残っている",
    rating: 3,
    comment: "少し見つけにくいけれど、看板の雰囲気がよかったです。",
    image: checkpoints[2].image,
  },
];

const state = {
  currentIndex: 0,
  clears: 0,
  score: 0,
  rating: 3,
  secondsLeft: 30 * 60,
  timerId: null,
  userLocation: { lat: 35.6812, lng: 139.7671 },
  demoLocation: true,
  locationWatchId: null,
  reviews: [],
  runStarted: false,
  runSaved: false,
  map: null,
  userMarker: null,
  rangeCircle: null,
};

const ADMIN_PASSWORD = "machiroge";

const els = {
  homeView: document.querySelector("#home-view"),
  playView: document.querySelector("#play-view"),
  reviewView: document.querySelector("#review-view"),
  resultView: document.querySelector("#result-view"),
  reviewsView: document.querySelector("#reviews-view"),
  adminView: document.querySelector("#admin-view"),
  photo: document.querySelector("#checkpoint-photo"),
  timer: document.querySelector("#timer"),
  difficulty: document.querySelector("#difficulty"),
  rangeLabel: document.querySelector("#range-label"),
  moreButton: document.querySelector("#more-button"),
  moreMenu: document.querySelector("#more-menu"),
  reportButton: document.querySelector("#report-button"),
  adminButton: document.querySelector("#admin-button"),
  adminDialog: document.querySelector("#admin-dialog"),
  adminLoginForm: document.querySelector("#admin-login-form"),
  adminPassword: document.querySelector("#admin-password"),
  adminError: document.querySelector("#admin-error"),
  closeAdminDialog: document.querySelector("#close-admin-dialog"),
  backToPlay: document.querySelector("#back-to-play"),
  reportCount: document.querySelector("#report-count"),
  reportList: document.querySelector("#report-list"),
  locationStatus: document.querySelector("#location-status"),
  locationRequestButton: document.querySelector("#location-request-button"),
  checkinButton: document.querySelector("#checkin-button"),
  refreshButton: document.querySelector("#refresh-button"),
  mainMenuButton: document.querySelector("#main-menu-button"),
  resultMenuButton: document.querySelector("#result-menu-button"),
  mainMenuDialog: document.querySelector("#main-menu-dialog"),
  closeMainMenu: document.querySelector("#close-main-menu"),
  menuRogaining: document.querySelector("#menu-rogaining"),
  menuReviews: document.querySelector("#menu-reviews"),
  menuEnd: document.querySelector("#menu-end"),
  reviewsBack: document.querySelector("#reviews-back"),
  publicReviewList: document.querySelector("#public-review-list"),
  reviewTabs: document.querySelector("#review-tabs"),
  reviewDetail: document.querySelector("#review-detail"),
  reviewForm: document.querySelector("#review-form"),
  photoInput: document.querySelector("#photo-input"),
  reviewPreview: document.querySelector("#review-preview"),
  photoUpload: document.querySelector(".photo-upload"),
  prefectureInput: document.querySelector("#prefecture-input"),
  placeInput: document.querySelector("#place-input"),
  catchCopyInput: document.querySelector("#catch-copy-input"),
  stars: document.querySelectorAll("#stars button"),
  commentInput: document.querySelector("#comment-input"),
  skipReview: document.querySelector("#skip-review"),
  toast: document.querySelector("#toast"),
  clearCount: document.querySelector("#clear-count"),
  scoreTotal: document.querySelector("#score-total"),
  photoCount: document.querySelector("#photo-count"),
  celebrationCopy: document.querySelector("#celebration-copy"),
  postedReviews: document.querySelector("#posted-reviews"),
  percentile: document.querySelector("#percentile"),
  restartButton: document.querySelector("#restart-button"),
  homeRogaining: document.querySelector("#home-rogaining"),
  homeReviews: document.querySelector("#home-reviews"),
  homeResult: document.querySelector("#home-result"),
  homeResultCopy: document.querySelector("#home-result-copy"),
  homeClearCount: document.querySelector("#home-clear-count"),
  homeScoreTotal: document.querySelector("#home-score-total"),
  homePhotoCount: document.querySelector("#home-photo-count"),
};

function currentCheckpoint() {
  return checkpoints[state.currentIndex];
}

function showView(view) {
  [els.homeView, els.playView, els.reviewView, els.resultView, els.reviewsView, els.adminView].forEach((screen) =>
    screen.classList.remove("active"),
  );
  view.classList.add("active");
}

function showPlay() {
  showView(els.playView);
  state.runStarted = true;
  state.runSaved = false;
  els.homeResult.hidden = true;
  if (!state.map) {
    initMap();
    requestLocation();
  }
  renderCheckpoint();
  startTimer();
  setTimeout(() => state.map?.invalidateSize(), 80);
}

async function showHome({ saveRun = false } = {}) {
  window.clearInterval(state.timerId);
  if (saveRun && state.runStarted && !state.runSaved) {
    await saveRunScoreToHome();
  }
  showView(els.homeView);
}

async function saveRunScoreToHome() {
  state.runSaved = true;
  els.homeClearCount.textContent = String(state.clears);
  els.homeScoreTotal.textContent = `${state.score}pt`;
  els.homePhotoCount.textContent = String(state.reviews.length);
  els.homeResult.hidden = false;

  if (state.score === 0) {
    els.homeResultCopy.textContent = "今日は下見でも大丈夫。気になった場所から、また歩き出せます。";
    return;
  }

  try {
    await window.machirogeStore.addScore({
      clears: state.clears,
      score: state.score,
      photoCount: state.reviews.length,
      durationSeconds: 30 * 60 - state.secondsLeft,
    });
    const percentile = await calculatePercentileFromSavedScores();
    els.homeResultCopy.textContent = makeCelebrationCopy(percentile);
  } catch {
    const percentile = calculateDemoPercentile();
    els.homeResultCopy.textContent = `スコア保存に失敗しました。デモ集計では上位${percentile}%です。`;
  }
}

function renderCheckpoint() {
  const point = currentCheckpoint();
  els.photo.src = point.image;
  els.difficulty.textContent = "★".repeat(point.difficulty) + "☆".repeat(3 - point.difficulty);
  state.secondsLeft = 30 * 60;
  updateTimer();
  updateDistanceState();
  updateMap();
}

function startTimer() {
  window.clearInterval(state.timerId);
  state.timerId = window.setInterval(() => {
    state.secondsLeft -= 1;
    updateTimer();
    if (state.secondsLeft <= 0) {
      finishRun();
    }
  }, 1000);
}

function updateTimer() {
  const minutes = Math.max(0, Math.floor(state.secondsLeft / 60));
  const seconds = Math.max(0, state.secondsLeft % 60);
  els.timer.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function initMap() {
  state.map = L.map("map", {
    zoomControl: false,
    attributionControl: false,
  }).setView([state.userLocation.lat, state.userLocation.lng], 15);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
  }).addTo(state.map);

  L.control.attribution({ prefix: false }).addAttribution("&copy; OpenStreetMap").addTo(state.map);
  updateMap();
  setTimeout(() => {
    state.map.invalidateSize();
    updateMap();
  }, 120);
}

function updateMap() {
  if (!state.map || !window.L) return;
  const point = currentCheckpoint();
  const center = [state.userLocation.lat, state.userLocation.lng];

  state.map.setView(center, point.radius >= 800 ? 14 : 15);

  if (!state.userMarker) {
    state.userMarker = L.circleMarker(center, {
      radius: 8,
      color: "#ffffff",
      weight: 3,
      fillColor: "#2f6fed",
      fillOpacity: 1,
    }).addTo(state.map);
  } else {
    state.userMarker.setLatLng(center);
  }

  if (!state.rangeCircle) {
    state.rangeCircle = L.circle(center, {
      radius: point.radius,
      color: "#1f9d73",
      weight: 2,
      fillColor: "#1f9d73",
      fillOpacity: 0.13,
    }).addTo(state.map);
  } else {
    state.rangeCircle.setLatLng(center);
    state.rangeCircle.setRadius(point.radius);
  }
}

function requestLocation() {
  if (!window.isSecureContext) {
    state.demoLocation = true;
    els.locationStatus.textContent = "スマホで現在地を使うにはHTTPS公開が必要です。今はサンプル地点で表示しています。";
    showToast("現在地を使うにはHTTPSが必要です");
    return;
  }

  if (!navigator.geolocation) {
    els.locationStatus.textContent = "位置情報に対応していないため、サンプル地点で表示しています。";
    return;
  }

  els.locationStatus.textContent = "位置情報の許可後、現在地を中心に範囲円を表示します。";
  state.locationWatchId = navigator.geolocation.watchPosition(
    (position) => {
      state.userLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      state.demoLocation = false;
      updateMap();
      updateDistanceState();
      els.locationStatus.textContent = `現在地を更新中です。精度は約${Math.round(position.coords.accuracy)}mです。`;
    },
    () => {
      state.demoLocation = true;
      els.locationStatus.textContent = "位置情報が許可されていないため、サンプル地点で表示しています。";
      showToast("現在地はサンプル地点で表示しています");
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 5000 },
  );
}

function requestLocationFromButton() {
  if (state.locationWatchId !== null && !state.demoLocation) {
    showToast("現在地はすでに更新中です");
    return;
  }

  if (state.locationWatchId !== null) {
    navigator.geolocation.clearWatch(state.locationWatchId);
    state.locationWatchId = null;
  }

  requestLocation();
}

function completeCheckpoint() {
  const distance = distanceInMeters(state.userLocation, currentCheckpoint());
  if (!state.demoLocation && distance > 10) {
    showToast("もう少し近づくとチェックインできます");
    return;
  }

  const point = currentCheckpoint();
  state.clears += 1;
  state.score += point.points + point.difficulty * 10;
  window.clearInterval(state.timerId);
  resetReviewForm();
  showView(els.reviewView);
}

function refreshCheckpoint() {
  state.currentIndex = selectNextCheckpointIndex();
  renderCheckpoint();
  showToast("次の候補に切り替えました");
}

function selectNextCheckpointIndex() {
  const candidates = checkpoints
    .map((checkpoint, index) => ({
      index,
      distance: distanceInMeters(state.userLocation, checkpoint),
      difficulty: checkpoint.difficulty,
    }))
    .filter((candidate) => candidate.index !== state.currentIndex)
    .filter((candidate) => state.demoLocation || (candidate.distance >= 300 && candidate.distance <= 900))
    .sort((a, b) => b.difficulty - a.difficulty || a.distance - b.distance);

  if (candidates.length > 0) return candidates[0].index;
  return (state.currentIndex + 1) % checkpoints.length;
}

function updateDistanceState() {
  const distance = distanceInMeters(state.userLocation, currentCheckpoint());
  if (state.demoLocation) {
    els.rangeLabel.textContent = `${currentCheckpoint().radius}m圏内`;
    els.checkinButton.disabled = false;
    return;
  }

  if (distance <= 10) {
    els.rangeLabel.textContent = "ほぼ到着";
    els.checkinButton.disabled = false;
  } else if (distance <= 80) {
    els.rangeLabel.textContent = "かなり近い";
    els.checkinButton.disabled = true;
  } else if (distance <= currentCheckpoint().radius) {
    els.rangeLabel.textContent = "範囲内";
    els.checkinButton.disabled = true;
  } else {
    els.rangeLabel.textContent = "範囲外";
    els.checkinButton.disabled = true;
  }
}

function distanceInMeters(from, to) {
  const earthRadius = 6371000;
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

async function reportCurrentPhoto() {
  const point = currentCheckpoint();
  const report = {
    id: `${Date.now()}-${point.id}`,
    checkpoint: point.name,
    image: point.image,
    reason: "ユーザー通報",
    status: "open",
    createdAt: new Date().toLocaleString("ja-JP"),
  };
  try {
    await window.machirogeStore.addReport(report);
  } catch {
    showToast("通報の保存に失敗しました");
    return;
  }
  els.moreMenu.classList.remove("open");
  els.moreMenu.setAttribute("aria-hidden", "true");
  showToast("通報を受け付けました。この写真は確認対象になります");
}

async function readReports() {
  try {
    return await window.machirogeStore.listReports();
  } catch {
    showToast("通報一覧の読み込みに失敗しました");
    return [];
  }
}

async function renderAdmin() {
  const reports = await readReports();
  els.reportCount.textContent = String(reports.length);
  if (reports.length === 0) {
    els.reportList.innerHTML = `<p class="empty">現在、確認待ちの通報はありません。</p>`;
  } else {
    els.reportList.innerHTML = reports
      .map(
        (report) => `
          <article class="report-card">
            <img src="${report.image}" alt="${escapeHtml(report.checkpoint)}の通報写真" />
            <div class="report-card-body">
              <strong>${escapeHtml(report.checkpoint)}</strong>
              <p>${escapeHtml(report.reason)} / ${escapeHtml(report.createdAt)}</p>
              <p>誤通報なら取り下げ、不適切なら削除対応を選んでください。</p>
              <div class="report-actions">
                <button class="secondary-button" type="button" data-report-action="withdrawn" data-report-id="${escapeHtml(
                  report.id,
                )}">
                  <i data-lucide="undo-2"></i>
                  通報を取り下げ
                </button>
                <button class="primary-button" type="button" data-report-action="resolved" data-report-id="${escapeHtml(
                  report.id,
                )}">
                  <i data-lucide="trash-2"></i>
                  削除対応
                </button>
              </div>
            </div>
          </article>
        `,
      )
      .join("");
    els.reportList.querySelectorAll("[data-report-action]").forEach((button) => {
      button.addEventListener("click", () => {
        updateReportStatus(button.dataset.reportId, button.dataset.reportAction);
      });
    });
  }
  lucide.createIcons();
  showView(els.adminView);
}

async function updateReportStatus(reportId, status) {
  const label = status === "withdrawn" ? "通報を取り下げました" : "対応済みにしました";
  try {
    await window.machirogeStore.updateReportStatus(reportId, status);
    await renderAdmin();
    showToast(label);
  } catch {
    showToast("通報の更新に失敗しました");
  }
}

function openAdminLogin() {
  els.adminPassword.value = "";
  els.adminError.textContent = "";
  if (typeof els.adminDialog.showModal === "function") {
    els.adminDialog.showModal();
  } else {
    renderAdmin();
    return;
  }
  setTimeout(() => els.adminPassword.focus(), 50);
}

function closeAdminLogin() {
  els.adminDialog.close();
}

function resetReviewForm() {
  els.reviewForm.reset();
  els.reviewPreview.removeAttribute("src");
  els.photoUpload.classList.remove("has-image");
  els.prefectureInput.value = currentCheckpoint().prefecture || "東京都";
  els.placeInput.value = currentCheckpoint().placeName || "";
  els.catchCopyInput.value = "";
  els.commentInput.value = "";
  setRating(3);
}

function setRating(value) {
  state.rating = value;
  els.stars.forEach((star) => {
    star.classList.toggle("active", Number(star.dataset.rating) <= value);
  });
}

async function submitReview(skip = false) {
  const previewSrc = els.reviewPreview.getAttribute("src");
  const point = currentCheckpoint();
  if (!skip) {
    const review = {
      checkpoint: point.name,
      prefecture: els.prefectureInput.value,
      placeName: els.placeInput.value.trim() || point.placeName || point.name,
      catchCopy: els.catchCopyInput.value.trim() || makeCatchCopy(point.name),
      rating: state.rating,
      comment: els.commentInput.value.trim() || "口コミを投稿しました",
      image: previewSrc || point.image,
    };
    state.reviews.push(review);
    try {
      await savePublicReviews(review);
    } catch {
      showToast("口コミの保存に失敗しました");
      return;
    }
  }

  state.currentIndex = selectNextCheckpointIndex();
  renderCheckpoint();
  startTimer();
  showView(els.playView);
  setTimeout(() => state.map?.invalidateSize(), 80);
}

async function savePublicReviews(review) {
  await window.machirogeStore.addReview(review);
}

async function readPublicReviews() {
  try {
    return await window.machirogeStore.listReviews();
  } catch {
    showToast("口コミの読み込みに失敗しました");
    return [];
  }
}

async function finishRun() {
  window.clearInterval(state.timerId);
  els.clearCount.textContent = String(state.clears);
  els.scoreTotal.textContent = `${state.score}pt`;
  els.photoCount.textContent = String(state.reviews.length);
  els.celebrationCopy.textContent = state.score === 0 ? makeCelebrationCopy(null) : "スコアを保存して順位を集計しています。";
  els.percentile.textContent = state.score === 0 ? "次は最初の1か所を見つけに行きましょう" : "集計中...";
  renderReviews();
  showView(els.resultView);

  try {
    await window.machirogeStore.addScore({
      clears: state.clears,
      score: state.score,
      photoCount: state.reviews.length,
      durationSeconds: 30 * 60 - state.secondsLeft,
    });
    const percentile = await calculatePercentileFromSavedScores();
    els.celebrationCopy.textContent = makeCelebrationCopy(percentile);
    els.percentile.textContent =
      state.score === 0 ? "次は最初の1か所を見つけに行きましょう" : `現在あなたは全体の上位 ${percentile}% です`;
  } catch {
    const percentile = calculateDemoPercentile();
    els.celebrationCopy.textContent = makeCelebrationCopy(percentile);
    els.percentile.textContent =
      state.score === 0
        ? "次は最初の1か所を見つけに行きましょう"
        : `保存に失敗したため、デモ集計では上位 ${percentile}% です`;
    showToast("スコア保存に失敗しました");
  }
}

async function calculatePercentileFromSavedScores() {
  const scores = await window.machirogeStore.listScores();
  if (scores.length === 0) return calculateDemoPercentile();
  if (scores.length < 3) return null;
  const sorted = scores.map((entry) => entry.score).sort((a, b) => b - a);
  const rank = sorted.findIndex((score) => state.score >= score) + 1;
  const safeRank = rank > 0 ? rank : sorted.length;
  return Math.max(1, Math.round((safeRank / sorted.length) * 100));
}

function calculateDemoPercentile() {
  const demoParticipantScores = [20, 45, 70, 90, 115, 140, 170, 210, 260, 330];
  const lowerScoreCount = demoParticipantScores.filter((score) => score < state.score).length;
  const rankFromTop = demoParticipantScores.length - lowerScoreCount + 1;
  const participantCount = demoParticipantScores.length + 1;
  return Math.max(1, Math.round((rankFromTop / participantCount) * 100));
}

function makeCelebrationCopy(percentile) {
  if (state.score === 0) return "今日は下見でも大丈夫。気になった場所から、また歩き出せます。";
  if (percentile === null) return "クリアおめでとうございます！参加データが集まると、全体順位も表示されます。";
  if (percentile <= 20) return `すばらしい！あなたは上位${percentile}%です！`;
  if (percentile <= 50) return `クリアおめでとうございます！現在あなたは全体の上位${percentile}%です！`;
  return `クリアお疲れ様です！現在あなたは全体の上位${percentile}%です。さらなるハイスコアを目指しましょう！`;
}

function renderReviews() {
  if (state.reviews.length === 0) {
    els.postedReviews.innerHTML = `<p class="empty">今回は口コミ投稿なしで終了しました。</p>`;
    return;
  }

  els.postedReviews.innerHTML = state.reviews
    .map(
      (review) => `
        <article class="posted-review">
          <img src="${review.image}" alt="${review.checkpoint}の投稿写真" />
          <div>
            <strong>${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</strong>
            <p>${escapeHtml(review.comment)}</p>
          </div>
        </article>
      `,
    )
    .join("");
}

async function renderPublicReviews() {
  const publicReviews = [...(await readPublicReviews()), ...sampleReviews];
  const grouped = publicReviews.reduce((acc, review) => {
    const prefecture = review.prefecture || "未設定";
    acc[prefecture] = acc[prefecture] || [];
    acc[prefecture].push(review);
    return acc;
  }, {});
  const prefectures = Object.keys(grouped);
  const selectedPrefecture = prefectures[0];
  renderReviewTabs(prefectures, selectedPrefecture, grouped);
  renderReviewCards(grouped[selectedPrefecture] || []);
  lucide.createIcons();
  showView(els.reviewsView);
}

function renderReviewTabs(prefectures, selectedPrefecture, grouped) {
  els.reviewTabs.innerHTML = prefectures
    .map(
      (prefecture) => `
        <button class="review-tab ${prefecture === selectedPrefecture ? "active" : ""}" type="button" role="tab" data-prefecture="${escapeHtml(
          prefecture,
        )}">
          ${escapeHtml(prefecture)}
        </button>
      `,
    )
    .join("");

  els.reviewTabs.querySelectorAll(".review-tab").forEach((tabButton) => {
    tabButton.addEventListener("click", () => {
      els.reviewTabs.querySelectorAll(".review-tab").forEach((button) => button.classList.remove("active"));
      tabButton.classList.add("active");
      renderReviewCards(grouped[tabButton.dataset.prefecture] || []);
    });
  });
}

function renderReviewCards(reviews) {
  els.reviewDetail.hidden = true;
  els.reviewDetail.innerHTML = "";
  els.publicReviewList.hidden = false;
  els.publicReviewList.innerHTML = reviews
    .map(
      (review, index) => `
        <button class="public-review-card" type="button" data-review-index="${index}">
          <div class="public-review-body">
            <strong>${escapeHtml(review.catchCopy || makeCatchCopy(review.checkpoint))}</strong>
            <p>店名: ${escapeHtml(review.placeName || review.checkpoint)}</p>
            <p>${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</p>
            <p>${escapeHtml(review.comment)}</p>
          </div>
        </button>
      `,
    )
    .join("");

  els.publicReviewList.querySelectorAll(".public-review-card").forEach((card) => {
    card.addEventListener("click", () => {
      renderReviewDetail(reviews[Number(card.dataset.reviewIndex)]);
    });
  });
}

function renderReviewDetail(review) {
  const placeName = review.placeName || review.checkpoint;
  const prefecture = review.prefecture || "";
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${prefecture} ${placeName}`)}`;
  els.publicReviewList.hidden = true;
  els.reviewDetail.hidden = false;
  els.reviewDetail.innerHTML = `
    <img src="${review.image}" alt="${escapeHtml(placeName)}の口コミ写真" loading="lazy" />
    <div class="review-detail-body">
      <button class="secondary-button" id="review-detail-back" type="button">
        <i data-lucide="arrow-left"></i>
        一覧へ戻る
      </button>
      <h3>${escapeHtml(review.catchCopy || makeCatchCopy(review.checkpoint))}</h3>
      <p>店名: ${escapeHtml(placeName)}</p>
      <a class="map-link" href="${mapsUrl}" target="_blank" rel="noopener">
        <i data-lucide="map-pin"></i>
        Google Mapsで見る
      </a>
      <p>${"★".repeat(review.rating)}${"☆".repeat(5 - review.rating)}</p>
      <p>${escapeHtml(review.comment)}</p>
    </div>
  `;
  lucide.createIcons();
  document.querySelector("#review-detail-back").addEventListener("click", () => {
    els.reviewDetail.hidden = true;
    els.publicReviewList.hidden = false;
  });
}

function makeCatchCopy(seed) {
  if (seed.includes("ベーカリー")) return "ふと足を止めたくなる、焼きたてのある風景";
  if (seed.includes("看板")) return "探してみると見えてくる、まちの小さな記憶";
  return "歩いた人だけが見つける、まちのいい表情";
}

function openMainMenu() {
  if (typeof els.mainMenuDialog.showModal === "function") {
    els.mainMenuDialog.showModal();
  }
}

function closeMainMenu() {
  els.mainMenuDialog.close();
}

function restart() {
  state.currentIndex = 0;
  state.clears = 0;
  state.score = 0;
  state.reviews = [];
  renderCheckpoint();
  startTimer();
  showView(els.playView);
  setTimeout(() => state.map?.invalidateSize(), 80);
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    els.toast.classList.remove("show");
  }, 2600);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return map[char];
  });
}

els.moreButton.addEventListener("click", () => {
  const isOpen = els.moreMenu.classList.toggle("open");
  els.moreMenu.setAttribute("aria-hidden", String(!isOpen));
});

els.reportButton.addEventListener("click", reportCurrentPhoto);
els.adminButton.addEventListener("click", openAdminLogin);
els.closeAdminDialog.addEventListener("click", closeAdminLogin);
els.adminLoginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (els.adminPassword.value === ADMIN_PASSWORD) {
    closeAdminLogin();
    renderAdmin();
  } else {
    els.adminError.textContent = "パスワードが違います";
    els.adminPassword.select();
  }
});
els.backToPlay.addEventListener("click", () => {
  showView(els.playView);
  setTimeout(() => state.map?.invalidateSize(), 80);
});
els.checkinButton.addEventListener("click", completeCheckpoint);
els.refreshButton.addEventListener("click", refreshCheckpoint);
els.mainMenuButton.addEventListener("click", openMainMenu);
els.resultMenuButton.addEventListener("click", openMainMenu);
els.closeMainMenu.addEventListener("click", closeMainMenu);
els.menuRogaining.addEventListener("click", () => {
  closeMainMenu();
  showPlay();
});
els.menuReviews.addEventListener("click", () => {
  closeMainMenu();
  renderPublicReviews();
});
els.menuEnd.addEventListener("click", () => {
  closeMainMenu();
  showHome({ saveRun: true });
});
els.reviewsBack.addEventListener("click", () => {
  showHome();
});
els.locationRequestButton.addEventListener("click", requestLocationFromButton);
els.restartButton.addEventListener("click", restart);
els.homeRogaining.addEventListener("click", showPlay);
els.homeReviews.addEventListener("click", renderPublicReviews);

els.stars.forEach((star) => {
  star.addEventListener("click", () => setRating(Number(star.dataset.rating)));
});

els.photoInput.addEventListener("change", () => {
  const file = els.photoInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    els.reviewPreview.src = reader.result;
    els.photoUpload.classList.add("has-image");
  });
  reader.readAsDataURL(file);
});

els.reviewForm.addEventListener("submit", (event) => {
  event.preventDefault();
  submitReview(false);
});

els.skipReview.addEventListener("click", () => submitReview(true));

document.addEventListener("click", (event) => {
  if (!els.moreMenu.contains(event.target) && !els.moreButton.contains(event.target)) {
    els.moreMenu.classList.remove("open");
    els.moreMenu.setAttribute("aria-hidden", "true");
  }
});

window.addEventListener("load", () => {
  lucide.createIcons();
  renderCheckpoint();
  registerServiceWorker();
});

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("./service-worker.js").catch(() => {
    showToast("オフライン準備に失敗しました");
  });
}
