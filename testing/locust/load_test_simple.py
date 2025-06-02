# -*- coding: utf-8 -*-
from locust import HttpUser, task, between, events
import random
import time
from datetime import datetime

class TeknigoUser(HttpUser):
    wait_time = between(1, 3)  # Esperar entre 1-3 segundos entre tareas
    
    def on_start(self):
        """Ejecutar al inicio de cada usuario simulado"""
        self.client.verify = False  # Para desarrollo local sin SSL
        self.user_data = {
            "id": random.randint(1000, 9999),
            "session_start": datetime.now().isoformat()
        }
        print(f"Usuario {self.user_data['id']} iniciado")
    
    @task(5)
    def view_homepage(self):
        """Simular visita a pagina principal - Tarea mas comun"""
        with self.client.get("/", 
                           catch_response=True, 
                           name="Homepage") as response:
            if response.status_code == 200:
                if "Teknigo" in response.text:
                    response.success()
                else:
                    response.failure("Homepage no contiene marca Teknigo")
            else:
                response.failure(f"Status code: {response.status_code}")
    
    @task(3)
    def view_register_page(self):
        """Simular acceso a pagina de registro"""
        with self.client.get("/register", 
                           catch_response=True,
                           name="Register Page") as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Status code: {response.status_code}")
    
    @task(3)
    def view_login_page(self):
        """Simular acceso a pagina de login"""
        with self.client.get("/login", 
                           catch_response=True,
                           name="Login Page") as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Status code: {response.status_code}")
    
    @task(2)
    def view_contact_page(self):
        """Simular acceso a pagina de contacto"""
        with self.client.get("/contact", 
                           catch_response=True,
                           name="Contact Page") as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Status code: {response.status_code}")
    
    @task(2)
    def view_about_page(self):
        """Simular acceso a pagina about"""
        with self.client.get("/about", 
                           catch_response=True,
                           name="About Page") as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure(f"Status code: {response.status_code}")
    
    @task(1)
    def stress_test_navigation(self):
        """Test de navegacion rapida entre paginas"""
        pages = ["/", "/register", "/login", "/contact", "/about"]
        
        for page in pages:
            with self.client.get(page, 
                               catch_response=True,
                               name=f"Quick Nav: {page}") as response:
                if response.status_code == 200:
                    response.success()
                else:
                    response.failure(f"Navigation failed to {page}")
                time.sleep(0.3)  # Navegacion rapida
    
    def on_stop(self):
        """Ejecutar al finalizar usuario"""
        duration = datetime.now() - datetime.fromisoformat(self.user_data['session_start'])
        print(f"Usuario {self.user_data['id']} finalizado - Duracion: {duration}")

# Configuracion de eventos para reportes
@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    print("INICIANDO PRUEBAS DE CARGA TEKNIGO")
    print("=" * 50)
    print(f"Target: {environment.host}")
    print(f"Inicio: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)

@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    print("=" * 50)
    print("PRUEBAS DE CARGA COMPLETADAS")
    print(f"Fin: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Obtener estadisticas
    stats = environment.stats.total
    print(f"Requests totales: {stats.num_requests}")
    print(f"Requests fallidos: {stats.num_failures}")
    
    if stats.num_requests > 0:
        success_rate = ((stats.num_requests - stats.num_failures) / stats.num_requests * 100)
        print(f"Tasa de exito: {success_rate:.1f}%")
        print(f"Tiempo promedio: {stats.avg_response_time:.0f}ms")
        print(f"Tiempo maximo: {stats.max_response_time:.0f}ms")
        print(f"RPS promedio: {stats.total_rps:.1f}")
    
    print("=" * 50)

# Configuraciones de prueba recomendadas:
# 
# Prueba básica (10 usuarios, 30 segundos):
# locust -f load_test_simple.py --host=http://localhost:3000 -u 10 -r 2 -t 30s --headless
#
# Prueba media (25 usuarios, 1 minuto):
# locust -f load_test_simple.py --host=http://localhost:3000 -u 25 -r 5 -t 1m --headless
#
# Prueba con reporte HTML:
# locust -f load_test_simple.py --host=http://localhost:3000 -u 15 -r 3 -t 45s --html=../reports/locust_report.html --headless
