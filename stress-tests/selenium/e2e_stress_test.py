#!/usr/bin/env python3
"""
Pruebas E2E con Selenium para Teknigo
Automatiza flujos de usuario completos
"""

import time
import random
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.edge.service import Service
from webdriver_manager.microsoft import EdgeChromiumDriverManager
from selenium.common.exceptions import TimeoutException, NoSuchElementException
import unittest
from concurrent.futures import ThreadPoolExecutor
import threading

class TeknigoE2ETest:
    def __init__(self, base_url="http://localhost:3000", headless=True):
        self.base_url = base_url
        self.headless = headless
        self.results = []
        self.lock = threading.Lock()
    def create_driver(self):
        """Crear instancia de Edge driver"""
        options = webdriver.EdgeOptions()
        
        if self.headless:
            options.add_argument('--headless')
        
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-gpu')
        options.add_argument('--window-size=1920,1080')
        
        service = Service(EdgeChromiumDriverManager().install())
        return webdriver.Edge(service=service, options=options)

    def test_page_load(self, driver, test_id):
        """Prueba básica - verificar que la página carga"""
        start_time = time.time()
        result = {'test_id': test_id, 'test_type': 'page_load', 'success': False, 'error': None}
        
        try:
            # Navegar a la página principal
            driver.get(self.base_url)
            
            # Esperar a que la página cargue completamente
            WebDriverWait(driver, 10).until(
                lambda d: d.execute_script("return document.readyState") == "complete"
            )
            
            # Verificar que el título no esté vacío
            title = driver.title
            if title and len(title) > 0:
                result['success'] = True
                result['page_title'] = title
            else:
                result['error'] = "Página sin título"
                
            result['response_time'] = time.time() - start_time
            
        except TimeoutException as e:
            result['error'] = f"Timeout loading page: {str(e)}"
            result['response_time'] = time.time() - start_time
        except Exception as e:
            result['error'] = f"Error loading page: {str(e)}"
            result['response_time'] = time.time() - start_time
        
        with self.lock:
            self.results.append(result)
        
        return result

    def test_login_flow(self, driver, test_id):
        """Probar flujo completo de login"""
        start_time = time.time()
        result = {'test_id': test_id, 'test_type': 'login', 'success': False, 'error': None}
        
        try:
            # Navegar a login
            driver.get(f"{self.base_url}/login")
            
            # Esperar a que cargue la página - probar múltiples selectores
            email_field = None
            password_field = None
            
            # Intentar diferentes selectores para email
            email_selectors = [
                (By.NAME, "email"),
                (By.ID, "email"),
                (By.XPATH, "//input[@type='email']"),
                (By.XPATH, "//input[contains(@placeholder, 'email')]"),
                (By.XPATH, "//input[contains(@placeholder, 'Email')]"),
                (By.XPATH, "//input[contains(@placeholder, 'correo')]")
            ]
            
            for selector_type, selector_value in email_selectors:
                try:
                    WebDriverWait(driver, 5).until(
                        EC.presence_of_element_located((selector_type, selector_value))
                    )
                    email_field = driver.find_element(selector_type, selector_value)
                    break
                except:
                    continue
            
            if not email_field:
                raise Exception("No se encontró campo de email")
            
            # Intentar diferentes selectores para password
            password_selectors = [
                (By.NAME, "password"),
                (By.ID, "password"),
                (By.XPATH, "//input[@type='password']"),
                (By.XPATH, "//input[contains(@placeholder, 'password')]"),
                (By.XPATH, "//input[contains(@placeholder, 'Password')]"),
                (By.XPATH, "//input[contains(@placeholder, 'contraseña')]")
            ]
            
            for selector_type, selector_value in password_selectors:
                try:
                    password_field = driver.find_element(selector_type, selector_value)
                    break
                except:
                    continue
            
            if not password_field:
                raise Exception("No se encontró campo de contraseña")
            
            # Llenar formulario
            email_field.clear()
            email_field.send_keys("test@example.com")
            password_field.clear()
            password_field.send_keys("password123")
            
            # Buscar botón de login con múltiples selectores
            login_button = None
            login_selectors = [
                (By.XPATH, "//button[contains(text(), 'Iniciar sesión')]"),
                (By.XPATH, "//button[contains(text(), 'Login')]"),
                (By.XPATH, "//button[contains(text(), 'Ingresar')]"),
                (By.XPATH, "//button[@type='submit']"),
                (By.XPATH, "//input[@type='submit']"),
                (By.XPATH, "//button[contains(@class, 'login')]"),
                (By.XPATH, "//button[contains(@class, 'submit')]")
            ]
            
            for selector_type, selector_value in login_selectors:
                try:
                    login_button = driver.find_element(selector_type, selector_value)
                    break
                except:
                    continue
            
            if not login_button:
                raise Exception("No se encontró botón de login")
            
            # Hacer click en login
            login_button.click()
            
            # Esperar redirección (más flexible)
            success_indicators = [
                lambda d: "/dashboard" in d.current_url,
                lambda d: "/profile" in d.current_url,
                lambda d: "/home" in d.current_url,
                lambda d: "dashboard" in d.page_source.lower(),
                lambda d: "bienvenido" in d.page_source.lower(),
                lambda d: "welcome" in d.page_source.lower()
            ]
            
            success = False
            for indicator in success_indicators:
                try:
                    WebDriverWait(driver, 10).until(indicator)
                    success = True
                    break
                except:
                    continue
            
            if success:
                result['success'] = True
                result['response_time'] = time.time() - start_time
            else:
                raise Exception("No se detectó login exitoso")
            
        except TimeoutException as e:
            result['error'] = f"Timeout: {str(e)}"
            result['response_time'] = time.time() - start_time
        except Exception as e:
            result['error'] = f"Error: {str(e)}"
            result['response_time'] = time.time() - start_time
        
        with self.lock:
            self.results.append(result)
        
        return result

    def test_service_request_flow(self, driver, test_id):
        """Probar flujo de solicitud de servicio"""
        start_time = time.time()
        result = {'test_id': test_id, 'test_type': 'service_request', 'success': False, 'error': None}
        
        try:
            # Primero hacer login
            login_result = self.test_login_flow(driver, f"{test_id}_login")
            if not login_result['success']:
                raise Exception("Login failed")
            
            # Navegar a solicitar servicio
            driver.get(f"{self.base_url}/services/request")
            
            # Esperar formulario
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.NAME, "serviceType"))
            )
            
            # Llenar formulario
            service_type = driver.find_element(By.NAME, "serviceType")
            description = driver.find_element(By.NAME, "description")
            location = driver.find_element(By.NAME, "location")
            
            # Seleccionar tipo de servicio (asumiendo que es un select)
            service_type.click()
            time.sleep(1)
            service_options = driver.find_elements(By.TAG_NAME, "option")
            if service_options:
                random.choice(service_options).click()
            
            description.send_keys("Prueba de estrés - Necesito ayuda con...")
            location.send_keys("Dirección de prueba 123")
            
            # Enviar formulario
            submit_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Enviar')]")
            submit_button.click()
            
            # Esperar confirmación o redirección
            WebDriverWait(driver, 15).until(
                lambda d: "éxito" in d.page_source.lower() or "/dashboard" in d.current_url
            )
            
            result['success'] = True
            result['response_time'] = time.time() - start_time
            
        except Exception as e:
            result['error'] = f"Error: {str(e)}"
            result['response_time'] = time.time() - start_time
        
        with self.lock:
            self.results.append(result)
        
        return result

    def test_technician_search(self, driver, test_id):
        """Probar búsqueda de técnicos"""
        start_time = time.time()
        result = {'test_id': test_id, 'test_type': 'technician_search', 'success': False, 'error': None}
        
        try:
            # Login primero
            login_result = self.test_login_flow(driver, f"{test_id}_login")
            if not login_result['success']:
                raise Exception("Login failed")
            
            # Navegar a técnicos
            driver.get(f"{self.base_url}/technicians")
            
            # Esperar que cargue la lista
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "technician-card"))
            )
            
            # Usar filtros si están disponibles
            try:
                filter_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Filtro')]")
                filter_button.click()
                time.sleep(2)
            except NoSuchElementException:
                pass  # No hay filtros disponibles
            
            # Verificar que hay técnicos listados
            technician_cards = driver.find_elements(By.CLASS_NAME, "technician-card")
            if len(technician_cards) > 0:
                result['success'] = True
            else:
                result['error'] = "No technicians found"
            
            result['response_time'] = time.time() - start_time
            
        except Exception as e:
            result['error'] = f"Error: {str(e)}"
            result['response_time'] = time.time() - start_time
        
        with self.lock:
            self.results.append(result)
        
        return result

    def run_concurrent_tests(self, concurrent_users=5, test_duration=60):
        """Ejecutar pruebas concurrentes"""
        print(f"🚀 Iniciando pruebas E2E concurrentes")
        print(f"👥 Usuarios simultáneos: {concurrent_users}")
        print(f"⏱️  Duración: {test_duration} segundos")
        
        end_time = time.time() + test_duration
        
        def user_session(user_id):
            """Sesión de usuario individual"""
            driver = self.create_driver()
            test_count = 0
            
            try:
                while time.time() < end_time:
                    test_count += 1
                    test_id = f"user_{user_id}_test_{test_count}"
                      # Solo probar page_load por ahora para debug
                    self.test_page_load(driver, test_id)
                    
                    # Pausa entre pruebas
                    time.sleep(random.uniform(2, 5))
                    
            finally:
                driver.quit()
        
        # Ejecutar sesiones en paralelo
        with ThreadPoolExecutor(max_workers=concurrent_users) as executor:
            futures = []
            for i in range(concurrent_users):
                future = executor.submit(user_session, i + 1)
                futures.append(future)
            
            # Esperar a que terminen todas las sesiones
            for future in futures:
                future.result()
        
        self.print_results()

    def print_results(self):
        """Mostrar resultados de las pruebas"""
        if not self.results:
            print("❌ No hay resultados para mostrar")
            return
        
        print("\n" + "="*60)
        print("📊 RESULTADOS DE PRUEBAS E2E")
        print("="*60)
        
        # Estadísticas generales
        total_tests = len(self.results)
        successful_tests = len([r for r in self.results if r['success']])
        failed_tests = total_tests - successful_tests
        
        print(f"Total de pruebas: {total_tests}")
        print(f"✅ Exitosas: {successful_tests}")
        print(f"❌ Fallidas: {failed_tests}")
        print(f"📈 Tasa de éxito: {(successful_tests/total_tests)*100:.2f}%")
        
        # Estadísticas por tipo de prueba
        test_types = {}
        for result in self.results:
            test_type = result['test_type']
            if test_type not in test_types:
                test_types[test_type] = {'total': 0, 'successful': 0, 'times': []}
            
            test_types[test_type]['total'] += 1
            if result['success']:
                test_types[test_type]['successful'] += 1
            
            if 'response_time' in result:
                test_types[test_type]['times'].append(result['response_time'])
        
        print(f"\n📊 Estadísticas por tipo de prueba:")
        for test_type, stats in test_types.items():
            success_rate = (stats['successful']/stats['total'])*100
            avg_time = sum(stats['times'])/len(stats['times']) if stats['times'] else 0
            
            print(f"  {test_type}:")
            print(f"    Tasa de éxito: {success_rate:.2f}%")
            print(f"    Tiempo promedio: {avg_time:.2f}s")
        
        # Mostrar errores más comunes
        errors = [r['error'] for r in self.results if r['error']]
        if errors:
            print(f"\n🚨 Errores más comunes:")
            error_counts = {}
            for error in errors:
                error_counts[error] = error_counts.get(error, 0) + 1
            
            for error, count in sorted(error_counts.items(), key=lambda x: x[1], reverse=True)[:5]:
                print(f"  {error}: {count} veces")

def main():
    """Función principal"""
    print("🔍 PRUEBAS E2E CON SELENIUM - TEKNIGO")
    print("="*50)
      # Configuración
    config = {
        'base_url': 'http://localhost:3000',
        'concurrent_users': 1,  # Empezar con 1 usuario para debug
        'test_duration': 30,    # 30 segundos para prueba rápida
        'headless': False       # Cambiar a False para ver el navegador
    }
    
    # Crear instancia de pruebas
    e2e_test = TeknigoE2ETest(
        base_url=config['base_url'],
        headless=config['headless']
    )
    
    # Ejecutar pruebas
    e2e_test.run_concurrent_tests(
        concurrent_users=config['concurrent_users'],
        test_duration=config['test_duration']
    )

if __name__ == "__main__":
    main()
