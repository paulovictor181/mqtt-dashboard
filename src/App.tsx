import React, { useState, useEffect } from "react";
import mqtt from "mqtt";
import { Client } from "@stomp/stompjs";
import "./App.css";

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

type ConnectionStatusState = {
  mqtt: string;
  rabbitmq: string;
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

function App() {
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatusState>({
      mqtt: "Desconectado",
      rabbitmq: "Desconectado",
    });

  // --- Estados separados para MQTT ---
  const [latestMqttData, setLatestMqttData] = useState<LatestDataState>({
    norte: null,
    sul: null,
    leste: null,
    oeste: null,
  });
  const [mqttHistory, setMqttHistory] = useState<DroneData[]>([]);

  // --- Estados separados para RabbitMQ ---
  const [latestRabbitMqData, setLatestRabbitMqData] = useState<LatestDataState>(
    {
      norte: null,
      sul: null,
      leste: null,
      oeste: null,
    }
  );
  const [rabbitMqHistory, setRabbitMqHistory] = useState<DroneData[]>([]);

  useEffect(() => {
    // --- Conexão MQTT ---
    const mqttClient = mqtt.connect("ws://broker.hivemq.com:8000/mqtt");

    mqttClient.on("connect", () => {
      setConnectionStatus((prev) => ({ ...prev, mqtt: "Conectado" }));
      mqttClient.subscribe("mqtt/dadosClima", { qos: 0 });
    });

    mqttClient.on("message", (_topic: string, payload: Buffer) => {
      const messageData = JSON.parse(payload.toString());
      const newMessage: DroneData = { id: Date.now(), ...messageData };

      // Atualiza os estados do MQTT
      setLatestMqttData((prev) => ({
        ...prev,
        [newMessage.posicao]: newMessage,
      }));
      setMqttHistory((prev) => [newMessage, ...prev].slice(0, 7));
    });

    // ... (outros handlers do mqttClient)

    // --- Conexão RabbitMQ ---
    const stompClient = new Client({
      brokerURL: "ws://localhost:15674/ws",
      connectHeaders: { login: "guest", passcode: "guest" },
    });

    stompClient.onConnect = () => {
      setConnectionStatus((prev) => ({ ...prev, rabbitmq: "Conectado" }));
      stompClient.subscribe("/queue/drones", (message) => {
        const messageData = JSON.parse(message.body);
        const newMessage: DroneData = { id: Date.now(), ...messageData };

        // Atualiza os estados do RabbitMQ
        setLatestRabbitMqData((prev) => ({
          ...prev,
          [newMessage.posicao]: newMessage,
        }));
        setRabbitMqHistory((prev) => [newMessage, ...prev].slice(0, 7));
      });
    };

    // ... (outros handlers do stompClient)

    stompClient.activate();

    return () => {
      if (mqttClient) mqttClient.end();
      if (stompClient) stompClient.deactivate();
    };
  }, []);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard de Drones</h1>
        <p>
          Status MQTT: <strong>{connectionStatus.mqtt}</strong> | Status
          RabbitMQ: <strong>{connectionStatus.rabbitmq}</strong>
        </p>
      </header>

      {/* Container principal dividido em duas colunas */}
      <main className="main-grid">
        {/* Coluna MQTT */}
        <div className="source-column">
          <h2>Dados MQTT</h2>
          <div className="panels-container">
            {Object.keys(latestMqttData).map((region) => (
              <div key={region} className="data-panel mqtt-panel">
                <h3>{region}</h3>
                {latestMqttData[region] ? (
                  <div className="panel-content">
                    {/* VERSÃO COMPLETA ABAIXO */}
                    <p>
                      <strong>Temp:</strong>{" "}
                      {latestMqttData[region]?.temperatura.toFixed(1)}°C
                    </p>
                    <p>
                      <strong>Umidade:</strong>{" "}
                      {latestMqttData[region]?.umidade.toFixed(1)}%
                    </p>
                    <p>
                      <strong>Pressão:</strong>{" "}
                      {latestMqttData[region]?.pressao.toFixed(1)}hPa
                    </p>
                    <p>
                      <strong>Radiação:</strong>{" "}
                      {latestMqttData[region]?.radiacao.toFixed(1)}µSv/h
                    </p>
                  </div>
                ) : (
                  <p className="waiting-data">Aguardando...</p>
                )}
              </div>
            ))}
          </div>
          <HistoryList title="Histórico MQTT" history={mqttHistory} />
        </div>

        {/* Coluna RabbitMQ */}
        <div className="source-column">
          <h2>Dados RabbitMQ</h2>
          <div className="panels-container">
            {Object.keys(latestRabbitMqData).map((region) => (
              <div key={region} className="data-panel rabbitmq-panel">
                <h3>{region}</h3>
                {latestRabbitMqData[region] ? (
                  <div className="panel-content">
                    {/* VERSÃO COMPLETA ABAIXO */}
                    <p>
                      <strong>Temp:</strong>{" "}
                      {latestRabbitMqData[region]?.temperatura.toFixed(1)}°C
                    </p>
                    <p>
                      <strong>Umidade:</strong>{" "}
                      {latestRabbitMqData[region]?.umidade.toFixed(1)}%
                    </p>
                    <p>
                      <strong>Pressão:</strong>{" "}
                      {latestRabbitMqData[region]?.pressao.toFixed(1)}hPa
                    </p>
                    <p>
                      <strong>Radiação:</strong>{" "}
                      {latestRabbitMqData[region]?.radiacao.toFixed(1)}µSv/h
                    </p>
                  </div>
                ) : (
                  <p className="waiting-data">Aguardando...</p>
                )}
              </div>
            ))}
          </div>
          <HistoryList title="Histórico RabbitMQ" history={rabbitMqHistory} />
        </div>
      </main>
    </div>
  );
}

export default App;
