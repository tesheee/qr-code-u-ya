import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import QrScanner from "./QrScanner";
import InfoPage from "./InfoPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<QrScanner />} />
        <Route path="/info/:code" element={<InfoPage />} />
      </Routes>
    </Router>
  );
}

export default App;
