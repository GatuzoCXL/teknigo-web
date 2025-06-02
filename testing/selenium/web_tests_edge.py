from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.edge.service import Service
from webdriver_manager.microsoft import EdgeChromiumDriverManager
import time
import json
import os
from datetime import datetime

class TeknigoEdgeTests:
    def __init__(self):
        # Configurar Edge
        edge_options = webdriver.EdgeOptions()
        edge_options.add_argument("--no-sandbox")
        edge_options.add_argument("--disable-dev-shm-usage")
        # edge_options.add_argument("--headless")  # Comentado para ver la ejecución
        
        # Usar WebDriver Manager para Edge
        service = Service(EdgeChromiumDriverManager().install())
        self.driver = webdriver.Edge(service=service, options=edge_options)
        
        self.base_url = "http://localhost:3000"
        self.results = []
        self.start_time = datetime.now()
        
        # Crear directorio de reports
        os.makedirs("../reports", exist_ok=True)
        
        print(f"🚀 Iniciando tests con Microsoft Edge...")
    
    def take_screenshot(self, test_name):
        """Tomar captura de pantalla"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"../reports/screenshot_{test_name}_{timestamp}.png"
        self.driver.save_screenshot(filename)
        print(f"📸 Captura guardada: {filename}")
        return filename
    
    def test_homepage_load(self):
        """Test básico de carga de homepage"""
        print("🧪 Testing Homepage Load...")
        start_time = time.time()
        
        try:
            self.driver.get(self.base_url)
            print(f"   🌐 Navegando a: {self.base_url}")
            
            # Esperar que cargue
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            
            load_time = time.time() - start_time
            title = self.driver.title
            screenshot = self.take_screenshot("homepage_load")
            
            # Verificar elementos específicos de Teknigo
            try:
                # Buscar elementos que indiquen que es Teknigo
                teknigo_elements = self.driver.find_elements(By.XPATH, "//*[contains(text(), 'Teknigo')]")
                hero_elements = self.driver.find_elements(By.XPATH, "//*[contains(@class, 'hero') or contains(text(), 'servicios') or contains(text(), 'técnico')]")
                
                print(f"   🔍 Elementos 'Teknigo' encontrados: {len(teknigo_elements)}")
                print(f"   🔍 Elementos hero/servicios encontrados: {len(hero_elements)}")
                
            except Exception as e:
                print(f"   ⚠️ Error verificando elementos: {e}")
            
            result = {
                "test": "Homepage Load",
                "status": "PASS",
                "load_time": round(load_time, 2),
                "title": title,
                "url": self.driver.current_url,
                "screenshot": screenshot,
                "timestamp": datetime.now().isoformat()
            }
            self.results.append(result)
            
            print(f"   ✅ Homepage loaded in {load_time:.2f}s")
            print(f"   📄 Title: {title}")
            print(f"   🔗 URL: {self.driver.current_url}")
            
        except Exception as e:
            screenshot = self.take_screenshot("homepage_load_error")
            result = {
                "test": "Homepage Load",
                "status": "FAIL",
                "error": str(e),
                "screenshot": screenshot,
                "timestamp": datetime.now().isoformat()
            }
            self.results.append(result)
            print(f"   ❌ Homepage load failed: {e}")
    
    def test_navigation_links(self):
        """Test de enlaces de navegación básicos"""
        print("🧪 Testing Navigation Links...")
        
        try:
            self.driver.get(self.base_url)
            time.sleep(2)
            
            # Buscar enlaces comunes en Next.js
            links_to_test = [
                "/register",
                "/login", 
                "/contact",
                "/about"
            ]
            
            working_links = []
            broken_links = []
            
            for link_path in links_to_test:
                try:
                    print(f"   🔗 Probando enlace: {link_path}")
                    
                    # Navegar directamente al enlace
                    full_url = f"{self.base_url}{link_path}"
                    self.driver.get(full_url)
                    time.sleep(2)
                    
                    # Verificar que la página cargó
                    current_url = self.driver.current_url
                    page_title = self.driver.title
                    
                    if link_path in current_url:
                        working_links.append({
                            "path": link_path,
                            "title": page_title,
                            "url": current_url
                        })
                        print(f"     ✅ {link_path} works - Title: {page_title}")
                    else:
                        broken_links.append({
                            "path": link_path,
                            "error": f"URL mismatch: expected {link_path}, got {current_url}"
                        })
                        print(f"     ❌ {link_path} failed - URL mismatch")
                        
                except Exception as e:
                    broken_links.append({
                        "path": link_path,
                        "error": str(e)
                    })
                    print(f"     ❌ {link_path} error: {e}")
            
            screenshot = self.take_screenshot("navigation_test")
            
            result = {
                "test": "Navigation Links",
                "status": "PASS" if len(broken_links) == 0 else "PARTIAL",
                "working_links": working_links,
                "broken_links": broken_links,
                "total_tested": len(links_to_test),
                "screenshot": screenshot,
                "timestamp": datetime.now().isoformat()
            }
            self.results.append(result)
            
            print(f"   📊 {len(working_links)} working, {len(broken_links)} broken")
            
        except Exception as e:
            screenshot = self.take_screenshot("navigation_error")
            result = {
                "test": "Navigation Links",
                "status": "FAIL",
                "error": str(e),
                "screenshot": screenshot,
                "timestamp": datetime.now().isoformat()
            }
            self.results.append(result)
            print(f"   ❌ Navigation test failed: {e}")
    
    def test_forms_presence(self):
        """Test de presencia de formularios"""
        print("🧪 Testing Forms Presence...")
        
        forms_to_test = [
            ("/register", "registration form"),
            ("/login", "login form"),
            ("/contact", "contact form")
        ]
        
        for url_path, form_name in forms_to_test:
            try:
                print(f"   📝 Verificando {form_name} en {url_path}")
                
                full_url = f"{self.base_url}{url_path}"
                self.driver.get(full_url)
                time.sleep(3)  # Dar tiempo para que cargue React
                
                # Buscar formularios y elementos de entrada
                forms = self.driver.find_elements(By.TAG_NAME, "form")
                inputs = self.driver.find_elements(By.TAG_NAME, "input")
                buttons = self.driver.find_elements(By.TAG_NAME, "button")
                textareas = self.driver.find_elements(By.TAG_NAME, "textarea")
                
                # Buscar elementos específicos por texto
                email_inputs = self.driver.find_elements(By.XPATH, "//input[@type='email' or @name='email' or contains(@placeholder, 'email') or contains(@placeholder, 'Email')]")
                password_inputs = self.driver.find_elements(By.XPATH, "//input[@type='password' or @name='password' or contains(@placeholder, 'contraseña') or contains(@placeholder, 'password')]")
                
                total_form_elements = len(inputs) + len(textareas) + len(buttons)
                
                result = {
                    "test": f"Form Presence - {form_name}",
                    "status": "PASS" if total_form_elements > 0 else "FAIL",
                    "forms_count": len(forms),
                    "inputs_count": len(inputs),
                    "buttons_count": len(buttons),
                    "textareas_count": len(textareas),
                    "email_inputs": len(email_inputs),
                    "password_inputs": len(password_inputs),
                    "total_elements": total_form_elements,
                    "url": url_path,
                    "page_title": self.driver.title,
                    "timestamp": datetime.now().isoformat()
                }
                self.results.append(result)
                
                print(f"     📊 {form_name}:")
                print(f"       - Forms: {len(forms)}")
                print(f"       - Inputs: {len(inputs)}")
                print(f"       - Buttons: {len(buttons)}")
                print(f"       - Email fields: {len(email_inputs)}")
                print(f"       - Password fields: {len(password_inputs)}")
                print(f"       - Status: {'✅ PASS' if total_form_elements > 0 else '❌ FAIL'}")
                
            except Exception as e:
                result = {
                    "test": f"Form Presence - {form_name}",
                    "status": "FAIL",
                    "error": str(e),
                    "url": url_path,
                    "timestamp": datetime.now().isoformat()
                }
                self.results.append(result)
                print(f"     ❌ {form_name} test failed: {e}")
    
    def generate_simple_report(self):
        """Generar reporte simple en JSON"""
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Reporte JSON
        json_filename = f"../reports/edge_selenium_{timestamp}.json"
        report_data = {
            "test_suite": "Teknigo Edge Selenium Tests",
            "browser": "Microsoft Edge",
            "start_time": self.start_time.isoformat(),
            "end_time": datetime.now().isoformat(),
            "total_duration": str(datetime.now() - self.start_time),
            "base_url": self.base_url,
            "results": self.results,
            "summary": {
                "total_tests": len(self.results),
                "passed": len([r for r in self.results if r["status"] == "PASS"]),
                "failed": len([r for r in self.results if r["status"] == "FAIL"]),
                "partial": len([r for r in self.results if r["status"] == "PARTIAL"])
            }
        }
        
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False)
        
        # Reporte de texto simple
        txt_filename = f"../reports/edge_selenium_{timestamp}.txt"
        with open(txt_filename, 'w', encoding='utf-8') as f:
            f.write("TEKNIGO EDGE SELENIUM TESTS - REPORTE\n")
            f.write("=" * 50 + "\n\n")
            f.write(f"Browser: Microsoft Edge\n")
            f.write(f"Base URL: {self.base_url}\n")
            f.write(f"Inicio: {self.start_time}\n")
            f.write(f"Fin: {datetime.now()}\n")
            f.write(f"Duración: {datetime.now() - self.start_time}\n\n")
            
            for result in self.results:
                f.write(f"TEST: {result['test']}\n")
                f.write(f"STATUS: {result['status']}\n")
                if 'error' in result:
                    f.write(f"ERROR: {result['error']}\n")
                if 'load_time' in result:
                    f.write(f"LOAD TIME: {result['load_time']}s\n")
                f.write("-" * 30 + "\n")
        
        return json_filename, txt_filename
    
    def run_basic_tests(self):
        """Ejecutar tests básicos"""
        print("🚀 Starting Teknigo Edge Selenium Tests...")
        print("=" * 50)
        
        try:
            # Ejecutar tests
            self.test_homepage_load()
            self.test_navigation_links()
            self.test_forms_presence()
            
            # Generar reportes
            json_file, txt_file = self.generate_simple_report()
            
            # Resumen
            passed = len([r for r in self.results if r["status"] == "PASS"])
            failed = len([r for r in self.results if r["status"] == "FAIL"])
            partial = len([r for r in self.results if r["status"] == "PARTIAL"])
            total = len(self.results)
            
            print("\n" + "=" * 50)
            print("📊 RESULTADOS EDGE SELENIUM")
            print("=" * 50)
            print(f"✅ PASSED:  {passed}/{total}")
            print(f"❌ FAILED:  {failed}/{total}")
            print(f"⚠️  PARTIAL: {partial}/{total}")
            print(f"📈 SUCCESS: {(passed/total)*100:.1f}%")
            print(f"⏱️  TIME: {datetime.now() - self.start_time}")
            print(f"📋 JSON: {json_file}")
            print(f"📋 TXT: {txt_file}")
            print("=" * 50)
            
            return passed == total
            
        finally:
            # Cerrar navegador
            print("🔚 Cerrando navegador...")
            self.driver.quit()

if __name__ == "__main__":
    print("🔧 Verificando que el servidor esté ejecutándose en http://localhost:3000")
    
    try:
        import requests
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ Servidor en línea, iniciando tests...")
            tests = TeknigoEdgeTests()
            success = tests.run_basic_tests()
            exit(0 if success else 1)
        else:
            print(f"❌ Servidor responde con código {response.status_code}")
            exit(1)
    except Exception as e:
        print(f"❌ No se puede conectar al servidor: {e}")
        print("💡 Asegúrate de ejecutar 'npm run dev' en otra terminal")
        exit(1)
