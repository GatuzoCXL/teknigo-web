# 🔧 Teknigo - Plataforma de Servicios Técnicos

## 📋 Descripción
Plataforma web completa para conectar clientes con técnicos especializados, desarrollada con Next.js 13, TypeScript, Firebase y Tailwind CSS.

## 🚀 Características Principales

### Para Clientes
- ✅ Registro y autenticación segura
- ✅ Búsqueda y filtrado de técnicos
- ✅ Solicitud de servicios personalizados
- ✅ Sistema de reseñas y calificaciones
- ✅ Dashboard de seguimiento de servicios

### Para Técnicos  
- ✅ Perfil profesional completo
- ✅ Gestión de solicitudes de servicio
- ✅ Portfolio de habilidades y certificaciones
- ✅ Sistema de calificaciones
- ✅ Dashboard de servicios activos

### Para Administradores
- ✅ Panel de administración completo
- ✅ Gestión de usuarios y técnicos
- ✅ Estadísticas y análisis
- ✅ Moderación de contenido
- ✅ Modo de mantenimiento

## 🛠️ Tecnologías

### Frontend
- **Next.js 13** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Styling utility-first
- **React Hook Form + Yup** - Validación de formularios

### Backend & Database
- **Firebase Authentication** - Sistema de autenticación
- **Firestore** - Base de datos NoSQL
- **Firebase Storage** - Almacenamiento de archivos

### Testing
- **Selenium WebDriver** - Testing de UI automatizado
- **Locust** - Testing de carga y performance
- **Jest** - Testing unitario
- **Security Testing** - Validación de vulnerabilidades

## 📦 Instalación

```bash
# Clonar repositorio
git clone [repository-url]
cd teknigo-web

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Firebase

# Ejecutar en desarrollo
npm run dev
```

## 🔧 Configuración

### Variables de Entorno Requeridas
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
```

## 🧪 Stress Testing Suite

El proyecto incluye una **suite completa de stress testing** para evaluar el rendimiento y límites del sistema bajo diferentes condiciones de carga.

### 📁 Estructura de Testing
```
stress-tests/
├── 📄 GUIA_COMPLETA.md          # Documentación detallada
├── 📄 endpoints-analysis.md     # Análisis de endpoints críticos
├── 🔧 run_tests.ps1            # Script principal Windows (PowerShell)
├── 🔧 run_tests.sh             # Script principal Linux/macOS
├── 🐍 master_stress_test.py    # Coordinador maestro de pruebas
├── 📁 node-scripts/            # Pruebas Firebase con Node.js
├── 📁 python-scripts/          # Carga de datos masiva
├── 📁 locust/                  # Testing de carga HTTP
├── 📁 selenium/                # Testing E2E automatizado
└── 📁 credentials/             # Credenciales Firebase Admin
```

### 🚀 Comandos de Ejecución Manual

#### 1. 🌐 **Selenium (Pruebas E2E)**
```bash
cd stress-tests/selenium
pip install -r requirements.txt
python e2e_stress_test.py
```
- **Qué hace**: Automatiza flujos completos de usuario (navegación, login, formularios)
- **Intensidad**: 🟢 Baja - Ideal para empezar
- **Duración**: 30-60 segundos

#### 2. 🔥 **Node.js (Pruebas Firebase Auth)**
```bash
cd stress-tests/node-scripts
npm install
node stress-test-auth.js
```
- **Qué hace**: Prueba masiva de autenticación Firebase
- **Intensidad**: 🟡 Media - Prueba backend
- **Duración**: 30-60 segundos

#### 3. 🐍 **Python (Carga de Datos Masiva)**
```bash
cd stress-tests/python-scripts
pip install -r requirements-simple.txt
python database_loader.py
```
- **Qué hace**: Genera y carga datos masivos en Firebase
- **Intensidad**: 🟡 Media - Llena la base de datos
- **Duración**: 2-5 minutos

#### 4. 🦗 **Locust (Pruebas de Carga Web)**
```bash
cd stress-tests
pip install locust
locust -f locust/locustfile.py --host=http://localhost:3000
```
- **Interfaz Web**: Abrir http://localhost:8089 en el navegador
- **Qué hace**: Simula múltiples usuarios concurrentes
- **Intensidad**: 🔴 Alta - Prueba límites del sistema
- **Configuración recomendada**: 10-50 usuarios, 60-300 segundos

### ⚙️ Scripts Automatizados

#### **Windows (PowerShell)**
```powershell
cd stress-tests
.\run_tests.ps1
```

#### **Linux/macOS**
```bash
cd stress-tests
chmod +x run_tests.sh
./run_tests.sh
```

### 💡 **Recomendaciones de Uso**

#### **Antes de Ejecutar:**
1. ✅ **Aplicación corriendo**: Asegúrate que tu app esté en `http://localhost:3000`
2. ✅ **Variables de entorno**: Configura `.env.local` con credenciales Firebase
3. ✅ **Recursos del sistema**: Cierra aplicaciones innecesarias
4. ✅ **Backup de datos**: Respalda datos importantes antes de pruebas intensivas

#### **Orden Recomendado de Ejecución:**
1. 🟢 **Selenium** (pruebas suaves para verificar funcionamiento)
2. 🟡 **Node.js Firebase** (pruebas de autenticación)
3. 🟡 **Python Database** (carga de datos de prueba)
4. 🔴 **Locust** (pruebas intensivas al final)

#### **Monitoreo Durante las Pruebas:**
- 📊 **Task Manager** (Windows) / **Activity Monitor** (macOS) para ver uso de CPU/RAM
- 🔥 **Firebase Console** para ver actividad en tiempo real
- 🌐 **Network tab** en DevTools del navegador
- 📈 **Locust Web UI** para métricas detalladas

### 🎯 **Objetivos de las Pruebas**

- **Detectar límites de rendimiento** del sistema
- **Identificar cuellos de botella** en Firebase y Next.js
- **Validar comportamiento** bajo carga concurrente
- **Optimizar configuraciones** de rate limiting
- **Generar reportes** para análisis de capacidad

### ⚠️ **Advertencias Importantes**

- 🚨 **Firebase Quotas**: Las pruebas intensivas pueden consumir cuotas gratuitas
- 🔒 **Rate Limiting**: Firebase tiene protecciones automáticas contra abuso
- 💻 **Recursos locales**: Monitorea CPU/RAM durante pruebas intensivas
- 🌐 **Red**: Pruebas pueden generar tráfico considerable
- **API Tests**: Validación de endpoints
