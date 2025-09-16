#!/usr/bin/env node

/**
 * Script para testar o deploy localmente
 * Simula as condições de produção
 */

const { spawn } = require('child_process');
const http = require('http');

console.log('🧪 Testando deploy local...\n');

// Função para fazer requisição HTTP
function makeRequest(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Função para testar endpoints
async function testEndpoints(baseUrl) {
  console.log(`🔍 Testando endpoints em ${baseUrl}...\n`);

  const endpoints = [
    { path: '/', name: 'Root' },
    { path: '/health', name: 'Health Check' }
  ];

  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Testando ${endpoint.name} (${endpoint.path})...`);
      const response = await makeRequest(`${baseUrl}${endpoint.path}`);
      
      if (response.status === 200) {
        console.log(`✅ ${endpoint.name}: OK (${response.status})`);
        if (endpoint.path === '/health') {
          console.log(`   📊 Status: ${response.data.status}`);
          console.log(`   ⏰ Uptime: ${Math.round(response.data.uptime)}s`);
          console.log(`   🌍 Environment: ${response.data.environment}`);
        }
      } else {
        console.log(`❌ ${endpoint.name}: FAILED (${response.status})`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ERROR - ${error.message}`);
    }
    console.log('');
  }
}

// Função principal
async function main() {
  const port = process.env.PORT || 3000;
  const baseUrl = `http://localhost:${port}`;

  console.log('🚀 Iniciando servidor em modo produção...\n');

  // Iniciar servidor
  const server = spawn('npm', ['run', 'start:prod'], {
    stdio: 'pipe',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  // Capturar logs do servidor
  server.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Application is running on')) {
      console.log('✅ Servidor iniciado com sucesso!');
      console.log(`🌐 URL: ${baseUrl}\n`);
      
      // Aguardar um pouco e testar endpoints
      setTimeout(async () => {
        await testEndpoints(baseUrl);
        
        console.log('🛑 Finalizando teste...');
        server.kill();
        process.exit(0);
      }, 2000);
    }
  });

  server.stderr.on('data', (data) => {
    console.error('❌ Erro no servidor:', data.toString());
  });

  server.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ Servidor finalizado com código ${code}`);
      process.exit(1);
    }
  });

  // Timeout de segurança
  setTimeout(() => {
    console.log('⏰ Timeout atingido, finalizando...');
    server.kill();
    process.exit(1);
  }, 30000);
}

// Executar teste
main().catch(console.error);
