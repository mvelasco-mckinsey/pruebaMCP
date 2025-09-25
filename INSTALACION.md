# 🚀 Guía de Instalación - Java Project Assistant MCP Server

Esta guía te ayudará a instalar y configurar el MCP Server para usar con Cursor IDE.

## 📋 Prerrequisitos

### Software Requerido
- **Node.js 18+** - [Descargar aquí](https://nodejs.org/)
- **npm** (incluido con Node.js)
- **Cursor IDE** - [Descargar aquí](https://cursor.sh/)

### Verificar Instalación
```bash
node --version  # Debe ser 18.0.0 o superior
npm --version   # Debe ser 8.0.0 o superior
```

## 🔧 Instalación Paso a Paso

### 1. Preparar el Proyecto

```bash
# Navegar al directorio del proyecto
cd /Users/maria_velasco/Library/CloudStorage/OneDrive-McKinsey\&Company/Documents/workspace/latam/PruebasMCP

# Verificar que estás en el directorio correcto
ls -la
# Deberías ver: package.json, tsconfig.json, src/, example-java-project/
```

### 2. Instalar Dependencias

```bash
# Instalar todas las dependencias de Node.js
npm install

# Verificar que la instalación fue exitosa
npm list --depth=0
```

### 3. Compilar el Proyecto

```bash
# Compilar TypeScript a JavaScript
npm run build

# Verificar que se creó el directorio dist/
ls -la dist/
# Deberías ver: index.js y tools/
```

### 4. Probar el Servidor

```bash
# Ejecutar el script de prueba
node test-mcp-server.js

# Deberías ver las respuestas de las 5 herramientas
```

## ⚙️ Configuración en Cursor

### Método 1: Configuración Manual

1. **Abrir Cursor IDE**
2. **Ir a Settings** (Cmd/Ctrl + ,)
3. **Buscar "MCP"** en la configuración
4. **Agregar nueva configuración** en la sección MCP Servers:

```json
{
  "mcpServers": {
    "java-project-assistant": {
      "command": "node",
      "args": ["/Users/maria_velasco/Library/CloudStorage/OneDrive-McKinsey&Company/Documents/workspace/latam/PruebasMCP/dist/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Método 2: Usar Archivo de Configuración

1. **Copiar el archivo de configuración:**
```bash
cp cursor-mcp-config.json ~/.cursor/mcp-servers.json
```

2. **Reiniciar Cursor IDE**

### Verificar Configuración

1. **Abrir Cursor**
2. **Abrir un proyecto Java** (puedes usar el `example-java-project` incluido)
3. **Buscar en la barra de herramientas** el ícono de MCP o herramientas
4. **Deberías ver las 5 herramientas disponibles:**
   - `analyze_dependencies`
   - `generate_tests`
   - `check_code_quality`
   - `generate_documentation`
   - `analyze_project_structure`

## 🧪 Pruebas de Funcionamiento

### Prueba Básica
```bash
# En el directorio del proyecto
node test-mcp-server.js
```

### Prueba con Proyecto Java Real

1. **Abrir el proyecto de ejemplo en Cursor:**
   ```bash
   cd example-java-project
   cursor .
   ```

2. **Probar cada herramienta:**
   - Usar `analyze_dependencies` con el directorio actual
   - Usar `check_code_quality` para analizar el código
   - Usar `generate_tests` para crear tests
   - Usar `analyze_project_structure` para ver la arquitectura

## 🐛 Solución de Problemas

### Error: "Module not found"
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Error: "Command not found"
```bash
# Verificar que Node.js esté instalado
which node
node --version

# Verificar que el archivo compilado existe
ls -la dist/index.js
```

### Error: "Permission denied"
```bash
# Dar permisos de ejecución
chmod +x dist/index.js
```

### Cursor no detecta el MCP Server

1. **Verificar la configuración:**
   - Revisar la ruta en `cursor-mcp-config.json`
   - Asegurarse de que la ruta sea absoluta
   
2. **Reiniciar Cursor completamente:**
   - Cerrar todas las ventanas
   - Reiniciar la aplicación

3. **Verificar logs:**
   - Buscar en la consola de Cursor errores relacionados con MCP

### El servidor no responde

1. **Probar manualmente:**
   ```bash
   node dist/index.js
   # Debería mostrar: "Java Project Assistant MCP Server running on stdio"
   ```

2. **Verificar dependencias:**
   ```bash
   npm list @modelcontextprotocol/sdk
   ```

## 📊 Verificación Final

### Checklist de Instalación

- [ ] Node.js 18+ instalado
- [ ] Dependencias instaladas (`npm install`)
- [ ] Proyecto compilado (`npm run build`)
- [ ] Servidor responde a pruebas (`node test-mcp-server.js`)
- [ ] Cursor configurado con MCP Server
- [ ] Herramientas aparecen en Cursor
- [ ] Prueba exitosa con proyecto Java

### Comandos de Verificación

```bash
# Verificar instalación completa
npm run build && node test-mcp-server.js && echo "✅ Instalación exitosa"

# Verificar herramientas disponibles
node -e "
const { spawn } = require('child_process');
const server = spawn('node', ['dist/index.js'], {stdio: 'pipe'});
server.stdin.write(JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/list',params:{}}) + '\n');
server.stdout.on('data', d => console.log(d.toString()));
setTimeout(() => server.kill(), 2000);
"
```

## 🎯 Próximos Pasos

Una vez instalado correctamente:

1. **Leer la documentación:** `README.md`
2. **Seguir la guía de demo:** `DEMO_GUIDE.md`
3. **Probar con tu propio proyecto Java**
4. **Personalizar las herramientas según tus necesidades**

## 🆘 Soporte

Si encuentras problemas:

1. **Revisar esta guía** paso a paso
2. **Verificar los logs** de error
3. **Probar en un proyecto Java simple**
4. **Crear un issue** en el repositorio con:
   - Sistema operativo
   - Versión de Node.js
   - Versión de Cursor
   - Mensaje de error completo
   - Pasos para reproducir el problema

---

**¡Listo para usar el Java Project Assistant MCP Server! 🎉**
