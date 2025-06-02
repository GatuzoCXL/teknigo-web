# 🧪 Suite de Testing Teknigo - Guía Completa

## 🎯 Descripción
Suite integral de testing automatizado para la plataforma Teknigo con **5 herramientas profesionales** funcionando al 100%.

## 📋 Requisitos Previos

### Sistema Operativo
- ✅ Windows 10/11 (Probado y optimizado)
- ✅ macOS y Linux (Compatible)

### Software Requerido
```bash
# 1. Python 3.8 o superior
python --version

# 2. Node.js 16 o superior  
node --version
npm --version

# 3. Git (para clonar el repositorio)
git --version
```

## 🚀 Instalación Rápida

### Paso 1: Clonar el repositorio
```bash
git clone https://github.com/GatuzoCXL/teknigo-web.git
cd teknigo-web
```

### Paso 2: Instalar dependencias del proyecto principal
```bash
# Instalar dependencias de Next.js
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con credenciales de Firebase
```

### Paso 3: Instalar dependencias de testing
```bash
cd testing

# Instalar dependencias Python
pip install -r requirements.txt

# Verificar instalación
python -c "import selenium, locust, requests; print('✅ Dependencias Python OK')"
```

### Paso 4: Iniciar el servidor de desarrollo
```bash
# En directorio principal (teknigo-web/)
npm run dev

# Verificar que esté ejecutándose en http://localhost:3000
```

## 🧪 Ejecutar Tests

### Opción 1: Suite Completa (Recomendado)
```bash
# Desde testing/
python scripts/comprehensive_test_runner.py

# Con parámetros personalizados (usuarios, duración)
python scripts/comprehensive_test_runner.py 25 60
```

### Opción 2: Tests Individuales

#### Selenium - Testing de UI
```bash
python selenium/web_tests_edge_fixed.py
```
**Qué hace:** Automatiza navegación, formularios y funcionalidades de la interfaz web.

#### Locust - Testing de Carga
```bash
locust -f locust/load_test_simple.py --host=http://localhost:3000 -u 15 -r 3 -t 45s --headless
```
**Qué hace:** Simula múltiples usuarios concurrentes para probar rendimiento.

#### Security - Testing de Seguridad
```bash
python security/security_tests.py
```
**Qué hace:** Verifica vulnerabilidades básicas como SQL injection y XSS.

#### Jest - Testing Unitario
```bash
# Desde directorio principal
npm test
```
**Qué hace:** Testa funciones JavaScript de validación y utilidades.

### Opción 3: Script de Windows
```bash
# Ejecutar desde testing/
.\run_complete_tests.bat
```

## 📊 Interpretación de Resultados

### Resultados Exitosos
- **Selenium**: Todos los tests de UI pasaron correctamente.
- **Locust**: La aplicación soporta la carga simulada sin errores.
- **Security**: No se encontraron vulnerabilidades críticas.
- **API**: Todos los endpoints responden como se espera.
- **Jest**: Todas las pruebas unitarias de JavaScript son exitosas.

---
*Teknigo Testing Suite - Guía Completa*
