import { useState, useEffect } from 'react';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
});

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('barber_token') || '');
  const [usuario, setUsuario] = useState(() => {
    const salvo = localStorage.getItem('barber_usuario');
    return salvo ? JSON.parse(salvo) : null;
  });

  // Login / Cadastro
  const [modoCadastro, setModoCadastro] = useState(false);
  const [nomeUser, setNomeUser] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [cargo, setCargo] = useState('Barbeiro');

  // Navegação e avisos
  const [aba, setAba] = useState('agendamentos');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');
  const [carregando, setCarregando] = useState(false);

  // Dados
  const [clientes, setClientes] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [logs, setLogs] = useState([]);

  // Formulário Clientes
  const [editandoClienteId, setEditandoClienteId] = useState(null);
  const [cliNome, setCliNome] = useState('');
  const [cliTelefone, setCliTelefone] = useState('');
  const [cliEstilo, setCliEstilo] = useState('Degradê (Fade)');
  const [cliObs, setCliObs] = useState('');
  const [buscaCliente, setBuscaCliente] = useState('');

  // Formulário Agendamentos
  const hoje = new Date().toISOString().split('T')[0];
  const [editandoAgId, setEditandoAgId] = useState(null);
  const [agClienteId, setAgClienteId] = useState('');
  const [agBarbeiro, setAgBarbeiro] = useState('Lucas');
  const [agServico, setAgServico] = useState('Corte Degradê');
  const [agValor, setAgValor] = useState('R$ 40,00');
  const [agData, setAgData] = useState(hoje);
  const [agHorario, setAgHorario] = useState('10:00');
  const [agStatus, setAgStatus] = useState('Agendado');
  const [filtroData, setFiltroData] = useState('');
  const [filtroStatus, setFiltroStatus] = useState('Todos');

  // Filtro Logs
  const [buscaLog, setBuscaLog] = useState('');

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  function limparMensagens() {
    setErro('');
    setSucesso('');
  }

  function fazerLogout() {
    localStorage.removeItem('barber_token');
    localStorage.removeItem('barber_usuario');
    setToken('');
    setUsuario(null);
    setClientes([]);
    setAgendamentos([]);
    setLogs([]);
    limparMensagens();
  }

  function tratarErro(err) {
    if (err.response?.status === 401) {
      fazerLogout();
      setErro('Sessão expirada. Faça login novamente.');
    } else {
      setErro(err.response?.data?.erro || 'Erro ao conectar com o servidor.');
    }
  }

  async function handleAuth(e) {
    e.preventDefault();
    limparMensagens();
    setCarregando(true);

    try {
      if (modoCadastro) {
        await api.post('/register', { nome: nomeUser, email, senha, cargo });
        setSucesso('Conta criada com sucesso! Agora faça login.');
        setModoCadastro(false);
        setSenha('');
      } else {
        const res = await api.post('/login', { email, senha });
        localStorage.setItem('barber_token', res.data.token);
        localStorage.setItem('barber_usuario', JSON.stringify(res.data.usuario));
        setToken(res.data.token);
        setUsuario(res.data.usuario);
        setEmail('');
        setSenha('');
      }
    } catch (err) {
      setErro(err.response?.data?.erro || 'Erro na autenticação.');
    } finally {
      setCarregando(false);
    }
  }

  async function carregarClientes() {
    try {
      const res = await api.get('/clientes', authHeaders());
      setClientes(res.data);
    } catch (err) {
      tratarErro(err);
    }
  }

  async function carregarAgendamentos(dataSel = filtroData) {
    try {
      const url = dataSel ? `/agendamentos?data=${dataSel}` : '/agendamentos';
      const res = await api.get(url, authHeaders());
      setAgendamentos(res.data);
    } catch (err) {
      tratarErro(err);
    }
  }

  async function carregarLogs() {
    try {
      const res = await api.get('/logs', authHeaders());
      setLogs(res.data);
    } catch (err) {
      tratarErro(err);
    }
  }

  useEffect(() => {
    if (!token) return;
    carregarClientes();
    carregarAgendamentos();
    if (aba === 'logs') carregarLogs();
  }, [token, aba]);

  // ================= CRUD CLIENTES =================

  async function salvarCliente(e) {
    e.preventDefault();
    limparMensagens();

    const payload = {
      nome: cliNome,
      telefone: cliTelefone,
      estilo_preferido: cliEstilo,
      observacoes: cliObs,
    };

    try {
      if (editandoClienteId) {
        await api.put(`/clientes/${editandoClienteId}`, payload, authHeaders());
        setSucesso('Cliente atualizado com sucesso!');
      } else {
        await api.post('/clientes', payload, authHeaders());
        setSucesso('Cliente cadastrado com sucesso!');
      }
      cancelarEdicaoCliente();
      carregarClientes();
    } catch (err) {
      tratarErro(err);
    }
  }

  function iniciarEdicaoCliente(c) {
    setEditandoClienteId(c.id);
    setCliNome(c.nome);
    setCliTelefone(c.telefone);
    setCliEstilo(c.estilo_preferido);
    setCliObs(c.observacoes || '');
    limparMensagens();
  }

  function cancelarEdicaoCliente() {
    setEditandoClienteId(null);
    setCliNome('');
    setCliTelefone('');
    setCliEstilo('Degradê (Fade)');
    setCliObs('');
  }

  async function excluirCliente(id) {
    if (!window.confirm('Tem certeza que deseja excluir este cliente?')) return;
    limparMensagens();
    try {
      await api.delete(`/clientes/${id}`, authHeaders());
      setSucesso('Cliente excluído!');
      carregarClientes();
      carregarAgendamentos();
    } catch (err) {
      tratarErro(err);
    }
  }

  // ================= CRUD AGENDAMENTOS =================

  async function salvarAgendamento(e) {
    e.preventDefault();
    limparMensagens();

    try {
      if (editandoAgId) {
        await api.put(
          `/agendamentos/${editandoAgId}`,
          {
            barbeiro: agBarbeiro,
            servico: agServico,
            valor: agValor,
            data_agendamento: agData,
            horario: agHorario,
            status: agStatus,
          },
          authHeaders()
        );
        setSucesso('Agendamento atualizado!');
      } else {
        await api.post(
          '/agendamentos',
          {
            cliente_id: Number(agClienteId),
            barbeiro: agBarbeiro,
            servico: agServico,
            valor: agValor,
            data_agendamento: agData,
            horario: agHorario,
            status: agStatus,
          },
          authHeaders()
        );
        setSucesso('Horário agendado com sucesso!');
      }
      cancelarEdicaoAg();
      carregarAgendamentos();
    } catch (err) {
      tratarErro(err);
    }
  }

  function iniciarEdicaoAg(a) {
    setEditandoAgId(a.id);
    setAgClienteId(String(a.cliente_id));
    setAgBarbeiro(a.barbeiro);
    setAgServico(a.servico);
    setAgValor(a.valor);
    setAgData(a.data_agendamento);
    setAgHorario(a.horario);
    setAgStatus(a.status);
    limparMensagens();
  }

  function cancelarEdicaoAg() {
    setEditandoAgId(null);
    setAgClienteId('');
    setAgBarbeiro('Lucas');
    setAgServico('Corte Degradê');
    setAgValor('R$ 40,00');
    setAgData(hoje);
    setAgHorario('10:00');
    setAgStatus('Agendado');
  }

  async function excluirAgendamento(id) {
    if (!window.confirm('Deseja apagar este agendamento?')) return;
    limparMensagens();
    try {
      await api.delete(`/agendamentos/${id}`, authHeaders());
      setSucesso('Agendamento removido!');
      carregarAgendamentos();
    } catch (err) {
      tratarErro(err);
    }
  }

  function formatarDataBR(iso) {
    if (!iso) return '';
    const [ano, mes, dia] = iso.split('-');
    return `${dia}/${mes}/${ano}`;
  }

  function formatarDataHora(texto) {
    if (!texto) return '';
    return new Date(texto.replace(' ', 'T') + 'Z').toLocaleString('pt-BR');
  }

  function classeStatus(status) {
    if (status === 'Finalizado') return 'badge-verde';
    if (status === 'Na Cadeira') return 'badge-ouro';
    if (status === 'Cancelado') return 'badge-cinza';
    return 'badge-azul';
  }

  const totalAgendados = agendamentos.filter((a) => a.status === 'Agendado').length;
  const totalNaCadeira = agendamentos.filter((a) => a.status === 'Na Cadeira').length;
  const totalFinalizados = agendamentos.filter((a) => a.status === 'Finalizado').length;

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(buscaCliente.toLowerCase()) ||
      c.telefone.toLowerCase().includes(buscaCliente.toLowerCase()) ||
      c.estilo_preferido.toLowerCase().includes(buscaCliente.toLowerCase())
  );

  const agendamentosFiltrados = agendamentos.filter(
    (a) => filtroStatus === 'Todos' || a.status === filtroStatus
  );

  const logsFiltrados = logs.filter(
    (l) =>
      l.usuario_nome.toLowerCase().includes(buscaLog.toLowerCase()) ||
      l.acao.toLowerCase().includes(buscaLog.toLowerCase()) ||
      l.detalhes.toLowerCase().includes(buscaLog.toLowerCase())
  );

  // ================= TELA DE LOGIN =================

  if (!token) {
    return (
      <div className="auth-split">
        <div className="auth-banner">
          <div className="banner-content">
            <span className="banner-pill">💈 Gestão de Barbearia</span>
            <h1>BarberPro Studio</h1>
            <p className="banner-desc">
              Controle completo da sua barbearia: clientes, agenda de cortes e barba, barbeiros e histórico de auditoria em tempo real.
            </p>
            <div className="banner-cards">
              <div className="mini-feature">
                <span>✂️</span>
                <div>
                  <strong>Agenda Organizada</strong>
                  <small>Cortes, degradê, barba e combos sem atraso</small>
                </div>
              </div>
              <div className="mini-feature">
                <span>👤</span>
                <div>
                  <strong>Ficha de Clientes</strong>
                  <small>Salve o estilo preferido e contato de cada cliente</small>
                </div>
              </div>
              <div className="mini-feature">
                <span>🛡️</span>
                <div>
                  <strong>Auditoria da Equipe</strong>
                  <small>Logs automáticos de tudo que acontece no sistema</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-form-side">
          <div className="auth-box">
            <div className="auth-switch">
              <button
                type="button"
                className={!modoCadastro ? 'ativo' : ''}
                onClick={() => { setModoCadastro(false); limparMensagens(); }}
              >
                Entrar
              </button>
              <button
                type="button"
                className={modoCadastro ? 'ativo' : ''}
                onClick={() => { setModoCadastro(true); limparMensagens(); }}
              >
                Criar Conta
              </button>
            </div>

            <h2>{modoCadastro ? 'Novo Profissional' : 'Acesso ao Painel'}</h2>
            <p className="subtitulo-left">
              {modoCadastro ? 'Cadastre-se para usar o sistema da barbearia.' : 'Entre com seu e-mail e senha.'}
            </p>

            {erro && <div className="alerta alerta-erro">{erro}</div>}
            {sucesso && <div className="alerta alerta-sucesso">{sucesso}</div>}

            <form onSubmit={handleAuth}>
              {modoCadastro && (
                <>
                  <div className="form-group">
                    <label>Nome completo</label>
                    <input
                      type="text"
                      value={nomeUser}
                      onChange={(e) => setNomeUser(e.target.value)}
                      placeholder="Ex: Carlos Eduardo"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Cargo</label>
                    <select value={cargo} onChange={(e) => setCargo(e.target.value)}>
                      <option value="Barbeiro">Barbeiro</option>
                      <option value="Barbeiro Master">Barbeiro Master</option>
                      <option value="Recepcionista">Recepcionista</option>
                      <option value="Gerente">Gerente</option>
                    </select>
                  </div>
                </>
              )}

              <div className="form-group">
                <label>E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="barbeiro@barberpro.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Senha</label>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button type="submit" className="btn-primary btn-lg" disabled={carregando}>
                {carregando ? 'Carregando...' : modoCadastro ? 'Finalizar Cadastro' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ================= PAINEL PRINCIPAL =================

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">💈</div>
          <div>
            <h2>BarberPro</h2>
            <small>Studio & Barbearia</small>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${aba === 'agendamentos' ? 'ativo' : ''}`}
            onClick={() => { setAba('agendamentos'); limparMensagens(); }}
          >
            <span>📅</span> Agenda
            <span className="nav-count">{agendamentos.length}</span>
          </button>

          <button
            className={`nav-item ${aba === 'clientes' ? 'ativo' : ''}`}
            onClick={() => { setAba('clientes'); limparMensagens(); }}
          >
            <span>👤</span> Clientes
            <span className="nav-count">{clientes.length}</span>
          </button>

          <button
            className={`nav-item ${aba === 'logs' ? 'ativo' : ''}`}
            onClick={() => { setAba('logs'); limparMensagens(); }}
          >
            <span>🛡️</span> Logs
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="avatar">{usuario?.nome?.slice(0, 2).toUpperCase()}</div>
            <div className="user-details">
              <strong>{usuario?.nome}</strong>
              <span>{usuario?.cargo}</span>
            </div>
          </div>
          <button className="btn-logout" onClick={fazerLogout} style={{ width: '100%' }}>
            Sair
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-header">
          <h1>
            {aba === 'agendamentos' && 'Agenda da Barbearia'}
            {aba === 'clientes' && 'Cadastro de Clientes'}
            {aba === 'logs' && 'Histórico de Auditoria (Logs)'}
          </h1>
        </div>

        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Clientes</span>
            <span className="stat-value ouro">{clientes.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Agendados</span>
            <span className="stat-value">{totalAgendados}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Na Cadeira</span>
            <span className="stat-value ouro">{totalNaCadeira}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Finalizados</span>
            <span className="stat-value verde">{totalFinalizados}</span>
          </div>
        </section>

        {erro && <div className="alerta alerta-erro">{erro}</div>}
        {sucesso && <div className="alerta alerta-sucesso">{sucesso}</div>}

        {/* ABA AGENDAMENTOS */}
        {aba === 'agendamentos' && (
          <>
            <div className="card">
              <h3>{editandoAgId ? '✏️ Editar Horário' : '➕ Novo Agendamento'}</h3>
              <form className="form-grid" onSubmit={salvarAgendamento} style={{ marginTop: '14px' }}>
                <div className="form-group">
                  <label>Cliente</label>
                  <select
                    value={agClienteId}
                    onChange={(e) => setAgClienteId(e.target.value)}
                    disabled={!!editandoAgId}
                    required
                  >
                    <option value="">Selecione um cliente...</option>
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome} ({c.telefone})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Barbeiro</label>
                  <select value={agBarbeiro} onChange={(e) => setAgBarbeiro(e.target.value)}>
                    <option value="Lucas">Lucas</option>
                    <option value="Matheus">Matheus</option>
                    <option value="Gabriel">Gabriel</option>
                    <option value="Rafael">Rafael</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Serviço</label>
                  <select value={agServico} onChange={(e) => setAgServico(e.target.value)}>
                    <option value="Corte Degradê">Corte Degradê</option>
                    <option value="Corte Social">Corte Social</option>
                    <option value="Barba Completa">Barba Completa</option>
                    <option value="Combo Corte + Barba">Combo Corte + Barba</option>
                    <option value="Sobrancelha">Sobrancelha</option>
                    <option value="Pigmentação / Luzes">Pigmentação / Luzes</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Valor</label>
                  <input
                    type="text"
                    value={agValor}
                    onChange={(e) => setAgValor(e.target.value)}
                    placeholder="R$ 40,00"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Data</label>
                  <input type="date" value={agData} onChange={(e) => setAgData(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label>Horário</label>
                  <input type="time" value={agHorario} onChange={(e) => setAgHorario(e.target.value)} required />
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select value={agStatus} onChange={(e) => setAgStatus(e.target.value)}>
                    <option value="Agendado">Agendado</option>
                    <option value="Na Cadeira">Na Cadeira</option>
                    <option value="Finalizado">Finalizado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                    {editandoAgId ? 'Salvar' : 'Agendar'}
                  </button>
                  {editandoAgId && (
                    <button type="button" className="btn-secondary" onClick={cancelarEdicaoAg}>
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="card">
              <div className="card-header">
                <h3>Horários Marcados ({agendamentosFiltrados.length})</h3>
                <div className="filtro-row">
                  <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                    <option value="Todos">Todos os status</option>
                    <option value="Agendado">Agendado</option>
                    <option value="Na Cadeira">Na Cadeira</option>
                    <option value="Finalizado">Finalizado</option>
                    <option value="Cancelado">Cancelado</option>
                  </select>
                  <input
                    type="date"
                    value={filtroData}
                    onChange={(e) => {
                      setFiltroData(e.target.value);
                      carregarAgendamentos(e.target.value);
                    }}
                  />
                </div>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Data / Hora</th>
                      <th>Cliente</th>
                      <th>Serviço / Barbeiro</th>
                      <th>Valor</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agendamentosFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="empty-state">Nenhum agendamento encontrado.</td>
                      </tr>
                    ) : (
                      agendamentosFiltrados.map((a) => (
                        <tr key={a.id}>
                          <td>
                            <strong>{formatarDataBR(a.data_agendamento)}</strong>
                            <div className="sub-cell">às {a.horario}</div>
                          </td>
                          <td>
                            <strong>{a.cliente_nome}</strong>
                            <div className="sub-cell">{a.cliente_telefone}</div>
                          </td>
                          <td>
                            <strong>{a.servico}</strong>
                            <div className="sub-cell">Barbeiro: {a.barbeiro}</div>
                          </td>
                          <td>{a.valor}</td>
                          <td>
                            <span className={`badge ${classeStatus(a.status)}`}>{a.status}</span>
                          </td>
                          <td>
                            <div className="acoes-cell">
                              <button className="btn-edit btn-sm" onClick={() => iniciarEdicaoAg(a)}>Editar</button>
                              <button className="btn-delete btn-sm" onClick={() => excluirAgendamento(a.id)}>Excluir</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ABA CLIENTES */}
        {aba === 'clientes' && (
          <>
            <div className="card">
              <h3>{editandoClienteId ? '✏️ Editar Cliente' : '➕ Novo Cliente'}</h3>
              <form className="form-grid" onSubmit={salvarCliente} style={{ marginTop: '14px' }}>
                <div className="form-group">
                  <label>Nome do Cliente</label>
                  <input
                    type="text"
                    value={cliNome}
                    onChange={(e) => setCliNome(e.target.value)}
                    placeholder="Ex: João Pedro"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>WhatsApp / Telefone</label>
                  <input
                    type="text"
                    value={cliTelefone}
                    onChange={(e) => setCliTelefone(e.target.value)}
                    placeholder="(81) 99999-9999"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Corte Preferido</label>
                  <select value={cliEstilo} onChange={(e) => setCliEstilo(e.target.value)}>
                    <option value="Degradê (Fade)">Degradê (Fade)</option>
                    <option value="Social">Social</option>
                    <option value="Americano">Americano</option>
                    <option value="Navalhado">Navalhado</option>
                    <option value="Barba Desenhada">Barba Desenhada</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Observações</label>
                  <input
                    type="text"
                    value={cliObs}
                    onChange={(e) => setCliObs(e.target.value)}
                    placeholder="Ex: Máquina 1 nas laterais"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                    {editandoClienteId ? 'Salvar' : 'Cadastrar'}
                  </button>
                  {editandoClienteId && (
                    <button type="button" className="btn-secondary" onClick={cancelarEdicaoCliente}>
                      Cancelar
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="card">
              <div className="card-header">
                <h3>Lista de Clientes ({clientesFiltrados.length})</h3>
                <input
                  type="text"
                  value={buscaCliente}
                  onChange={(e) => setBuscaCliente(e.target.value)}
                  placeholder="Buscar por nome, telefone ou corte..."
                  style={{ minWidth: '240px' }}
                />
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Telefone</th>
                      <th>Estilo Preferido</th>
                      <th>Observações</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientesFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="empty-state">Nenhum cliente cadastrado.</td>
                      </tr>
                    ) : (
                      clientesFiltrados.map((c) => (
                        <tr key={c.id}>
                          <td><strong>{c.nome}</strong></td>
                          <td>{c.telefone}</td>
                          <td><span className="badge badge-ouro">{c.estilo_preferido}</span></td>
                          <td>{c.observacoes || '-'}</td>
                          <td>
                            <div className="acoes-cell">
                              <button className="btn-edit btn-sm" onClick={() => iniciarEdicaoCliente(c)}>Editar</button>
                              <button className="btn-delete btn-sm" onClick={() => excluirCliente(c.id)}>Excluir</button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ABA LOGS */}
        {aba === 'logs' && (
          <div className="card">
            <div className="card-header">
              <h3>Registros de Atividade ({logsFiltrados.length})</h3>
              <div className="filtro-row">
                <input
                  type="text"
                  value={buscaLog}
                  onChange={(e) => setBuscaLog(e.target.value)}
                  placeholder="Filtrar logs..."
                />
                <button className="btn-secondary btn-sm" onClick={carregarLogs}>Atualizar</button>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Data e Hora</th>
                    <th>Profissional</th>
                    <th>Ação</th>
                    <th>Detalhes</th>
                  </tr>
                </thead>
                <tbody>
                  {logsFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty-state">Nenhum log registrado.</td>
                    </tr>
                  ) : (
                    logsFiltrados.map((log) => (
                      <tr key={log.id}>
                        <td>{formatarDataHora(log.data_hora)}</td>
                        <td>
                          <strong>{log.usuario_nome}</strong>
                          <div className="sub-cell">{log.cargo}</div>
                        </td>
                        <td><span className="badge badge-ouro">{log.acao}</span></td>
                        <td>{log.detalhes}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}