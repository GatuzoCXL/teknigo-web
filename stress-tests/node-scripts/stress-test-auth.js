// Stress Test para Autenticación de Firebase
const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const performanceNow = require('performance-now');
const cliProgress = require('cli-progress');
const colors = require('colors');
const path = require('path');

// Cargar variables de entorno desde .env.local
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

// Configuración de Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Verificar que las variables se cargaron correctamente
console.log('🔧 Verificando configuración de Firebase...'.yellow);
console.log(`API Key: ${firebaseConfig.apiKey ? '✅ Cargada' : '❌ Faltante'}`.cyan);
console.log(`Project ID: ${firebaseConfig.projectId ? '✅ Cargada' : '❌ Faltante'}`.cyan);
console.log(`Auth Domain: ${firebaseConfig.authDomain ? '✅ Cargada' : '❌ Faltante'}`.cyan);

// Validar que todas las configuraciones requeridas estén presentes
if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.authDomain) {
  console.error('❌ Error: Faltan variables de entorno de Firebase'.red);
  console.error('Asegúrate de que el archivo .env.local existe y contiene todas las variables NEXT_PUBLIC_FIREBASE_*'.yellow);
  process.exit(1);
}

// Inicializar Firebase
let app, auth;
try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  console.log('✅ Firebase inicializado correctamente\n'.green);
} catch (error) {
  console.error('❌ Error inicializando Firebase:', error.message.red);
  process.exit(1);
}

class AuthStressTest {
  constructor() {
    this.results = {
      totalTests: 0,
      successful: 0,
      failed: 0,
      responseTimes: [],
      errors: []
    };
  }

  // Generar email aleatorio para pruebas
  generateTestEmail() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `test_${timestamp}_${random}@stresstest.com`;
  }

  // Prueba de login
  async testLogin(email, password) {
    const startTime = performanceNow();
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      const endTime = performanceNow();
      const responseTime = endTime - startTime;
      
      this.results.successful++;
      this.results.responseTimes.push(responseTime);
      
      return { success: true, responseTime };
    } catch (error) {
      const endTime = performanceNow();
      const responseTime = endTime - startTime;
      
      this.results.failed++;
      this.results.errors.push({
        error: error.message,
        code: error.code,
        responseTime
      });
      
      return { success: false, responseTime, error: error.message };
    }
  }

  // Prueba de registro
  async testRegister(email, password) {
    const startTime = performanceNow();
    
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      const endTime = performanceNow();
      const responseTime = endTime - startTime;
      
      this.results.successful++;
      this.results.responseTimes.push(responseTime);
      
      return { success: true, responseTime };
    } catch (error) {
      const endTime = performanceNow();
      const responseTime = endTime - startTime;
      
      this.results.failed++;
      this.results.errors.push({
        error: error.message,
        code: error.code,
        responseTime
      });
      
      return { success: false, responseTime, error: error.message };
    }
  }

  // Ejecutar prueba concurrente
  async runConcurrentTest(testType, concurrentUsers, testDuration) {
    console.log(`🚀 Iniciando prueba de ${testType}`.green);
    console.log(`👥 Usuarios concurrentes: ${concurrentUsers}`);
    console.log(`⏱️  Duración: ${testDuration / 1000} segundos\n`);

    const progressBar = new cliProgress.SingleBar({
      format: 'Progreso |' + colors.cyan('{bar}') + '| {percentage}% | {value}/{total} Tests | ETA: {eta}s',
      barCompleteChar: '\u2588',
      barIncompleteChar: '\u2591',
      hideCursor: true
    });

    const startTime = Date.now();
    const promises = [];
    let testCount = 0;

    progressBar.start(100, 0);

    // Crear promesas para usuarios concurrentes
    for (let i = 0; i < concurrentUsers; i++) {
      const promise = this.runUserSession(testType, testDuration, (progress) => {
        progressBar.update(Math.floor((Date.now() - startTime) / testDuration * 100));
      });
      promises.push(promise);
    }

    await Promise.all(promises);
    progressBar.stop();

    this.printResults();
  }

  // Sesión de usuario individual
  async runUserSession(testType, duration, progressCallback) {
    const endTime = Date.now() + duration;
    
    while (Date.now() < endTime) {
      this.results.totalTests++;
      
      if (testType === 'login') {
        // Usar credenciales de prueba existentes
        await this.testLogin('test@example.com', 'password123');
      } else if (testType === 'register') {
        const email = this.generateTestEmail();
        await this.testRegister(email, 'password123');
      }      // Pequeña pausa entre requests (aumentada para evitar rate limiting)
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000));
      
      if (progressCallback) {
        progressCallback();
      }
    }
  }
  // Mostrar resultados
  printResults() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESULTADOS DE LA PRUEBA DE ESTRÉS'.yellow);
    console.log('='.repeat(50));
    
    console.log(`Total de pruebas: ${this.results.totalTests}`);
    console.log(`✅ Exitosas: ${this.results.successful}`.green);
    console.log(`❌ Fallidas: ${this.results.failed}`.red);
    console.log(`📈 Tasa de éxito: ${((this.results.successful / this.results.totalTests) * 100).toFixed(2)}%`);
    
    // Análisis de rate limiting
    const rateLimitErrors = this.results.errors.filter(e => e.code === 'auth/too-many-requests').length;
    const invalidCredErrors = this.results.errors.filter(e => e.code === 'auth/invalid-login-credentials').length;
    
    console.log(`\n🛡️  Análisis de Seguridad:`);
    console.log(`   Rate Limiting activado: ${rateLimitErrors > 0 ? '✅ SÍ' : '❌ NO'}`.cyan);
    console.log(`   Límite alcanzado en: ${rateLimitErrors} requests`);
    console.log(`   Protección contra credenciales inválidas: ${invalidCredErrors > 0 ? '✅ SÍ' : '❌ NO'}`.cyan);
    
    if (this.results.responseTimes.length > 0) {
      const avgResponseTime = this.results.responseTimes.reduce((a, b) => a + b, 0) / this.results.responseTimes.length;
      const minResponseTime = Math.min(...this.results.responseTimes);
      const maxResponseTime = Math.max(...this.results.responseTimes);
      
      console.log(`\n⏱️  Tiempos de Respuesta:`);
      console.log(`   Promedio: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`   Mínimo: ${minResponseTime.toFixed(2)}ms`);
      console.log(`   Máximo: ${maxResponseTime.toFixed(2)}ms`);
    }
    
    if (this.results.errors.length > 0) {
      console.log(`\n🚨 Errores más comunes:`);
      const errorCounts = {};
      this.results.errors.forEach(error => {
        errorCounts[error.code] = (errorCounts[error.code] || 0) + 1;
      });
      
      Object.entries(errorCounts).forEach(([code, count]) => {
        console.log(`   ${code}: ${count} veces`);
      });
      
      console.log(`\n💡 Interpretación:`);
      if (rateLimitErrors > 0) {
        console.log(`   • Firebase Auth está protegido contra ataques de fuerza bruta`.green);
        console.log(`   • Límite de requests por IP/usuario detectado`.yellow);
      }
      if (invalidCredErrors > 0) {
        console.log(`   • Sistema rechaza credenciales inválidas correctamente`.green);
      }
    }
  }
}

// Ejecutar pruebas
async function main() {
  const authTest = new AuthStressTest();
  // Configuración de la prueba
  const config = {
    concurrentUsers: 8,     // Aumentado para prueba más intensa
    testDuration: 30000,    // Duración en millisegundos (30 segundos)
    testType: 'register'    // Registro para crear usuarios únicos
  };
  
  console.log('🔐 PRUEBA DE ESTRÉS - AUTENTICACIÓN FIREBASE'.yellow);
  console.log('=' .repeat(50));
  
  await authTest.runConcurrentTest(
    config.testType,
    config.concurrentUsers,
    config.testDuration
  );
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = AuthStressTest;
