#!/usr/bin/env python3
"""
Simulador de Carga de Datos - Teknigo
Simula pruebas de estrés sin necesidad de Firebase Admin SDK
"""

import time
import random
from faker import Faker
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
import requests
import json

# Configurar Faker en español
fake = Faker('es_ES')

class DataLoadSimulator:
    def __init__(self):
        """Inicializar simulador"""
        self.lock = threading.Lock()
        self.stats = {
            'operations_simulated': 0,
            'errors': 0,
            'total_time': 0
        }
        print("✅ Simulador de carga inicializado")

    def simulate_user_creation(self, count):
        """Simular creación de usuarios"""
        start_time = time.time()
        
        try:
            for i in range(count):
                # Simular tiempo de creación de usuario
                time.sleep(random.uniform(0.1, 0.3))
                
                # Generar datos de usuario
                user_data = {
                    'displayName': fake.name(),
                    'email': fake.email(),
                    'userType': random.choice(['client', 'technician']),
                    'phone': fake.phone_number(),
                    'city': fake.city()
                }
                
                with self.lock:
                    self.stats['operations_simulated'] += 1
            
            end_time = time.time()
            return count, end_time - start_time
            
        except Exception as e:
            with self.lock:
                self.stats['errors'] += 1
            return 0, 0

    def simulate_service_creation(self, count):
        """Simular creación de servicios"""
        start_time = time.time()
        
        try:
            for i in range(count):
                # Simular tiempo de creación de servicio
                time.sleep(random.uniform(0.05, 0.2))
                
                # Generar datos de servicio
                service_data = {
                    'serviceType': random.choice([
                        'Electricidad', 'Plomería', 'Carpintería', 
                        'Pintura', 'Jardinería'
                    ]),
                    'description': fake.text(max_nb_chars=100),
                    'budget': random.randint(50, 500),
                    'urgent': random.choice([True, False])
                }
                
                with self.lock:
                    self.stats['operations_simulated'] += 1
            
            end_time = time.time()
            return count, end_time - start_time
            
        except Exception as e:
            with self.lock:
                self.stats['errors'] += 1
            return 0, 0

    def run_load_simulation(self, total_operations=1000, max_workers=10):
        """Ejecutar simulación de carga"""
        print(f"🚀 Iniciando simulación de carga...")
        print(f"📊 Operaciones a simular: {total_operations}")
        print(f"🔧 Workers concurrentes: {max_workers}")
        
        start_time = time.time()
        
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = []
            
            # Dividir operaciones entre usuarios y servicios
            user_ops = total_operations // 2
            service_ops = total_operations // 2
            
            # Crear futures para usuarios
            ops_per_worker = user_ops // max_workers
            for i in range(max_workers):
                future = executor.submit(self.simulate_user_creation, ops_per_worker)
                futures.append(('user', future))
            
            # Crear futures para servicios
            ops_per_worker = service_ops // max_workers
            for i in range(max_workers):
                future = executor.submit(self.simulate_service_creation, ops_per_worker)
                futures.append(('service', future))
            
            # Procesar resultados
            for operation_type, future in futures:
                try:
                    count, duration = future.result(timeout=30)
                    print(f"✅ {operation_type}: {count} operaciones en {duration:.2f}s")
                except Exception as e:
                    print(f"❌ Error en {operation_type}: {e}")
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Mostrar estadísticas
        print("\n" + "="*50)
        print("📊 RESUMEN DE SIMULACIÓN DE CARGA")
        print("="*50)
        print(f"🔢 Operaciones simuladas: {self.stats['operations_simulated']}")
        print(f"❌ Errores: {self.stats['errors']}")
        print(f"⏱️  Tiempo total: {total_time:.2f} segundos")
        print(f"📈 Velocidad: {self.stats['operations_simulated'] / total_time:.2f} ops/segundo")
        print(f"💪 Throughput: {self.stats['operations_simulated'] * 60 / total_time:.0f} ops/minuto")
        
        # Análisis de rendimiento
        if self.stats['operations_simulated'] > 0:
            success_rate = ((self.stats['operations_simulated'] - self.stats['errors']) / self.stats['operations_simulated']) * 100
            print(f"✅ Tasa de éxito: {success_rate:.2f}%")
        
        return self.stats

def main():
    """Función principal"""
    print("🔥 SIMULADOR DE CARGA DE DATOS - TEKNIGO")
    print("="*50)
    
    # Configuración
    config = {
        'total_operations': 500,    # Total de operaciones a simular
        'max_workers': 8,           # Workers concurrentes
    }
    
    try:
        # Inicializar simulador
        simulator = DataLoadSimulator()
        
        # Ejecutar simulación
        results = simulator.run_load_simulation(
            total_operations=config['total_operations'],
            max_workers=config['max_workers']
        )
        
        print("\n✅ Simulación completada exitosamente!")
        print("💡 Esta simulación te da una idea del rendimiento sin usar datos reales")
        
    except Exception as e:
        print(f"\n❌ Error durante la simulación: {e}")

if __name__ == "__main__":
    main()
