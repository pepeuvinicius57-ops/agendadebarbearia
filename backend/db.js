const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function iniciarBanco() {
  const db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      cargo TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      telefone TEXT NOT NULL,
      estilo_preferido TEXT NOT NULL,
      observacoes TEXT
    );

    CREATE TABLE IF NOT EXISTS agendamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL,
      barbeiro TEXT NOT NULL,
      servico TEXT NOT NULL,
      valor TEXT NOT NULL,
      data_agendamento TEXT NOT NULL,
      horario TEXT NOT NULL,
      status TEXT NOT NULL,
      FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario_nome TEXT NOT NULL,
      cargo TEXT NOT NULL,
      acao TEXT NOT NULL,
      detalhes TEXT NOT NULL,
      data_hora DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  return db;
}

module.exports = { iniciarBanco };