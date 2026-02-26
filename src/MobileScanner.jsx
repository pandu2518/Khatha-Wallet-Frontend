import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, RefreshCw } from "lucide-react";

function MobileScanner({ onScan, onClose }) {
  const [isSecure, setIsSecure] = useState(true);
  const [activeCamera, setActiveCamera] = useState(null);
  const [cameras, setCameras] = useState([]);
  const html5QrCodeRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const secure = window.isSecureContext || window.location.hostname === "localhost";
    setIsSecure(secure);

    if (!secure) return;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode("reader");
        html5QrCodeRef.current = scanner;

        // Get available cameras
        const devices = await Html5Qrcode.getCameras();
        setCameras(devices);

        if (devices && devices.length > 0) {
          // Prefer back camera (environment)
          const backCamera = devices.find(id => id.label.toLowerCase().includes("back") || id.label.toLowerCase().includes("rear"));
          const cameraId = backCamera ? backCamera.id : devices[0].id;
          setActiveCamera(cameraId);

          await scanner.start(
            cameraId,
            {
              fps: 10,
              qrbox: { width: 250, height: 250 },
            },
            (decodedText) => {
              const audio = new Audio("https://actions.google.com/sounds/v1/alarms/beep_short.ogg");
              audio.play().catch(e => console.log("Audio play failed", e));

              if (onScan) onScan(decodedText);
            },
            (errorMessage) => {
              // Ignore scan errors (polling)
            }
          );
          setLoading(false);
        } else {
          setError("No camera devices found. Please ensure your camera is connected.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to start scanner:", err);
        setError("Camera access denied or failed to initialize. Please check permissions.");
        setLoading(false);
      }
    };

    startScanner();

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().then(() => {
          html5QrCodeRef.current.clear();
        }).catch(err => console.error("Stop failed", err));
      }
    };
  }, [onScan]);

  const switchCamera = async () => {
    if (cameras.length < 2 || !html5QrCodeRef.current) return;

    const currentIndex = cameras.findIndex(c => c.id === activeCamera);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamera = cameras[nextIndex];

    try {
      await html5QrCodeRef.current.stop();
      setActiveCamera(nextCamera.id);
      await html5QrCodeRef.current.start(
        nextCamera.id,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (text) => onScan && onScan(text)
      );
    } catch (err) {
      console.error("Switch failed", err);
    }
  };

  return (
    <div className="scanner-overlay">
      <div className="scanner-modal">
        <button className="close-btn" onClick={onClose}>
          <X size={24} />
        </button>

        <div className="scanner-header">
          <h3>📷 Scanner Ready</h3>
          {cameras.length > 1 && (
            <button className="flip-btn" onClick={switchCamera} title="Switch Camera">
              <RefreshCw size={20} />
            </button>
          )}
        </div>

        {!isSecure && (
          <div className="security-warning">
            ⚠️ <b>Security Limitation:</b> Camera access requires <b>HTTPS</b>.
            Please use a secure connection or <b>localhost</b>.
          </div>
        )}

        {error && (
          <div className="scanner-error">
            <p>❌ {error}</p>
            <button className="btn outline small" onClick={() => window.location.reload()}>Retry</button>
          </div>
        )}

        {loading && !error && <div className="scanner-loading">Initializing Camera...</div>}

        <div id="reader" style={{ width: "100%", minHeight: error ? "0" : "250px", overflow: "hidden", borderRadius: "12px", background: "#000" }}></div>

        <p className="scanner-hint">
          {error ? "Scanner could not start." : isSecure ? "Point camera at a barcode" : "Use HTTPS to enable camera"}
        </p>
      </div>

      <style>{`
        .scanner-overlay {
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85);
            display: flex; align-items: center; justify-content: center;
            z-index: 9999; backdrop-filter: blur(4px);
        }
        .scanner-modal {
            background: white; padding: 24px; border-radius: 24px;
            position: relative; width: 90%; max-width: 480px;
            text-align: center; box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        }
        .scanner-header {
            display: flex; align-items: center; justify-content: center;
            gap: 12px; margin-bottom: 20px;
        }
        .scanner-header h3 { margin: 0; font-size: 20px; font-weight: 800; color: #1e293b; }
        .flip-btn {
            background: #f1f5f9; border: none; padding: 8px;
            border-radius: 50%; cursor: pointer; color: #475569;
            display: flex; align-items: center; justify-content: center;
        }
        .close-btn {
            position: absolute; top: 16px; right: 16px;
            background: #f1f5f9; border: none; padding: 8px;
            border-radius: 50%; cursor: pointer; color: #475569;
        }
        .scanner-loading {
            padding: 80px 40px; color: #64748b; font-weight: 600;
        }
        .scanner-error {
            background: #fef2f2; color: #991b1b; padding: 20px;
            border-radius: 16px; margin-bottom: 20px; font-size: 14px;
            border: 1px solid #fee2e2;
        }
        .scanner-error p { margin: 0 0 12px 0; font-weight: 600; }
        .scanner-hint { margin-top: 16px; color: #64748b; font-size: 14px; }
        .security-warning {
            background: #fff7ed; color: #9a3412; padding: 12px;
            border-radius: 12px; font-size: 13px; margin-bottom: 20px;
            border: 1px solid #fed7aa; line-height: 1.5;
        }
        #reader { border-radius: 12px; background: #000; overflow: hidden; }
        #reader video { width: 100% !important; border-radius: 12px !important; }
      `}</style>
    </div>
  );
}

export default MobileScanner;
