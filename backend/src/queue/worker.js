/**
 * TourForge Job Queue
 *
 * In-memory queue that processes AI generation jobs one at a time.
 * Demonstrates: queue patterns, exponential backoff, retry logic,
 * graceful fallback — all concepts used in production systems (AWS SQS,
 * Google Cloud Tasks, Bull/BullMQ).
 *
 * For production: swap this with Bull + Redis for persistence across restarts.
 */

const Hotspot = require("../models/Hotspot");
const { generateHotspotContent } = require("../services/gemini");

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // 1s → 2s → 4s (exponential backoff)
const FALLBACK_DESCRIPTIONS = [
  "A functional area designed for comfortable use.",
  "Spacious area suitable for residential or commercial use.",
  "Well-positioned feature that adds character to the space.",
  "Thoughtfully designed element contributing to the room's overall flow.",
];

// Simple in-memory FIFO queue
const queue = [];
let isProcessing = false;

/**
 * Add a hotspot job to the queue.
 * Returns immediately — actual processing is async via the worker loop.
 */
const enqueue = (hotspotId, context = {}) => {
  queue.push({ hotspotId, context, addedAt: Date.now() });
  console.log(`[Queue] Job enqueued for hotspot ${hotspotId}. Queue size: ${queue.length}`);

  // Kick the worker if it's idle
  if (!isProcessing) processNext();
};

/**
 * Sleep helper for delays between retries.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Pick a deterministic fallback description based on hotspot ID.
 * Avoids the same generic message appearing for every failed hotspot.
 */
const getFallback = (hotspotId) => {
  const index = hotspotId.charCodeAt(hotspotId.length - 1) % FALLBACK_DESCRIPTIONS.length;
  return FALLBACK_DESCRIPTIONS[index];
};

/**
 * Process a single job with retry + exponential backoff.
 */
const processJob = async (job) => {
  const { hotspotId, context } = job;

  const hotspot = await Hotspot.findById(hotspotId);
  if (!hotspot) {
    console.warn(`[Queue] Hotspot ${hotspotId} not found, skipping`);
    return;
  }

  // Mark as processing
  hotspot.status = Hotspot.STATUS.PROCESSING;
  await hotspot.save();

  let attempt = 0;
  let lastError = null;

  while (attempt < MAX_RETRIES) {
    try {
      attempt++;
      console.log(`[Queue] Processing hotspot ${hotspotId} (attempt ${attempt}/${MAX_RETRIES})`);

      const result = await generateHotspotContent({
        label: hotspot.label,
        userContext: hotspot.userContext || context.userContext || "",
        niche: context.niche || "real-estate",
      });

      hotspot.description = result.description;
      hotspot.accessibilityNotes = result.accessibilityNotes;
      hotspot.salesCopy = result.salesCopy;
      hotspot.status = Hotspot.STATUS.COMPLETED;
      hotspot.retryCount = attempt - 1;
      hotspot.lastError = "";
      await hotspot.save();

      console.log(`[Queue] Hotspot ${hotspotId} completed after ${attempt} attempt(s)`);
      return;

    } catch (err) {
      lastError = err.message;
      console.warn(`[Queue] Attempt ${attempt} failed for hotspot ${hotspotId}: ${err.message}`);

      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1); // 1s, 2s, 4s
        console.log(`[Queue] Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  // All retries exhausted — use fallback response so the UI never shows a blank
  console.error(`[Queue] All retries exhausted for hotspot ${hotspotId}. Using fallback.`);
  hotspot.description = getFallback(hotspotId);
  hotspot.accessibilityNotes = "Please verify accessibility features on-site.";
  hotspot.salesCopy = "Contact agent for more details on this area.";
  hotspot.status = Hotspot.STATUS.FAILED;
  hotspot.retryCount = MAX_RETRIES;
  hotspot.lastError = lastError;
  await hotspot.save();
};

/**
 * Continuously drain the queue, one job at a time.
 */
const processNext = async () => {
  if (queue.length === 0) {
    isProcessing = false;
    return;
  }

  isProcessing = true;
  const job = queue.shift();

  try {
    await processJob(job);
  } catch (err) {
    console.error(`[Queue] Unexpected error processing job:`, err.message);
  }

  // Process next job immediately after current one finishes
  processNext();
};

/**
 * Start the worker — called once on server boot.
 * Drains any jobs that were already in the queue (edge case on hot reload).
 */
const startWorker = () => {
  console.log("[Queue] Worker started");
  if (queue.length > 0 && !isProcessing) processNext();
};

const getQueueStats = () => ({
  size: queue.length,
  isProcessing,
});

module.exports = { enqueue, startWorker, getQueueStats };
