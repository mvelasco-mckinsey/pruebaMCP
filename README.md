# Java Project Assistant MCP Server

Un servidor MCP (Model Context Protocol) especializado en análisis y asistencia para proyectos Java. Este servidor proporciona herramientas avanzadas para desarrolladores Java que trabajan con Cursor IDE.

Representa un ejemplo de servidor MCP para demostrar su configuración en Cursor. No debe considerarse su uso como un validador de código.

## 🚀 Características

### Herramientas Disponibles

1. **🔍 analyze_dependencies** - Análisis de dependencias Maven/Gradle
   - Detecta versiones desactualizadas
   - Identifica dependencias no utilizadas
   - Sugiere mejoras de seguridad

2. **🧪 generate_tests** - Generación de tests unitarios
   - Crea templates de tests para JUnit 4/5 y TestNG
   - Analiza métodos públicos
   - Sugiere casos de prueba

3. **📊 check_code_quality** - Análisis de calidad de código
   - Detecta code smells
   - Calcula métricas de complejidad
   - Proporciona recomendaciones de mejora

4. **📚 generate_documentation** - Generación de documentación
   - Crea documentación de APIs
   - Genera sugerencias de Javadoc
   - Analiza cobertura de documentación

5. **🏗️ analyze_project_structure** - Análisis de arquitectura
   - Detecta patrones arquitectónicos
   - Analiza organización de paquetes
   - Proporciona métricas del proyecto

## 📦 Instalación

### Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Proyecto Java (Maven o Gradle)

### Pasos de Instalación

1. **Clonar o descargar el proyecto**
```bash
cd /ruta/a/tu/proyecto
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Compilar el proyecto**
```bash
npm run build
```

4. **Configurar en Cursor**
   - Abrir Cursor
   - Ir a Settings → Extensions → MCP Servers
   - Agregar nueva configuración:

```json
{
  "mcpServers": {
    "java-project-assistant": {
      "command": "node",
      "args": ["/ruta/completa/al/proyecto/dist/index.js"]
    }
  }
}
```

## 🛠️ Uso

### Ejemplos de Comandos

#### Análisis de Dependencias
```
analyze_dependencies
projectPath: "/ruta/a/mi/proyecto/java"
```

#### Generación de Tests
```
generate_tests
projectPath: "/ruta/a/mi/proyecto/java"
className: "MiClase"
testFramework: "junit5"
```

#### Verificación de Calidad de Código
```
check_code_quality
projectPath: "/ruta/a/mi/proyecto/java"
includeMetrics: true
```

#### Generación de Documentación
```
generate_documentation
projectPath: "/ruta/a/mi/proyecto/java"
documentationType: "all"
```

#### Análisis de Estructura del Proyecto
```
analyze_project_structure
projectPath: "/ruta/a/mi/proyecto/java"
includeArchitecture: true
```

## 🎯 Casos de Uso

### Para Desarrolladores Java

1. **Auditoría de Proyecto**
   - Analizar la calidad general del código
   - Identificar dependencias problemáticas
   - Evaluar la arquitectura del proyecto

2. **Preparación de Tests**
   - Generar templates de tests para clases existentes
   - Identificar clases sin cobertura de tests
   - Sugerir casos de prueba específicos

3. **Mejora de Documentación**
   - Generar documentación automática
   - Identificar código sin Javadoc
   - Crear guías de API

4. **Refactoring Asistido**
   - Detectar code smells
   - Sugerir mejoras de estructura
   - Optimizar organización de paquetes

### Para Arquitectos de Software

1. **Análisis Arquitectónico**
   - Evaluar patrones de diseño utilizados
   - Analizar acoplamiento entre componentes
   - Sugerir mejoras estructurales

2. **Métricas de Proyecto**
   - Obtener estadísticas detalladas
   - Monitorear complejidad del código
   - Identificar áreas de mejora

## 🔧 Desarrollo

### Estructura del Proyecto

```
src/
├── index.ts                    # Punto de entrada del servidor MCP
├── tools/
│   ├── JavaProjectAssistant.ts # Clase base para herramientas
│   ├── DependencyAnalyzer.ts   # Análisis de dependencias
│   ├── TestGenerator.ts        # Generación de tests
│   ├── CodeQualityChecker.ts   # Verificación de calidad
│   ├── DocumentationGenerator.ts # Generación de documentación
│   └── ProjectStructureAnalyzer.ts # Análisis de estructura
```

### Agregar Nuevas Herramientas

1. Crear nueva clase extendiendo `JavaProjectAssistant`
2. Implementar métodos requeridos:
   - `getName()` - Nombre de la herramienta
   - `getDescription()` - Descripción de funcionalidad
   - `getInputSchema()` - Esquema de entrada JSON
   - `execute()` - Lógica principal

3. Registrar en `src/index.ts`

### Compilación y Testing

```bash
# Desarrollo con watch mode
npm run dev

# Compilación de producción
npm run build

# Ejecutar servidor
npm start
```

## 📋 Parámetros de Configuración

### Variables de Entorno

- `JAVA_HOME` - Ruta al JDK (opcional)
- `MCP_LOG_LEVEL` - Nivel de logging (debug, info, warn, error)

### Configuración Avanzada

El servidor puede configurarse para:
- Excluir directorios específicos del análisis
- Personalizar métricas de calidad
- Configurar patrones de detección de code smells

## 🤝 Contribución

1. Fork del repositorio
2. Crear rama de feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

MIT License - ver archivo LICENSE para detalles.

## 🆘 Soporte

Para reportar bugs o solicitar funcionalidades:
- Crear issue en GitHub
- Incluir información del sistema y logs
- Proporcionar ejemplo de código si es aplicable

## 🔄 Changelog

### v1.0.0
- Análisis de dependencias Maven/Gradle
- Generación de tests unitarios
- Verificación de calidad de código
- Generación de documentación
- Análisis de estructura de proyecto

---

**¡Disfruta desarrollando con Java y MCP! 🚀**
