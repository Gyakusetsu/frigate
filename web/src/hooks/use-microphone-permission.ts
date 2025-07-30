import { useCallback, useEffect, useState } from "react";

export type MicrophonePermissionState = "prompt" | "granted" | "denied" | "unsupported";

export function useMicrophonePermission() {
  const [permissionState, setPermissionState] = useState<MicrophonePermissionState>("prompt");
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);

  // Check if getUserMedia is supported
  const isSupported = useCallback(() => {
    return !!(
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    );
  }, []);

  // Request microphone permission
  const requestPermission = useCallback(async (): Promise<MicrophonePermissionState> => {
    if (!isSupported()) {
      setPermissionState("unsupported");
      return "unsupported";
    }

    try {
      setHasRequestedPermission(true);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false 
      });
      
      // Stop the stream immediately since we only needed permission
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionState("granted");
      return "granted";
    } catch (error) {
      console.warn("Microphone permission denied:", error);
      
      // Check specific error types
      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
          setPermissionState("denied");
          return "denied";
        } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
          setPermissionState("unsupported");
          return "unsupported";
        }
      }
      
      setPermissionState("denied");
      return "denied";
    }
  }, [isSupported]);

  // Check current permission state using Permissions API if available
  const checkPermissionState = useCallback(async () => {
    if (!isSupported()) {
      setPermissionState("unsupported");
      return "unsupported";
    }

    // Try to use Permissions API if available
    if (navigator.permissions && navigator.permissions.query) {
      try {
        const result = await navigator.permissions.query({ name: "microphone" as PermissionName });
        
        if (result.state === "granted") {
          setPermissionState("granted");
          return "granted";
        } else if (result.state === "denied") {
          setPermissionState("denied");
          return "denied";
        } else {
          setPermissionState("prompt");
          return "prompt";
        }
      } catch (error) {
        // Permissions API might not support microphone query
        console.debug("Permissions API query failed:", error);
      }
    }

    // If we can't check via Permissions API, return current state
    return permissionState;
  }, [isSupported, permissionState]);

  // Check permission state on mount
  useEffect(() => {
    if (isSupported()) {
      checkPermissionState();
    } else {
      setPermissionState("unsupported");
    }
  }, [isSupported, checkPermissionState]);

  return {
    permissionState,
    isSupported: isSupported(),
    requestPermission,
    checkPermissionState,
    hasRequestedPermission,
  };
}
