#!/usr/bin/env node

/**
 * Script de prueba para el MCP Server Java Project Assistant
 * Este script simula las llamadas que haría Cursor al servidor MCP
 */

const { spawn } = require('child_process');
const path = require('path');

const SERVER_PATH = path.join(__dirname, 'dist', 'index.js');

console.log('🚀 Iniciando prueba del MCP Server Java Project Assistant...\n');

// Crear proceso del servidor MCP
const server = spawn('node', [SERVER_PATH], {
  stdio: ['pipe', 'pipe', 'pipe'],
  cwd: __dirname
});

let messageId = 1;

function sendMCPRequest(method, params = {}) {
  const request = {
    jsonrpc: '2.0',
    id: messageId++,
    method: method,
    params: params
  };
  
  console.log(`📤 Enviando: ${method}`);
  console.log(`📋 Parámetros:`, JSON.stringify(params, null, 2));
  
  server.stdin.write(JSON.stringify(request) + '\n');
}

function handleResponse() {
  server.stdout.on('data', (data) => {
    const responses = data.toString().trim().split('\n');
    
    responses.forEach(response => {
      if (response.trim()) {
        try {
          const parsed = JSON.parse(response);
          console.log(`📥 Respuesta recibida:`, JSON.stringify(parsed, null, 2));
          console.log('---\n');
        } catch (e) {
          console.log('📥 Respuesta (texto):', response);
        }
      }
    });
  });
}

function runTests() {
  console.log('🧪 Ejecutando pruebas del MCP Server...\n');
  
  // Test 1: Listar herramientas disponibles
  console.log('=== PRUEBA 1: Listar herramientas ===');
  sendMCPRequest('tools/list', {});
  
  setTimeout(() => {
    // Test 2: Análisis de dependencias
    console.log('=== PRUEBA 2: Análisis de dependencias ===');
    sendMCPRequest('tools/call', {
      name: 'analyze_dependencies',
      arguments: {
        projectPath: path.join(__dirname, 'example-java-project')
      }
    });
  }, 2000);
  
  setTimeout(() => {
    // Test 3: Análisis de calidad de código
    console.log('=== PRUEBA 3: Análisis de calidad de código ===');
    sendMCPRequest('tools/call', {
      name: 'check_code_quality',
      arguments: {
        projectPath: path.join(__dirname, 'example-java-project'),
        includeMetrics: true
      }
    });
  }, 5000);
  
  setTimeout(() => {
    // Test 4: Generación de tests
    console.log('=== PRUEBA 4: Generación de tests ===');
    sendMCPRequest('tools/call', {
      name: 'generate_tests',
      arguments: {
        projectPath: path.join(__dirname, 'example-java-project'),
        className: 'UserService',
        testFramework: 'junit5'
      }
    });
  }, 8000);
  
  setTimeout(() => {
    // Test 5: Análisis de estructura del proyecto
    console.log('=== PRUEBA 5: Análisis de estructura del proyecto ===');
    sendMCPRequest('tools/call', {
      name: 'analyze_project_structure',
      arguments: {
        projectPath: path.join(__dirname, 'example-java-project'),
        includeArchitecture: true,
        includeMetrics: true
      }
    });
  }, 11000);
  
  setTimeout(() => {
    console.log('✅ Pruebas completadas. Cerrando servidor...');
    server.kill();
    process.exit(0);
  }, 14000);
}

// Manejar errores
server.stderr.on('data', (data) => {
  console.error('❌ Error del servidor:', data.toString());
});

server.on('close', (code) => {
  console.log(`🔚 Servidor cerrado con código: ${code}`);
});

server.on('error', (error) => {
  console.error('❌ Error al iniciar servidor:', error);
  process.exit(1);
});

// Iniciar pruebas
handleResponse();
runTests();

console.log('⏳ Esperando respuestas del servidor...\n');
