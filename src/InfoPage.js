import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  CircularProgress,
  Chip,
  Stack,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EventIcon from "@mui/icons-material/Event";
import PersonIcon from "@mui/icons-material/Person";
import axios from "axios";

const InfoPage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [certificateData, setCertificateData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [activationStatus, setActivationStatus] = React.useState(null);

  React.useEffect(() => {
    const fetchCertificateData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:3001/qr/verify/${code}`,
          {
            headers: {
              Authorization: `Bearer WqY3^8fSj*2zL9PvQ7w!XkN1@bR6yH4`,
            },
          }
        );
        setCertificateData(response.data);
      } catch (error) {
        console.error("Error fetching certificate data:", error);
        setError("Не удалось загрузить данные сертификата");
      } finally {
        setLoading(false);
      }
    };

    fetchCertificateData();
  }, [code]);

  const activateCertificate = async () => {
    try {
      setLoading(true);
      setActivationStatus(null);
      const response = await axios.get(
        `https://www.u-yastreb.online/qr/activate/${code}`,
        {
          headers: {
            Authorization: `Bearer WqY3^8fSj*2zL9PvQ7w!XkN1@bR6yH4`,
          },
        }
      );
      console.log(response);
      setActivationStatus("success");
      setCertificateData((prev) => ({ ...prev, status: "Активирован" }));
    } catch (error) {
      console.error("Error activating certificate:", error);
      setActivationStatus("error");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !certificateData) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          p: 3,
        }}
      >
        <Alert severity="error" sx={{ width: "100%", maxWidth: 600 }}>
          {error}
          <Button
            variant="outlined"
            sx={{ mt: 2 }}
            onClick={() => navigate("/")}
          >
            Вернуться к сканеру
          </Button>
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        p: 3,
        backgroundColor: "#f5f5f5",
      }}
    >
      <Paper
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 800,
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/")}
          sx={{ mb: 3 }}
          variant="outlined"
        >
          Назад к сканеру
        </Button>

        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: "bold", mb: 3 }}
        >
          Информация о сертификате
        </Typography>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mt: 2 }}>
          <Stack
            direction="row"
            spacing={2}
            alignItems="center"
            display="flex"
            sx={{ mb: 3 }}
          >
            <Chip
              label={`Код: ${code}`}
              color="primary"
              variant="outlined"
              sx={{ fontSize: "1rem", p: 1.5 }}
            />
            <Chip
              label={
                certificateData?.isUsed === true
                  ? "Использован"
                  : certificateData?.isUsed === false
                  ? "Не Использован"
                  : "Статус неизвестен"
              }
              color={certificateData?.isUsed === true ? "success" : "default"}
              icon={
                certificateData?.isUsed === true ? <CheckCircleIcon /> : null
              }
              sx={{ fontSize: "1rem", p: 1.5 }}
            />
          </Stack>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 3,
              mb: 4,
            }}
          >
            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography
                variant="h6"
                sx={{ mb: 2, display: "flex", alignItems: "center" }}
              >
                <PersonIcon sx={{ mr: 1 }} /> Информация о владельце
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Имя:</strong> {certificateData?.user || "Не указано"}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Email:</strong>{" "}
                {certificateData?.user?.email || "Не указан"}
              </Typography>
              <Typography variant="body1">
                <strong>Телефон:</strong>{" "}
                {certificateData?.user?.ownerPhone || "Не указан"}
              </Typography>
            </Paper>

            <Paper sx={{ p: 3, borderRadius: 2 }}>
              <Typography
                variant="h6"
                sx={{ mb: 2, display: "flex", alignItems: "center" }}
              >
                <EventIcon sx={{ mr: 1 }} /> Срок действия
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Дата выдачи:</strong>{" "}
                {new Date(certificateData?.buyDate)
                  .toISOString()
                  .split("T")[0]
                  .replace(/-/g, ".") || "Не указана"}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Действителен до:</strong>{" "}
                {new Date(certificateData?.expirationDate)
                  .toISOString()
                  .split("T")[0]
                  .replace(/-/g, ".") || "Не указана"}
              </Typography>
              <Typography variant="body1">
                <strong>Тип сертификата:</strong>{" "}
                {certificateData?.type || "Не указан"}
              </Typography>
            </Paper>
          </Box>

          {certificateData?.isUsed !== true && (
            <Box sx={{ mt: 3, textAlign: "center" }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={activateCertificate}
                disabled={loading}
                sx={{ px: 4, py: 1.5, fontSize: "1rem" }}
              >
                {loading ? (
                  <CircularProgress size={24} />
                ) : (
                  "Активировать сертификат"
                )}
              </Button>
            </Box>
          )}

          {activationStatus === "success" && (
            <Alert severity="success" sx={{ mt: 3 }}>
              Сертификат успешно активирован!
            </Alert>
          )}

          {activationStatus === "error" && (
            <Alert severity="error" sx={{ mt: 3 }}>
              Ошибка при активации сертификата. Пожалуйста, попробуйте позже.
            </Alert>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default InfoPage;
