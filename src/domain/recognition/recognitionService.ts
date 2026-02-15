/**
 * Handwriting Recognition Service - Stubbed interface for future LLM integration.
 *
 * The goal is to send canvas contents as an image to an LLM and get back
 * the recognized number for automatic answer checking.
 */

export interface RecognitionResult {
  /** The recognized number, or null if recognition failed */
  recognizedNumber: number | null;
  /** Confidence score from 0 to 1 */
  confidence: number;
  /** Alternative interpretations */
  alternates?: Array<{ value: number; confidence: number }>;
}

export interface RecognitionOptions {
  /** Hint for the expected number of digits */
  expectedDigits?: number;
  /** The correct answer (for future training/feedback) */
  correctAnswer?: number;
}

/**
 * Interface for handwriting recognition implementations.
 * Implement this interface to add LLM-based or OCR-based recognition.
 */
export interface HandwritingRecognizer {
  /**
   * Recognize a number from a canvas image.
   * @param imageData - Base64 PNG string from canvas.toDataURL()
   * @param options - Recognition options and hints
   * @returns Recognition result with recognized number and confidence
   */
  recognizeNumber(
    imageData: string,
    options?: RecognitionOptions,
  ): Promise<RecognitionResult>;

  /**
   * Check if the recognizer is available and configured.
   */
  isAvailable(): boolean;
}

/**
 * No-op implementation for v1 - always returns null recognition.
 * Replace with LLMHandwritingRecognizer when ready to integrate.
 */
export class NoOpRecognizer implements HandwritingRecognizer {
  async recognizeNumber(): Promise<RecognitionResult> {
    return {
      recognizedNumber: null,
      confidence: 0,
    };
  }

  isAvailable(): boolean {
    return false;
  }
}

/**
 * Check result from either manual or automatic checking.
 */
export interface CheckResultWithMethod {
  method: 'manual' | 'auto';
  recognized?: number;
  isCorrect?: boolean;
  confidence?: number;
  lowConfidence?: boolean;
}

/**
 * Get the current recognizer instance.
 * In v1, this always returns the NoOpRecognizer.
 * In future versions, this can be configured via parent settings.
 */
let currentRecognizer: HandwritingRecognizer = new NoOpRecognizer();

export function getRecognizer(): HandwritingRecognizer {
  return currentRecognizer;
}

export function setRecognizer(recognizer: HandwritingRecognizer): void {
  currentRecognizer = recognizer;
}

/**
 * Extract the answer region from a canvas for recognition.
 * The answer area is below the separator line.
 */
export function extractAnswerRegionAsBase64(
  canvas: HTMLCanvasElement,
  answerBounds: { x: number; y: number; width: number; height: number },
): string {
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = answerBounds.width;
  tempCanvas.height = answerBounds.height;

  const tempCtx = tempCanvas.getContext('2d');
  if (!tempCtx) return '';

  tempCtx.drawImage(
    canvas,
    answerBounds.x,
    answerBounds.y,
    answerBounds.width,
    answerBounds.height,
    0,
    0,
    answerBounds.width,
    answerBounds.height,
  );

  return tempCanvas.toDataURL('image/png');
}