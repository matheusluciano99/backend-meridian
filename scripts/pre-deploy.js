#!/usr/bin/env node

/**
 * Script de verificação pré-deploy para Railway
 * Verifica se todas as configurações estão corretas
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Verificando configurações para deploy no Railway...\n');

// Verificar se o build existe
const distPath = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distPath)) {
  console.error('❌ Diretório dist/ não encontrado. Execute: npm run build');
  process.exit(1);
}
console.log('✅ Build encontrado');

// Verificar package.json
const packagePath = path.join(__dirname, '..', 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

if (!packageJson.scripts['start:prod']) {
  console.error('❌ Script start:prod não encontrado no package.json');
  process.exit(1);
}
console.log('✅ Script start:prod configurado');

// Verificar se main.ts existe no dist
const mainJsPath = path.join(distPath, 'main.js');
if (!fs.existsSync(mainJsPath)) {
  console.error('❌ main.js não encontrado no dist/');
  process.exit(1);
}
console.log('✅ main.js compilado');

// Verificar arquivos de configuração
const railwayJsonPath = path.join(__dirname, '..', 'railway.json');
if (!fs.existsSync(railwayJsonPath)) {
  console.warn('⚠️  railway.json não encontrado (opcional)');
} else {
  console.log('✅ railway.json configurado');
}

const procfilePath = path.join(__dirname, '..', 'Procfile');
if (!fs.existsSync(procfilePath)) {
  console.warn('⚠️  Procfile não encontrado (opcional)');
} else {
  console.log('✅ Procfile configurado');
}

// Verificar variáveis de ambiente necessárias
const requiredEnvVars = [
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'STELLAR_NETWORK_PASSPHRASE',
  'STELLAR_RPC_URL'
];

console.log('\n📋 Variáveis de ambiente necessárias:');
requiredEnvVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`✅ ${envVar} configurada`);
  } else {
    console.log(`❌ ${envVar} não configurada`);
  }
});

console.log('\n🎉 Verificação concluída!');
console.log('\n📝 Próximos passos:');
console.log('1. Configure as variáveis de ambiente no Railway');
console.log('2. Faça o deploy via Railway Dashboard ou CLI');
console.log('3. Verifique os logs após o deploy');
console.log('4. Teste a aplicação em produção');

process.exit(0);
