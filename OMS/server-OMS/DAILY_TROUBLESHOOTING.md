# Daily.co Video/Audio Troubleshooting Guide

## Common Issues and Solutions

### 1. **Browser Permissions**

- **Issue**: Browser blocks camera/microphone access
- **Solution**: Check browser permission settings
- **Test**: Open browser dev tools > Console > Run:
  ```javascript
  navigator.mediaDevices
    .getUserMedia({ video: true, audio: true })
    .then((stream) => console.log("✅ Media access granted"))
    .catch((err) => console.log("❌ Media access denied:", err.message));
  ```

### 2. **HTTPS Requirement**

- **Issue**: getUserMedia requires HTTPS in production
- **Current**: Using localhost (should work)
- **Solution**: For production, ensure HTTPS

### 3. **Daily.co Room Settings**

- **Issue**: Room created with wrong video/audio settings
- **Check**: Meeting controller settings:
  ```javascript
  properties: {
    enable_chat: true,
    enable_knocking: true,
    start_video_off: false,  // ✅ Video should start ON
    start_audio_off: false,  // ✅ Audio should start ON
  }
  ```

### 4. **Frontend Integration Issues**

- **Check**: DailyIframe import and usage
- **Verify**: Frame creation and joining logic
- **Test**: Console logs during meeting join

### 5. **Browser Compatibility**

- **Supported**: Chrome, Firefox, Safari, Edge
- **Issue**: Older browsers may not support WebRTC
- **Solution**: Update browser or use supported one

## Diagnostic Steps

### Step 1: Check Browser Console

1. Open meeting in browser
2. Press F12 → Console tab
3. Look for errors related to:
   - DailyIframe
   - getUserMedia
   - WebRTC
   - Permission denied

### Step 2: Test Media Permissions

```javascript
// Run in browser console
navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then((stream) => {
    console.log("✅ Camera/mic access OK");
    stream.getTracks().forEach((track) => track.stop());
  })
  .catch((err) => console.log("❌ Media error:", err.name, err.message));
```

### Step 3: Check Daily.co Room

- Verify room URL is accessible
- Test room directly in browser: `https://tarsadmin.daily.co/room-name`
- Check if room has correct permissions

### Step 4: Verify React Component

- Check if `callFrameRef.current` exists
- Verify `containerRef.current` is available
- Check if `joinMeetingRoom()` is called

## Quick Fixes

### Fix 1: Reset Browser Permissions

1. Click camera icon in address bar
2. Select "Allow" for camera and microphone
3. Refresh page

### Fix 2: Check React Dev Tools

1. Install React Dev Tools extension
2. Check Meeting component state
3. Verify refs are set correctly

### Fix 3: Clear Browser Cache

1. Ctrl+Shift+Delete
2. Clear cached data
3. Restart browser

## Code Improvements

### Better Error Handling

```javascript
callFrame.on("error", (error) => {
  console.error("Daily.co error:", error);
  // Show user-friendly error message
});

callFrame.on("camera-error", (error) => {
  console.error("Camera error:", error);
  // Guide user to fix permissions
});
```

### Permission Check Before Join

```javascript
const checkPermissions = async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    return true;
  } catch (error) {
    setError("Please allow camera and microphone access");
    return false;
  }
};
```
