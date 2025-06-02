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

## 🧪 Testing

El proyecto incluye una suite completa de testing automatizado:

```bash
# Ejecutar suite completa de testing
cd testing
python scripts/comprehensive_test_runner.py

# Tests individuales
python selenium/web_tests_edge_fixed.py    # UI Testing
python security/security_tests.py          # Security Testing
npm test                                    # Unit Testing

# Testing de carga
locust -f locust/load_test_simple.py --host=http://localhost:3000 -u 15 -t 45s --headless
```

### Herramientas de Testing
- **Selenium**: Testing automatizado de interfaz
- **Locust**: Testing de carga y rendimiento
- **Security Tests**: Validación de vulnerabilidades
- **Jest**: Testing unitario de funciones
- **API Tests**: Validación de endpoints
