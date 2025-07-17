import React, { useState, useEffect } from "react";
import mqtt from "mqtt";
import "../App.css";

// A interface não precisa mais da propriedade 'source'
interface DroneData {
  id: number;
  pressao: number;
  radiacao: number;
  temperatura: number;
  umidade: number;
  latitude: number;
  longitude: number;
  posicao: string;
}

type LatestDataState = {
  [key: string]: DroneData | null;
};

// Componente reutilizável para o Histórico para evitar repetição de código
const HistoryList = ({
  title,
  history,
}: {
  title: string;
  history: DroneData[];
}) => (
  <div className="history-container">
    <h2>{title}</h2>
    {history.length > 0 ? (
      <ul className="history-list">
        {history.map((msg) => (
          <li key={msg.id}>
            <span>
              <strong>Região:</strong> {msg.posicao}
            </span>
            <span>
              <strong>Temp:</strong> {msg.temperatura.toFixed(1)}°C
            </span>
            <span>
              <strong>Umidade:</strong> {msg.umidade.toFixed(1)}%
            </span>
            <span>
              <strong>Pressão:</strong> {msg.pressao.toFixed(1)} hPa
            </span>
            <span>
              <strong>Radiação:</strong> {msg.radiacao.toFixed(2)}
            </span>
            <span className="timestamp">
              {new Date(msg.id).toLocaleTimeString()}
            </span>
          </li>
        ))}
      </ul>
    ) : (
      <p>Nenhuma atualização recebida ainda.</p>
    )}
  </div>
);

const MqttPage = () => {
  const [connectionStatus, setConnectionStatus] = useState("Desconectado");
  const [latestMqttData, setLatestMqttData] = useState<LatestDataState>({
    norte: null,
    sul: null,
    leste: null,
    oeste: null,
  });
  const [mqttHistory, setMqttHistory] = useState<DroneData[]>([]);

  useEffect(() => {
    const mqttClient = mqtt.connect("ws://broker.hivemq.com:8000/mqtt");

    mqttClient.on("connect", () => {
      setConnectionStatus("Conectado");
      mqttClient.subscribe("mqtt/dadosClima", { qos: 0 });
    });

    mqttClient.on("message", (_topic: string, payload: Buffer) => {
      const messageData = JSON.parse(payload.toString());
      const newMessage: DroneData = { id: Date.now(), ...messageData };

      setLatestMqttData((prev) => ({
        ...prev,
        [newMessage.posicao.toLowerCase()]: newMessage,
      }));
      setMqttHistory((prev) => [newMessage, ...prev].slice(0, 10));
    });

    mqttClient.on("error", (err) => {
      console.error("MQTT Error:", err);
      setConnectionStatus("Erro na conexão");
    });

    mqttClient.on("close", () => {
      setConnectionStatus("Desconectado");
    });

    return () => {
      mqttClient.end();
    };
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Dashboard de Drones - MQTT</h1>
        {/* Removido o status de conexão */}
      </header>
      <main>
        <div className="data-container">
          {Object.entries(latestMqttData).map(([posicao, data]) => (
            <div key={posicao} className="data-card">
              <h2>{posicao.charAt(0).toUpperCase() + posicao.slice(1)}</h2>
              {data ? (
                <>
                  <p>Temperatura: {data.temperatura.toFixed(1)}°C</p>
                  <p>Umidade: {data.umidade.toFixed(1)}%</p>
                  <p>Pressão: {data.pressao.toFixed(1)} hPa</p>
                  <p>Radiação: {data.radiacao.toFixed(2)}</p>
                </>
              ) : (
                <p>Aguardando dados...</p>
              )}
            </div>
          ))}
        </div>
        <HistoryList title="Histórico MQTT" history={mqttHistory} />
      </main>
    </div>
  );
};

export default MqttPage;
