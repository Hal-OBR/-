class LocalMachirogeStore {
  constructor() {
    this.reviewKey = "machirogePublicReviews";
    this.reportKey = "machirogeReports";
    this.scoreKey = "machirogeScores";
    this.checkpointKey = "machirogeCheckpoints";
    this.userKey = "machirogeAnonymousUserId";
    this.userId = this.#getOrCreateUserId();
  }

  async listReviews() {
    return this.#read(this.reviewKey).filter((review) => (review.status || "public") === "public");
  }

  async addReview(review) {
    const reviews = this.#read(this.reviewKey);
    reviews.unshift({
      ...review,
      id: crypto.randomUUID?.() || String(Date.now()),
      anonymousUserId: this.userId,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(this.reviewKey, JSON.stringify(reviews));
  }

  async updateReviewStatus(reviewId, status) {
    const reviews = this.#read(this.reviewKey).map((review) =>
      review.id === reviewId ? { ...review, status, updatedAt: new Date().toISOString() } : review,
    );
    localStorage.setItem(this.reviewKey, JSON.stringify(reviews));
  }

  async listReports() {
    return this.#read(this.reportKey).filter((report) => (report.status || "open") === "open");
  }

  async addReport(report) {
    const reports = this.#read(this.reportKey);
    reports.unshift({ ...report, status: "open", anonymousUserId: this.userId });
    localStorage.setItem(this.reportKey, JSON.stringify(reports));
  }

  async updateReportStatus(reportId, status) {
    const reports = this.#read(this.reportKey).map((report) =>
      report.id === reportId ? { ...report, status, resolvedAt: new Date().toISOString() } : report,
    );
    localStorage.setItem(this.reportKey, JSON.stringify(reports));
  }

  async clearReports() {
    const reports = this.#read(this.reportKey).map((report) =>
      (report.status || "open") === "open" ? { ...report, status: "resolved", resolvedAt: new Date().toISOString() } : report,
    );
    localStorage.setItem(this.reportKey, JSON.stringify(reports));
  }

  async addScore(score) {
    const scores = this.#read(this.scoreKey);
    scores.unshift({
      ...score,
      id: crypto.randomUUID?.() || String(Date.now()),
      anonymousUserId: this.userId,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(this.scoreKey, JSON.stringify(scores));
  }

  async listScores() {
    return this.#read(this.scoreKey);
  }

  async listCheckpoints() {
    return this.#read(this.checkpointKey).filter((checkpoint) => (checkpoint.status || "active") === "active");
  }

  async addCheckpoint(checkpoint) {
    const imageUrl = await this.#saveLocalImageIfNeeded(checkpoint.image);
    const checkpoints = this.#read(this.checkpointKey);
    checkpoints.unshift({
      ...checkpoint,
      image: imageUrl,
      id: crypto.randomUUID?.() || String(Date.now()),
      status: "active",
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(this.checkpointKey, JSON.stringify(checkpoints));
  }

  async updateCheckpoint(checkpointId, patch) {
    const checkpoints = this.#read(this.checkpointKey).map((checkpoint) => {
      if (checkpoint.id !== checkpointId) return checkpoint;
      return {
        ...checkpoint,
        ...patch,
        updatedAt: new Date().toISOString(),
      };
    });
    localStorage.setItem(this.checkpointKey, JSON.stringify(checkpoints));
  }

  #read(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
      return [];
    }
  }

  #getOrCreateUserId() {
    const existing = localStorage.getItem(this.userKey);
    if (existing) return existing;
    const userId = crypto.randomUUID?.() || `anon-${Date.now()}`;
    localStorage.setItem(this.userKey, userId);
    return userId;
  }

  async #saveLocalImageIfNeeded(image) {
    return image;
  }
}

class SupabaseMachirogeStore {
  constructor(client, config) {
    this.client = client;
    this.config = config;
    this.userKey = "machirogeAnonymousUserId";
    this.userId = this.#getOrCreateUserId();
  }

  async listReviews() {
    const { data, error } = await this.client.from("reviews").select("*").eq("status", "public").order("created_at", {
      ascending: false,
    });
    if (error) throw error;
    return data.map((review) => ({
      id: review.id,
      checkpoint: review.checkpoint_name,
      prefecture: review.prefecture,
      placeName: review.place_name,
      catchCopy: review.catch_copy,
      rating: review.rating,
      comment: review.comment,
      image: review.image_url,
      createdAt: review.created_at,
    }));
  }

  async addReview(review) {
    const imageUrl = await this.#uploadImageIfNeeded(review.image);
    const { error } = await this.client.from("reviews").insert({
      checkpoint_name: review.checkpoint,
      prefecture: review.prefecture,
      place_name: review.placeName,
      catch_copy: review.catchCopy,
      rating: review.rating,
      comment: review.comment,
      image_url: imageUrl,
      anonymous_user_id: this.userId,
      status: "public",
    });
    if (error) throw error;
  }

  async updateReviewStatus(reviewId, status) {
    const { error } = await this.client.from("reviews").update({ status }).eq("id", reviewId);
    if (error) throw error;
  }

  async listReports() {
    const { data, error } = await this.client.from("reports").select("*").eq("status", "open").order("created_at", {
      ascending: false,
    });
    if (error) throw error;
    return data.map((report) => ({
      id: report.id,
      checkpoint: report.checkpoint_name,
      image: report.image_url,
      reason: report.reason,
      createdAt: new Date(report.created_at).toLocaleString("ja-JP"),
    }));
  }

  async addReport(report) {
    const { error } = await this.client.from("reports").insert({
      checkpoint_name: report.checkpoint,
      image_url: report.image,
      reason: report.reason,
      anonymous_user_id: this.userId,
      status: "open",
    });
    if (error) throw error;
  }

  async clearReports() {
    const { error } = await this.client.from("reports").update({ status: "resolved" }).eq("status", "open");
    if (error) throw error;
  }

  async updateReportStatus(reportId, status) {
    const { error } = await this.client.from("reports").update({ status }).eq("id", reportId);
    if (error) throw error;
  }

  async addScore(score) {
    const { error } = await this.client.from("scores").insert({
      clear_count: score.clears,
      score: score.score,
      photo_count: score.photoCount,
      duration_seconds: score.durationSeconds,
      anonymous_user_id: this.userId,
    });
    if (error) throw error;
  }

  async listScores() {
    const { data, error } = await this.client.from("scores").select("score, clear_count, photo_count, created_at").order("score", {
      ascending: false,
    });
    if (error) throw error;
    return data.map((score) => ({
      score: score.score,
      clears: score.clear_count,
      photoCount: score.photo_count,
      createdAt: score.created_at,
    }));
  }

  async listCheckpoints() {
    const { data, error } = await this.client
      .from("checkpoints")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data.map((checkpoint) => ({
      id: checkpoint.id,
      name: checkpoint.checkpoint_name,
      prefecture: checkpoint.prefecture,
      placeName: checkpoint.place_name,
      image: checkpoint.image_url,
      difficulty: checkpoint.difficulty,
      radius: checkpoint.radius_m,
      points: checkpoint.points,
      lat: checkpoint.lat,
      lng: checkpoint.lng,
      reviewId: checkpoint.review_id,
    }));
  }

  async addCheckpoint(checkpoint) {
    const imageUrl = await this.#uploadImageIfNeeded(checkpoint.image);
    const { error } = await this.client.from("checkpoints").insert({
      checkpoint_name: checkpoint.name,
      prefecture: checkpoint.prefecture,
      place_name: checkpoint.placeName,
      image_url: imageUrl,
      difficulty: checkpoint.difficulty,
      radius_m: checkpoint.radius,
      points: checkpoint.points,
      lat: checkpoint.lat,
      lng: checkpoint.lng,
      review_id: checkpoint.reviewId || null,
      status: "active",
    });
    if (error) throw error;
  }

  async updateCheckpoint(checkpointId, patch) {
    const updates = {};
    if (patch.name !== undefined) updates.checkpoint_name = patch.name;
    if (patch.prefecture !== undefined) updates.prefecture = patch.prefecture;
    if (patch.placeName !== undefined) updates.place_name = patch.placeName;
    if (patch.difficulty !== undefined) {
      updates.difficulty = patch.difficulty;
      updates.points = 50 + Number(patch.difficulty) * 20;
    }
    if (patch.radius !== undefined) updates.radius_m = patch.radius;
    if (patch.lat !== undefined) updates.lat = patch.lat;
    if (patch.lng !== undefined) updates.lng = patch.lng;
    if (patch.status !== undefined) updates.status = patch.status;

    const { error } = await this.client.from("checkpoints").update(updates).eq("id", checkpointId);
    if (error) throw error;
  }

  async #uploadImageIfNeeded(image) {
    if (!image?.startsWith("data:image/")) return image;

    const response = await fetch(image);
    const blob = await response.blob();
    const extension = blob.type.split("/")[1] || "jpg";
    const filePath = `${Date.now()}-${crypto.randomUUID?.() || Math.random().toString(16).slice(2)}.${extension}`;
    const { error } = await this.client.storage.from(this.config.photoBucket).upload(filePath, blob, {
      contentType: blob.type,
      upsert: false,
    });
    if (error) throw error;

    const { data } = this.client.storage.from(this.config.photoBucket).getPublicUrl(filePath);
    return data.publicUrl;
  }

  #getOrCreateUserId() {
    const existing = localStorage.getItem(this.userKey);
    if (existing) return existing;
    const userId = crypto.randomUUID?.() || `anon-${Date.now()}`;
    localStorage.setItem(this.userKey, userId);
    return userId;
  }
}

function createMachirogeStore() {
  const config = window.MACHIROGE_CONFIG || {};
  const hasSupabaseConfig = Boolean(config.supabaseUrl && config.supabaseAnonKey);
  if (hasSupabaseConfig && window.supabase?.createClient) {
    const client = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
    return new SupabaseMachirogeStore(client, config);
  }
  return new LocalMachirogeStore();
}

window.machirogeStore = createMachirogeStore();
