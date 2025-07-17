import React from 'react';
import { Link } from 'react-router-dom';
import '../App.css';

const HomePage = () => {
  return (
    <div className="home-container">
      <h1>Selecione o Serviço de Mensageria</h1>
      <div className="home-links">
        <Link to="/mqtt" className="home-link">
          MQTT
        </Link>
        <Link to="/rabbitmq" className="home-link">
          RabbitMQ
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
