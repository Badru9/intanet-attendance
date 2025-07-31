// app/utils/callbackStore.ts

// Define the type for your specific callback
type CaptureCallback = (
  photoUri: string,
  locationString: string,
  notes: string | null
) => void;

// A simple object to temporarily hold callbacks
// This is not reactive, just a direct reference store.
const callbackStore: {
  capturePhotoAndLocation?: CaptureCallback;
} = {};

/**
 * Sets a callback function for photo and location capture.
 * @param callback The function to be called with captured photo URI, location string, and notes.
 */
export const setCaptureCallback = (callback: CaptureCallback) => {
  callbackStore.capturePhotoAndLocation = callback;
};

/**
 * Retrieves the stored callback function for photo and location capture.
 * @returns The stored callback function, or undefined if not set.
 */
export const getCaptureCallback = (): CaptureCallback | undefined => {
  return callbackStore.capturePhotoAndLocation;
};

/**
 * Clears the stored callback function.
 * This should be called after the callback has been executed or is no longer needed
 * to prevent memory leaks and ensure fresh state.
 */
export const clearCaptureCallback = () => {
  callbackStore.capturePhotoAndLocation = undefined;
};
