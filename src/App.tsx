import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import MqttPage from "./pages/MqttPage";
import RabbitMqPage from "./pages/RabbitMqPage";
import "./App.css";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/mqtt" element={<MqttPage />} />
        <Route path="/rabbitmq" element={<RabbitMqPage />} />
      </Routes>
    </Router>
  );
};

export default App;
