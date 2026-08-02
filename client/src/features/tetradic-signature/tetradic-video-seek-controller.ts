type FrameMetadata = Readonly<{
  mediaTime: number;
}>;

export type ScrubbableVideo = Pick<
  HTMLVideoElement,
  | "currentTime"
  | "duration"
  | "readyState"
  | "seeking"
  | "addEventListener"
  | "removeEventListener"
> & {
  requestVideoFrameCallback?: (
    callback: (now: number, metadata: FrameMetadata) => void
  ) => number;
  cancelVideoFrameCallback?: (handle: number) => void;
};

export type TetradicVideoSeekController = Readonly<{
  request: (time: number) => void;
  syncLoadedFrame: () => void;
  isPresentedAt: (time: number) => boolean;
  dispose: () => void;
}>;

type SeekControllerOptions = Readonly<{
  frameStep: number;
  onFramePresented: () => void;
  timeoutMs?: number;
}>;

const HAVE_METADATA = 1;
const HAVE_CURRENT_DATA = 2;

export function createTetradicVideoSeekController(
  video: ScrubbableVideo,
  { frameStep, onFramePresented, timeoutMs = 600 }: SeekControllerOptions
): TetradicVideoSeekController {
  const tolerance = frameStep * 1.5;
  let desiredTime = 0;
  let requestedTime = Number.NaN;
  let presentedTime =
    video.readyState >= HAVE_CURRENT_DATA && !video.seeking
      ? video.currentTime
      : Number.NaN;
  let inFlight = false;
  let disposed = false;
  let frameCallback = 0;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const clampTime = (time: number) => {
    const duration = Number.isFinite(video.duration) ? video.duration : time;
    return Math.min(Math.max(0, time), Math.max(0, duration - frameStep));
  };

  const isPresentedAt = (time: number) =>
    Number.isFinite(presentedTime) &&
    Math.abs(presentedTime - clampTime(time)) <= tolerance;

  const clearPendingSignals = () => {
    if (frameCallback && video.cancelVideoFrameCallback) {
      video.cancelVideoFrameCallback(frameCallback);
    }
    frameCallback = 0;
    if (timeout !== undefined) clearTimeout(timeout);
    timeout = undefined;
    video.removeEventListener("seeked", handleSeeked);
  };

  const completeSeek = (mediaTime: number) => {
    if (!inFlight || disposed) return;
    clearPendingSignals();
    inFlight = false;
    presentedTime = Number.isFinite(mediaTime) ? mediaTime : video.currentTime;
    onFramePresented();
    pump();
  };

  const handleSeeked = () => completeSeek(video.currentTime);

  const waitForPresentedFrame = () => {
    if (!video.requestVideoFrameCallback) {
      video.addEventListener("seeked", handleSeeked, { once: true });
      return;
    }

    const inspectFrame = (_now: number, metadata: FrameMetadata) => {
      frameCallback = 0;
      if (disposed || !inFlight) return;
      if (Math.abs(metadata.mediaTime - requestedTime) <= tolerance) {
        completeSeek(metadata.mediaTime);
        return;
      }
      frameCallback = video.requestVideoFrameCallback?.(inspectFrame) ?? 0;
    };

    frameCallback = video.requestVideoFrameCallback(inspectFrame);
  };

  function pump() {
    if (disposed || inFlight || video.readyState < HAVE_METADATA) return;

    desiredTime = clampTime(desiredTime);
    if (isPresentedAt(desiredTime)) return;

    requestedTime = desiredTime;
    inFlight = true;
    waitForPresentedFrame();
    timeout = setTimeout(() => completeSeek(video.currentTime), timeoutMs);
    video.currentTime = requestedTime;
  }

  const request = (time: number) => {
    desiredTime = time;
    pump();
  };

  const syncLoadedFrame = () => {
    if (video.readyState >= HAVE_CURRENT_DATA && !video.seeking && !inFlight) {
      presentedTime = video.currentTime;
      onFramePresented();
    }
    pump();
  };

  const dispose = () => {
    disposed = true;
    clearPendingSignals();
  };

  return { request, syncLoadedFrame, isPresentedAt, dispose };
}
