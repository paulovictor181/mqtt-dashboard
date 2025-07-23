import { useState, useEffect } from "react";
import "../App.css";

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

// Componente reutilizável para o Histórico (sem alterações)
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

const parametros = [
  { label: "Temperatura", value: "temperatura" },
  { label: "Umidade relativa do ar", value: "umidade" },
  { label: "Pressão do ar", value: "pressao" },
  { label: "Radiação", value: "radiacao" },
];

const RabbitMqPage = () => {
  const [rabbitMqHistory, setRabbitMqHistory] = useState<DroneData[]>([]);

  // Estados para estatísticas (sem alterações)
  const [totalColetado, setTotalColetado] = useState<number | null>(null);
  const [totalPorRegiao, setTotalPorRegiao] = useState<Record<string, number>>(
    {}
  );
  const [loadingTotal, setLoadingTotal] = useState(true);
  const [errorTotal, setErrorTotal] = useState<string | null>(null);
  const [loadingTotalPorRegiao, setLoadingTotalPorRegiao] = useState(true);
  const [errorTotalPorRegiao, setErrorTotalPorRegiao] = useState<string | null>(
    null
  );
  const [loadingTotalPorElemento, setLoadingTotalPorElemento] = useState(true);
  const [errorTotalPorElemento, setErrorTotalPorElemento] = useState<
    string | null
  >(null);
  const [totalPorElemento, setTotalPorElemento] = useState<
    Record<string, number>
  >({});
  const [parametro, setParametro] = useState("temperatura");
  const [percentuais, setPercentuais] = useState<
    { regiao: string; valor: number }[]
  >([]);
  const [loadingPercentuais, setLoadingPercentuais] = useState(false);
  const [errorPercentuais, setErrorPercentuais] = useState<string | null>(null);

  // Função para calcular percentuais (sem alterações)
  function calcularPercentuais(parametro: string) {
    if (rabbitMqHistory.length === 0) return [];
    const regioes: Record<string, number[]> = {};
    rabbitMqHistory.forEach((msg) => {
      const regiao = msg.posicao.toLowerCase();
      if (!regioes[regiao]) regioes[regiao] = [];
      regioes[regiao].push(msg[parametro as keyof DroneData] as number);
    });
    const total = Object.values(regioes)
      .flat()
      .reduce((acc, v) => acc + v, 0);
    if (total === 0)
      return Object.entries(regioes).map(([regiao]) => ({ regiao, valor: 0 }));
    return Object.entries(regioes)
      .map(([regiao, valores]) => ({
        regiao,
        valor: (valores.reduce((acc, v) => acc + v, 0) / total) * 100,
      }))
      .sort((a, b) => b.valor - a.valor);
  }

  useEffect(() => {
    let isMounted = true;
    const fetchHistory = () => {
      fetch("/api/drones/status")
        .then((res) => {
          if (!res.ok) {
            throw new Error("Erro ao buscar histórico");
          }
          return res.json();
        })
        .then((data: DroneData[]) => {
          if (isMounted) {
            const formattedData = data
              .map((d) => ({ ...d, id: d.id || Date.now() + Math.random() }))
              .sort((a, b) => b.id - a.id);
            setRabbitMqHistory(formattedData);
          }
        })
        .catch((error) => {
          console.error("Falha ao buscar histórico de drones:", error);
        });
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    setLoadingTotal(true);
    setErrorTotal(null);
    let isMounted = true;
    const fetchTotal = () => {
      fetch("/api/estatisticas/total-coletado")
        .then((res) => {
          if (!res.ok) throw new Error("Erro ao buscar total");
          return res.json();
        })
        .then((total) => {
          if (isMounted) setTotalColetado(total);
        })
        .catch(() => {
          if (isMounted)
            setErrorTotal("Erro ao buscar total de dados coletados");
        })
        .finally(() => {
          if (isMounted) setLoadingTotal(false);
        });
    };
    fetchTotal();
    const interval = setInterval(fetchTotal, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    setLoadingTotalPorRegiao(true);
    setErrorTotalPorRegiao(null);
    let isMounted = true;
    const fetchTotalPorRegiao = () => {
      fetch("/api/estatisticas/total-por-regiao")
        .then((res) => {
          if (!res.ok) throw new Error("Erro ao buscar total por região");
          return res.json();
        })
        .then((data) => {
          if (isMounted) setTotalPorRegiao(data);
        })
        .catch(() => {
          if (isMounted)
            setErrorTotalPorRegiao("Erro ao buscar total por região");
        })
        .finally(() => {
          if (isMounted) setLoadingTotalPorRegiao(false);
        });
    };
    fetchTotalPorRegiao();
    const interval = setInterval(fetchTotalPorRegiao, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    setLoadingTotalPorElemento(true);
    setErrorTotalPorElemento(null);
    let isMounted = true;
    const fetchTotalPorElemento = () => {
      fetch("/api/estatisticas/total-por-elemento-climatico")
        .then((res) => {
          if (!res.ok)
            throw new Error("Erro ao buscar total por elemento climático");
          return res.json();
        })
        .then((data) => {
          if (isMounted) setTotalPorElemento(data);
        })
        .catch(() => {
          if (isMounted)
            setErrorTotalPorElemento(
              "Erro ao buscar total por elemento climático"
            );
        })
        .finally(() => {
          if (isMounted) setLoadingTotalPorElemento(false);
        });
    };
    fetchTotalPorElemento();
    const interval = setInterval(fetchTotalPorElemento, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const fetchPercentuais = async () => {
      setLoadingPercentuais(true);
      setErrorPercentuais(null);
      try {
        const res = await fetch(
          `/api/estatisticas/percentual?parametro=${parametro}`
        );
        if (!res.ok) throw new Error("Erro ao buscar percentuais");
        const data = await res.json();
        setPercentuais(data);
      } catch (err) {
        setErrorPercentuais("Erro ao buscar percentuais");
        setPercentuais([]);
      } finally {
        setLoadingPercentuais(false);
      }
    };
    fetchPercentuais();
  }, [parametro]);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Dashboard de Drones - Dados Históricos RabbitMQ</h1>
      </header>
      <main>
        {/* Total de dados coletados */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 style={{ textAlign: 'center' }}>Total de dados coletados</h2>
          {loadingTotal ? (
            <p>Carregando...</p>
          ) : errorTotal ? (
            <p style={{ color: "red" }}>{errorTotal}</p>
          ) : (
            <p style={{ fontSize: "1.5rem", fontWeight: 600 }}>
              {totalColetado}
            </p>
          )}
        </div>
        {/* Total de dados coletados por região */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 style={{ textAlign: 'center' }}>Total por região</h2>
          {loadingTotalPorRegiao ? (
            <p>Carregando...</p>
          ) : errorTotalPorRegiao ? (
            <p style={{ color: "red" }}>{errorTotalPorRegiao}</p>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "2rem",
                flexWrap: "wrap",
              }}
            >
              {Object.entries(totalPorRegiao).map(([regiao, valor]) => (
                <div
                  key={regiao}
                  style={{
                    background: "#f5f5f5",
                    borderRadius: 8,
                    padding: "1rem 2rem",
                    minWidth: 100,
                  }}
                >
                  <strong>
                    {regiao.charAt(0).toUpperCase() + regiao.slice(1)}:
                  </strong>{" "}
                  {valor}
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Total de dados coletados por elemento climático */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 style={{ textAlign: 'center' }}>Total por elemento climático</h2>
          {loadingTotal ? (
            <p>Carregando...</p>
          ) : errorTotal ? (
            <p style={{ color: "red" }}>{errorTotal}</p>
          ) : (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "2rem",
                flexWrap: "wrap",
              }}
            >
              {["Temperatura", "Umidade", "Pressao", "Radiacao"].map(
                (elemento) => (
                  <div
                    key={elemento}
                    style={{
                      background: "#f5f5f5",
                      borderRadius: 8,
                      padding: "1rem 2rem",
                      minWidth: 120,
                    }}
                  >
                    <strong>{elemento}:</strong> {totalColetado}
                  </div>
                )
              )}
            </div>
          )}
        </div>
        {/* Seletor de parâmetro */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <label htmlFor="parametro-select">
            <strong>Escolha o parâmetro:</strong>{" "}
          </label>
          <select
            id="parametro-select"
            value={parametro}
            onChange={(e) => setParametro(e.target.value)}
            style={{
              fontSize: "1rem",
              padding: "0.5rem 1rem",
              borderRadius: 6,
              marginLeft: 8,
            }}
          >
            {parametros.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        {/* Lista de percentuais */}
        <div
          style={{
            maxWidth: 500,
            margin: "0 auto 2rem auto",
            background: "#f5f5f5",
            borderRadius: 10,
            padding: "1.5rem 2rem",
          }}
        >
          <h3 style={{ marginBottom: 16 }}>
            Percentual por região (
            {parametros.find((p) => p.value === parametro)?.label})
          </h3>
          {rabbitMqHistory.length === 0 ? (
            <p>Nenhum dado disponível.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {calcularPercentuais(parametro).map(({ regiao, valor }) => (
                <li key={regiao} style={{ marginBottom: 10 }}>
                  <strong>
                    {regiao.charAt(0).toUpperCase() + regiao.slice(1)}:
                  </strong>{" "}
                  {valor.toFixed(2)}%
                </li>
              ))}
            </ul>
          )}
        </div>
        <HistoryList title="Histórico" history={rabbitMqHistory} />
      </main>
    </div>
  );
};

export default RabbitMqPage;