import { useEffect } from "react";

const Meeting = ({ roomName = "MyCustomMeetingRoom123", userName = "Guest" }) => {
  useEffect(() => {
    if (!window.JitsiMeetExternalAPI) {
      alert("Jitsi Meet API script not loaded");
      return;
    }

    const domain = "meet.jit.si";
    const options = {
      roomName,
      width: "100%",
      height: 600,
      parentNode: document.getElementById("jitsi-container"),
      userInfo: {
        displayName: userName,
      },
      configOverwrite: {
        startWithAudioMuted: true,
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        HIDE_INVITE_MORE_HEADER: true,
      },
    };

    const api = new window.JitsiMeetExternalAPI(domain, options);

    return () => api.dispose();
  }, [roomName, userName]);

  return (
    <div style={{ width: "100%", margin: "20px auto" }}>
      <h2 style={{ textAlign: "center" }}>Meeting Room: {roomName}</h2>
      <div id="jitsi-container" style={{ height: "600px", borderRadius: "8px", overflow: "hidden" }} />
    </div>
  );
};

export default Meeting;
