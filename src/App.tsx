import React, { useState, useEffect } from "react";
import mqtt from "mqtt";
import "./App.css";

// Interface para descrever a forma do objeto de dados do drone
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

// Tipo para o estado que armazena os dados mais recentes de cada região
type LatestDataState = {
  [key: string]: DroneData | null;
};

function App() {
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Desconectado");

  // Estado para os painéis principais: armazena o último dado de cada região
  const [latestData, setLatestData] = useState<LatestDataState>({
    Norte: null,
    Sul: null,
    Leste: null,
    Oeste: null,
  });

  // Estado para a lista de histórico: armazena as últimas 7 mensagens
  const [history, setHistory] = useState<DroneData[]>([]);

  useEffect(() => {
    const brokerUrl = "ws://broker.hivemq.com:8000/mqtt";
    const client = mqtt.connect(brokerUrl);

    client.on("connect", () => {
      setConnectionStatus("Conectado");
      client.subscribe("mqtt/dadosClima", { qos: 0 }, (err) => {
        if (err) {
          console.error("Falha ao assinar o tópico:", err);
        }
      });
    });

    client.on("message", (_topic: string, payload: Buffer) => {
      try {
        const messageData = JSON.parse(payload.toString());

        // Cria um objeto de dados completo com um ID único
        const newMessage: DroneData = {
          id: Date.now(), // ID baseado no timestamp para garantir unicidade
          ...messageData,
        };

        // 1. Atualiza o painel da região específica com os dados mais recentes
        setLatestData((prev) => ({
          ...prev,
          [newMessage.posicao]: newMessage,
        }));

        // 2. Adiciona a nova mensagem ao histórico e mantém o tamanho máximo de 7
        setHistory((prevHistory) => {
          const updatedHistory = [newMessage, ...prevHistory];
          if (updatedHistory.length > 7) {
            updatedHistory.pop(); // Remove o item mais antigo
          }
          return updatedHistory;
        });
      } catch (error) {
        console.error("Erro ao processar a mensagem JSON:", error);
      }
    });

    client.on("error", (err: Error) => {
      console.error("Erro de conexão:", err);
      setConnectionStatus(`Erro: ${err.message}`);
      client.end();
    });

    client.on("close", () => {
      setConnectionStatus("Desconectado");
    });

    return () => {
      if (client) {
        client.end();
      }
    };
  }, []);

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Dashboard de Drones</h1>
        <p>
          Status da Conexão: <strong>{connectionStatus}</strong>
        </p>
      </header>

      <main>
        {/* Seção para os painéis de dados mais recentes */}
        <h2>Últimos Dados por Região</h2>
        <div className="panels-container">
          {Object.keys(latestData).map((region) => (
            <div key={region} className="data-panel">
              <h3>{region}</h3>
              {latestData[region] ? (
                <div className="panel-content">
                  <p>
                    <strong>Temp:</strong>{" "}
                    {latestData[region]?.temperatura.toFixed(1)}°C
                  </p>
                  <p>
                    <strong>Umidade:</strong>{" "}
                    {latestData[region]?.umidade.toFixed(1)}%
                  </p>
                  <p>
                    <strong>Pressão:</strong>{" "}
                    {latestData[region]?.pressao.toFixed(1)}hPa
                  </p>
                  <p>
                    <strong>Radiação:</strong>{" "}
                    {latestData[region]?.radiacao.toFixed(1)}µSv/h
                  </p>
                </div>
              ) : (
                <p className="waiting-data">Aguardando dados...</p>
              )}
            </div>
          ))}
        </div>

        {/* Seção para o histórico de atualizações */}
        <div className="history-container">
          <h2>Últimas 7 Atualizações</h2>
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
                  {/* Converte o timestamp para uma string de hora legível */}
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
      </main>
    </div>
  );
}

export default App;
