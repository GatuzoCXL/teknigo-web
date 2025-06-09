# Locust - Pruebas de Estrés para Teknigo

# Instalación
# pip install locust

from locust import HttpUser, task, between
import random
import json
from datetime import datetime

class TeknigoUser(HttpUser):
    wait_time = between(1, 3)  # Tiempo de espera entre requests
    
    def on_start(self):
        """Ejecuta al inicio de cada usuario virtual"""
        # Simular login
        self.login()
        
    def login(self):
        """Simula el proceso de login"""
        # En una app real de Firebase, esto sería diferente
        # Aquí simulamos las llamadas que hace tu app
        login_data = {
            "email": f"user_{random.randint(1, 1000)}@test.com",
            "password": "password123"
        }
        
        with self.client.post(
            "/api/auth/login", 
            json=login_data,
            catch_response=True
        ) as response:
            if response.status_code == 200:
                response.success()
            else:
                response.failure("Login failed")
    
    @task(3)
    def view_dashboard(self):
        """Simula visitar el dashboard - tarea más común"""
        self.client.get("/dashboard")
    
    @task(2)
    def view_services(self):
        """Simula ver lista de servicios"""
        self.client.get("/services")
    
    @task(2)
    def view_technicians(self):
        """Simula ver lista de técnicos"""
        self.client.get("/technicians")
    
    @task(1)
    def create_service_request(self):
        """Simula crear una solicitud de servicio"""
        service_data = {
            "serviceType": random.choice([
                "Electricidad", "Plomería", "Carpintería", 
                "Pintura", "Jardinería"
            ]),
            "description": "Necesito ayuda con...",
            "location": "Zona Centro",
            "urgent": random.choice([True, False]),
            "budget": random.randint(50, 500)
        }
        
        with self.client.post(
            "/api/services/request",
            json=service_data,
            catch_response=True
        ) as response:
            if response.status_code in [200, 201]:
                response.success()
            else:
                response.failure("Service creation failed")
    
    @task(1)
    def search_technicians(self):
        """Simula búsqueda de técnicos"""
        search_params = {
            "specialty": random.choice([
                "Electricidad", "Plomería", "Carpintería"
            ]),
            "area": random.choice(["Centro", "Norte", "Sur"])
        }
        
        self.client.get("/api/technicians/search", params=search_params)
    
    @task(1)
    def view_profile(self):
        """Simula ver perfil de usuario"""
        self.client.get("/profile")

class AdminUser(HttpUser):
    wait_time = between(2, 5)
    weight = 1  # Menos usuarios admin que usuarios normales
    
    def on_start(self):
        """Login como admin"""
        admin_data = {
            "email": "admin@teknigo.com",
            "password": "adminpass123"
        }
        self.client.post("/api/auth/login", json=admin_data)
    
    @task(2)
    def view_admin_dashboard(self):
        """Ver dashboard de administración"""
        self.client.get("/admin")
    
    @task(2)
    def view_admin_services(self):
        """Ver servicios en admin"""
        self.client.get("/admin/services")
    
    @task(1)
    def view_admin_users(self):
        """Ver usuarios en admin"""
        self.client.get("/admin/users")
    
    @task(1)
    def view_admin_stats(self):
        """Ver estadísticas"""
        self.client.get("/admin/stats")

class TechnicianUser(HttpUser):
    wait_time = between(1, 4)
    weight = 2  # Proporción media de técnicos
    
    def on_start(self):
        """Login como técnico"""
        tech_data = {
            "email": f"tech_{random.randint(1, 100)}@teknigo.com",
            "password": "techpass123"
        }
        self.client.post("/api/auth/login", json=tech_data)
    
    @task(3)
    def view_technician_requests(self):
        """Ver solicitudes de servicio"""
        self.client.get("/technician/requests")
    
    @task(2)
    def view_technician_profile(self):
        """Ver/editar perfil de técnico"""
        self.client.get("/technician/profile")
    
    @task(1)
    def accept_service_request(self):
        """Aceptar una solicitud de servicio"""
        request_id = f"req_{random.randint(1, 1000)}"
        self.client.post(f"/api/services/{request_id}/accept")

# Configuración para diferentes escenarios
class StressTestUser(TeknigoUser):
    """Usuario para pruebas de estrés intensivas"""
    wait_time = between(0.5, 1)  # Menos tiempo de espera
    
class LoadTestUser(TeknigoUser):
    """Usuario para pruebas de carga normal"""
    wait_time = between(2, 5)  # Tiempo normal

# Comando para ejecutar:
# locust -f locustfile.py --host=http://localhost:3000
