#!/usr/bin/env python3
"""
Generador de Datos para Pruebas de Estrés - Teknigo
Crea datos de prueba masivos para simular carga en Firebase
"""

import os
import json
import time
import random
from datetime import datetime, timedelta
from faker import Faker
import firebase_admin
from firebase_admin import credentials, firestore
from concurrent.futures import ThreadPoolExecutor, as_completed
import threading
from dotenv import load_dotenv

# Configurar Faker en español
fake = Faker('es_ES')

class DatabaseLoader:
    def __init__(self, credentials_path=None):
        """Inicializar conexión a Firebase"""
        self.db = None
        self.lock = threading.Lock()
        self.stats = {
            'users_created': 0,
            'services_created': 0,
            'reviews_created': 0,
            'errors': 0
        }
          # Cargar variables de entorno
        load_dotenv(os.path.join(os.path.dirname(__file__), '../../.env.local'))
        
        # Inicializar Firebase Admin
        try:
            # Definir ruta de credenciales
            if credentials_path:
                creds_path = credentials_path
            else:
                creds_path = os.path.join(
                    os.path.dirname(__file__), 
                    '../credentials/teknigo-6e905-firebase-adminsdk-fbsvc-0bf61cb680.json'
                )
            
            # Verificar que el archivo de credenciales existe
            if not os.path.exists(creds_path):
                raise FileNotFoundError(f"No se encontró el archivo de credenciales: {creds_path}")
            
            # Inicializar Firebase Admin con credenciales reales
            if not firebase_admin._apps:
                cred = credentials.Certificate(creds_path)
                firebase_admin.initialize_app(cred)
                print(f"🔑 Credenciales cargadas desde: {creds_path}")
            
            self.db = firestore.client()
            print("✅ Conexión a Firebase establecida con credenciales de servicio")
        except Exception as e:
            print(f"❌ Error conectando a Firebase: {e}")
            print("💡 Tip: Para pruebas de desarrollo, puedes usar el emulador de Firebase")
            print("   o configurar credenciales de servicio en Firebase Console")
            raise

    def generate_user_data(self, user_type='client'):
        """Generar datos de usuario aleatorios"""
        user_data = {
            'displayName': fake.name(),
            'email': fake.email(),
            'userType': user_type,
            'phone': fake.phone_number(),
            'address': fake.address(),
            'city': fake.city(),
            'createdAt': firestore.SERVER_TIMESTAMP,
            'lastLoginAt': firestore.SERVER_TIMESTAMP,
            'isActive': True,
            'profileComplete': random.choice([True, False])
        }
        
        # Datos específicos por tipo de usuario
        if user_type == 'technician':
            user_data.update({
                'specialties': random.sample([
                    'Electricidad', 'Plomería', 'Carpintería', 
                    'Pintura', 'Jardinería', 'Cerrajería',
                    'Limpieza', 'Computación', 'Electrodomésticos'
                ], random.randint(1, 3)),
                'serviceAreas': random.sample([
                    'Centro', 'Norte', 'Sur', 'Este', 'Oeste'
                ], random.randint(1, 2)),
                'hourlyRate': random.randint(50, 200),
                'experience': random.randint(1, 15),
                'rating': round(random.uniform(3.0, 5.0), 1),
                'totalServices': random.randint(0, 100),
                'availability': random.choice(['available', 'busy', 'offline'])
            })
        
        return user_data

    def generate_service_data(self, client_id, technician_id=None):
        """Generar datos de servicio aleatorios"""
        service_types = [
            'Electricidad', 'Plomería', 'Carpintería', 
            'Pintura', 'Jardinería', 'Cerrajería',
            'Limpieza', 'Computación', 'Electrodomésticos'
        ]
        
        statuses = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled']
        
        service_data = {
            'clientId': client_id,
            'serviceType': random.choice(service_types),
            'description': fake.text(max_nb_chars=200),
            'location': fake.address(),
            'serviceArea': random.choice(['Centro', 'Norte', 'Sur', 'Este', 'Oeste']),
            'urgent': random.choice([True, False]),
            'budget': random.randint(50, 1000),
            'status': random.choice(statuses),
            'createdAt': firestore.SERVER_TIMESTAMP,
            'updatedAt': firestore.SERVER_TIMESTAMP
        }
        
        if technician_id:
            service_data['technicianId'] = technician_id
            service_data['acceptedAt'] = firestore.SERVER_TIMESTAMP
        
        return service_data

    def generate_review_data(self, service_id, client_id, technician_id):
        """Generar datos de reseña aleatorios"""
        return {
            'serviceId': service_id,
            'clientId': client_id,
            'technicianId': technician_id,
            'rating': random.randint(3, 5),
            'comment': fake.text(max_nb_chars=150),
            'createdAt': firestore.SERVER_TIMESTAMP
        }

    def create_user_batch(self, user_type, count):
        """Crear lote de usuarios"""
        batch = self.db.batch()
        created_users = []
        
        try:
            for i in range(count):
                user_ref = self.db.collection('users').document()
                user_data = self.generate_user_data(user_type)
                batch.set(user_ref, user_data)
                created_users.append(user_ref.id)
            
            batch.commit()
            
            with self.lock:
                self.stats['users_created'] += count
            
            return created_users
        except Exception as e:
            with self.lock:
                self.stats['errors'] += 1
            print(f"❌ Error creando lote de usuarios: {e}")
            return []

    def create_service_batch(self, client_ids, technician_ids, count):
        """Crear lote de servicios"""
        batch = self.db.batch()
        created_services = []
        
        try:
            for i in range(count):
                service_ref = self.db.collection('services').document()
                client_id = random.choice(client_ids)
                technician_id = random.choice(technician_ids) if random.random() > 0.3 else None
                
                service_data = self.generate_service_data(client_id, technician_id)
                batch.set(service_ref, service_data)
                created_services.append(service_ref.id)
            
            batch.commit()
            
            with self.lock:
                self.stats['services_created'] += count
                
            return created_services
        except Exception as e:
            with self.lock:
                self.stats['errors'] += 1
            print(f"❌ Error creando lote de servicios: {e}")
            return []

    def load_data_parallel(self, users_per_batch=50, services_per_batch=30, total_users=1000, total_services=500):
        """Cargar datos en paralelo"""
        print(f"🚀 Iniciando carga masiva de datos...")
        print(f"👥 Usuarios a crear: {total_users}")
        print(f"🔧 Servicios a crear: {total_services}")
        
        start_time = time.time()
        
        # Crear usuarios en paralelo
        with ThreadPoolExecutor(max_workers=5) as executor:
            # 70% clientes, 30% técnicos
            client_batches = total_users * 7 // 10 // users_per_batch
            tech_batches = total_users * 3 // 10 // users_per_batch
            
            futures = []
            
            # Crear lotes de clientes
            for i in range(client_batches):
                future = executor.submit(self.create_user_batch, 'client', users_per_batch)
                futures.append(('client', future))
            
            # Crear lotes de técnicos
            for i in range(tech_batches):
                future = executor.submit(self.create_user_batch, 'technician', users_per_batch)
                futures.append(('technician', future))
            
            # Recopilar IDs de usuarios creados
            client_ids = []
            technician_ids = []
            
            for user_type, future in futures:
                try:
                    user_ids = future.result(timeout=30)
                    if user_type == 'client':
                        client_ids.extend(user_ids)
                    else:
                        technician_ids.extend(user_ids)
                    print(f"✅ Lote de {user_type}s creado: {len(user_ids)} usuarios")
                except Exception as e:
                    print(f"❌ Error en lote de {user_type}s: {e}")
        
        # Crear servicios después de tener usuarios
        if client_ids and technician_ids:
            print("🔧 Creando servicios...")
            service_batches = total_services // services_per_batch
            
            with ThreadPoolExecutor(max_workers=3) as executor:
                service_futures = []
                
                for i in range(service_batches):
                    future = executor.submit(
                        self.create_service_batch, 
                        client_ids, 
                        technician_ids, 
                        services_per_batch
                    )
                    service_futures.append(future)
                
                for future in as_completed(service_futures):
                    try:
                        service_ids = future.result(timeout=30)
                        print(f"✅ Lote de servicios creado: {len(service_ids)} servicios")
                    except Exception as e:
                        print(f"❌ Error en lote de servicios: {e}")
        
        end_time = time.time()
        
        # Mostrar estadísticas
        print("\n" + "="*50)
        print("📊 RESUMEN DE CARGA DE DATOS")
        print("="*50)
        print(f"👥 Usuarios creados: {self.stats['users_created']}")
        print(f"🔧 Servicios creados: {self.stats['services_created']}")
        print(f"❌ Errores: {self.stats['errors']}")
        print(f"⏱️  Tiempo total: {end_time - start_time:.2f} segundos")
        print(f"📈 Velocidad: {(self.stats['users_created'] + self.stats['services_created']) / (end_time - start_time):.2f} docs/segundo")

def main():
    """Función principal"""
    print("🔥 GENERADOR DE DATOS PARA PRUEBAS DE ESTRÉS")
    print("="*50)
    
    # Configuración
    config = {
        'total_users': 500,      # Total de usuarios a crear
        'total_services': 300,   # Total de servicios a crear
        'users_per_batch': 25,   # Usuarios por lote
        'services_per_batch': 15 # Servicios por lote
    }
    
    try:
        # Inicializar generador
        loader = DatabaseLoader()
        
        # Cargar datos
        loader.load_data_parallel(
            users_per_batch=config['users_per_batch'],
            services_per_batch=config['services_per_batch'],
            total_users=config['total_users'],
            total_services=config['total_services']
        )
        
        print("\n✅ Carga de datos completada exitosamente!")
        
    except Exception as e:
        print(f"\n❌ Error durante la carga: {e}")

if __name__ == "__main__":
    main()
