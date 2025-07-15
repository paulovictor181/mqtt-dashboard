import React, { useState, useEffect } from "react";
import mqtt from "mqtt";
import "./App.css";

// 1. Definimos uma interface para descrever a "forma" do objeto
// que esperamos receber do MQTT. Isso é o coração do TypeScript aqui.
interface DroneMessage {
  id: number;
  pressao: number;
  radiacao: number;
  temperatura: number;
  umidade: number;
  latitude: number;
  longitude: number;
  posicao: string;
}

function App() {
  // 2. Adicionamos os tipos aos nossos estados usando a sintaxe <T>
  const [connectionStatus, setConnectionStatus] =
    useState<string>("Desconectado");
  const [messages, setMessages] = useState<DroneMessage[]>([]);

  useEffect(() => {
    const brokerUrl = "ws://broker.hivemq.com:8000/mqtt";
    const client = mqtt.connect(brokerUrl);

    client.on("connect", () => {
      setConnectionStatus("Conectado");
      client.subscribe("mqtt/dadosClima", (err) => {
        if (err) {
          console.error("Falha ao assinar o tópico:", err);
        }
      });
    });

    // 3. Adicionamos tipos aos parâmetros do callback para mais segurança
    client.on("message", (topic: string, payload: Buffer) => {
      try {
        const messageData = JSON.parse(payload.toString());

        // Criamos o novo objeto garantindo que ele segue a interface DroneMessage
        const newMessage: DroneMessage = {
          id: Date.now(),
          pressao: messageData.pressao,
          radiacao: messageData.radiacao,
          temperatura: messageData.temperatura,
          umidade: messageData.umidade,
          latitude: messageData.latitude,
          longitude: messageData.longitude,
          posicao: messageData.posicao,
        };

        setMessages((prevMessages) => [newMessage, ...prevMessages]);
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
      client.end();
    };
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Dashboard de Drones (TypeScript)</h1>
        <p>
          Status da Conexão MQTT: <strong>{connectionStatus}</strong>
        </p>
      </header>
      <main className="data-container">
        {messages.map((msg) => (
          <div key={msg.id} className="data-card">
            <h2>Drone da Região: {msg.posicao}</h2>
            <div className="data-grid">
              <p>
                <strong>Temperatura:</strong> {msg.temperatura.toFixed(2)} °C
              </p>
              <p>
                <strong>Umidade:</strong> {msg.umidade.toFixed(2)} %
              </p>
              <p>
                <strong>Pressão:</strong> {msg.pressao.toFixed(2)} hPa
              </p>
              <p>
                <strong>Radiação:</strong> {msg.radiacao.toFixed(2)} µSv/h
              </p>
              <p>
                <strong>Latitude:</strong> {msg.latitude}
              </p>
              <p>
                <strong>Longitude:</strong> {msg.longitude}
              </p>
            </div>
          </div>
        ))}
      </main>
    </div>
  );
}

export default App;
