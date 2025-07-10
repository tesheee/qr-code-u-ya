import React, { useRef, useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import jsQR from "jsqr";
import axios from "axios";
import {
  Box,
  CircularProgress,
  Button,
  Typography,
  Paper,
  Alert,
} from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

const QrScanner = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [status, setStatus] = useState("init"); // init, loading, ready, scanning, success, error
  const [errorMessage, setErrorMessage] = useState("");
  const [showCameraButton, setShowCameraButton] = useState(false);
  const navigate = useNavigate();

  // Проверка поддержки API
  const checkCameraSupport = useCallback(() => {
    return navigator.mediaDevices && navigator.mediaDevices.getUserMedia;
  }, []);

  // Проверка HTTPS/localhost
  const checkEnvironment = useCallback(() => {
    return (
      window.location.protocol === "https:" ||
      window.location.hostname === "localhost"
    );
  }, []);

  // Отправка кода на сервер
  const sendCodeToServer = useCallback(
    async (code) => {
      try {
        setStatus("processing");
        const response = await axios.get(
          `//https://www.u-yastreb.online/certificate/verify/${code}`,
          {
            headers: {
              Authorization: `Bearer WqY3^8fSj*2zL9PvQ7w!XkN1@bR6yH4`,
            },
          }
        );
        navigate(`/info/${code}`, { state: { data: response.data } });
      } catch (error) {
        setStatus("error");
        setErrorMessage("Не удалось проверить QR-код. Попробуйте ещё раз.");
        console.error("API Error:", error);
      }
    },
    [navigate]
  );

  // Инициализация камеры
  const initCamera = useCallback(async () => {
    try {
      setStatus("loading");

      if (!checkCameraSupport()) {
        throw new Error("Ваш браузер не поддерживает доступ к камере");
      }

      if (!checkEnvironment()) {
        throw new Error("Требуется HTTPS соединение или localhost");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      if (!videoRef.current) {
        throw new Error("Video element not found");
      }

      streamRef.current = stream;
      videoRef.current.srcObject = stream;

      return new Promise((resolve) => {
        videoRef.current.onloadedmetadata = () => {
          videoRef.current
            .play()
            .then(() => {
              setStatus("ready");
              resolve();
            })
            .catch((err) => {
              // Для iOS: показываем кнопку активации
              if (err.name === "NotAllowedError") {
                setShowCameraButton(true);
                setStatus("init");
              } else {
                throw new Error(`Video play failed: ${err.message}`);
              }
            });
        };
      });
    } catch (err) {
      console.error("Camera initialization error:", err);
      setStatus("error");
      setErrorMessage(err.message || "Не удалось получить доступ к камере");
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Для iOS: показываем кнопку, если доступ был отклонен
      if (err.name === "NotAllowedError") {
        setShowCameraButton(true);
      }
    }
  }, [checkCameraSupport, checkEnvironment]);

  // Ручной запуск камеры (для iOS)
  const handleStartCamera = () => {
    setShowCameraButton(false);
    initCamera();
  };

  // Сканирование кадров
  useEffect(() => {
    if (status !== "ready") return;

    let animationFrameId;
    const scan = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas || video.readyState < video.HAVE_ENOUGH_DATA) {
        animationFrameId = requestAnimationFrame(scan);
        return;
      }

      try {
        const ctx = canvas.getContext("2d");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          console.log("Found QR code:", code.data);
          sendCodeToServer(code.data);
          return;
        }
      } catch (err) {
        console.error("Scan error:", err);
      }

      animationFrameId = requestAnimationFrame(scan);
    };

    animationFrameId = requestAnimationFrame(scan);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [status, sendCodeToServer]);

  // Инициализация при монтировании
  useEffect(() => {
    initCamera();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [initCamera]);

  // UI состояния
  const renderStatus = () => {
    if (showCameraButton) {
      return (
        <Box sx={{ textAlign: "center", p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Для сканирования QR-кода необходим доступ к камере
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleStartCamera}
            startIcon={<CameraAltIcon />}
            size="large"
          >
            Включить камеру
          </Button>
        </Box>
      );
    }

    switch (status) {
      case "init":
      case "loading":
        return (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <CircularProgress size={60} />
            <Typography variant="h6">
              {status === "init" ? "Инициализация..." : "Загрузка камеры..."}
            </Typography>
          </Box>
        );

      case "error":
        return (
          <Paper sx={{ p: 3, textAlign: "center", maxWidth: 400 }}>
            <ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {errorMessage}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => window.location.reload()}
              startIcon={<CameraAltIcon />}
            >
              Попробовать снова
            </Button>
          </Paper>
        );

      case "processing":
        return (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
            }}
          >
            <CircularProgress size={60} />
            <Typography variant="h6">Обработка QR-кода...</Typography>
          </Box>
        );

      default:
        return (
          <Box sx={{ textAlign: "center", p: 2 }}>
            <Typography variant="h5" gutterBottom>
              Наведите камеру на QR-код
            </Typography>
            <Typography color="text.secondary">
              Автоматическое сканирование
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Alert severity="info" sx={{ maxWidth: 400, mx: "auto" }}>
                Разместите QR-код в центре экрана
              </Alert>
            </Box>
          </Box>
        );
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        p: 2,
        backgroundColor: "#f5f5f5",
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 600,
          height: 400,
          mb: 4,
          borderRadius: 2,
          overflow: "hidden",
          boxShadow: 3,
          backgroundColor: "#000",
        }}
      >
        <video
          ref={videoRef}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: ["ready", "scanning"].includes(status) ? "block" : "none",
          }}
          playsInline
          muted
        />
        <canvas ref={canvasRef} style={{ display: "none" }} />

        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor:
              status === "ready" ? "rgba(0,0,0,0.3)" : "rgba(0,0,0,0.7)",
            color: "white",
          }}
        >
          {renderStatus()}
        </Box>

        {status === "ready" && (
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "70%",
              height: "70%",
              border: "4px solid rgba(255, 255, 255, 0.7)",
              borderRadius: 2,
              pointerEvents: "none",
            }}
          />
        )}
      </Box>
    </Box>
  );
};

export default QrScanner;
