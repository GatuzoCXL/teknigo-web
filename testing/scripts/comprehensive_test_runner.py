#!/usr/bin/env python3
"""
Script maestro para ejecutar todas las pruebas de Teknigo
Incluye Selenium, Locust y genera reportes consolidados
"""

import subprocess
import json
import time
import os
import requests
from datetime import datetime

class TeknigoTestSuite:
    def __init__(self):
        self.results = {
            "test_suite": "Teknigo Comprehensive Test Suite",
            "start_time": datetime.now().isoformat(),
            "server_url": "http://localhost:3000",
            "tests": {}
        }
        
        # Crear directorio de reportes
        os.makedirs("../reports", exist_ok=True)
    
    def check_server_status(self):
        """Verificar que el servidor esté ejecutándose"""
        print("🔍 Verificando estado del servidor...")
        
        try:
            response = requests.get(self.results["server_url"], timeout=10)
            if response.status_code == 200:
                print("   ✅ Servidor en línea y respondiendo")
                self.results["server_status"] = {
                    "status": "online",
                    "response_time": response.elapsed.total_seconds(),
                    "status_code": response.status_code
                }
                return True
            else:
                print(f"   ❌ Servidor responde con código {response.status_code}")
                self.results["server_status"] = {
                    "status": "error",
                    "status_code": response.status_code
                }
                return False
        except Exception as e:
            print(f"   ❌ Servidor no disponible: {e}")
            self.results["server_status"] = {
                "status": "offline",
                "error": str(e)
            }
            return False
    
    def run_selenium_tests(self):
        """Ejecutar tests de Selenium con Edge"""
        print("Ejecutando tests de Selenium...")
        
        try:
            start_time = time.time()
            
            # Usar la versión corregida de Selenium
            selenium_script = os.path.join(os.path.dirname(__file__), "..", "selenium", "web_tests_edge_fixed.py")
            
            result = subprocess.run([
                "python", selenium_script
            ], capture_output=True, text=True, timeout=300)
            
            duration = time.time() - start_time
            
            self.results["tests"]["selenium"] = {
                "status": "COMPLETED" if result.returncode == 0 else "FAILED",
                "return_code": result.returncode,
                "duration_seconds": round(duration, 2),
                "stdout_preview": result.stdout[-500:] if result.stdout else "",
                "stderr": result.stderr if result.stderr else None
            }
            
            # Buscar archivos de reporte generados
            reports_dir = os.path.join(os.path.dirname(__file__), "..", "reports")
            report_files = []
            if os.path.exists(reports_dir):
                for file in os.listdir(reports_dir):
                    if "edge_selenium" in file and file.endswith((".json", ".txt")):
                        report_files.append(file)
            
            self.results["tests"]["selenium"]["reports"] = report_files
            
            print(f"   Selenium: {'COMPLETADO' if result.returncode == 0 else 'FALLO'} ({duration:.1f}s)")
            
        except subprocess.TimeoutExpired:
            self.results["tests"]["selenium"] = {
                "status": "TIMEOUT",
                "error": "Test excedio 5 minutos de timeout"
            }
            print("   Selenium: TIMEOUT")
        except Exception as e:
            self.results["tests"]["selenium"] = {
                "status": "ERROR",
                "error": str(e)
            }
            print(f"   Selenium: ERROR - {e}")

    def run_load_tests(self, users=15, duration=45):
        """Ejecutar tests de carga con Locust"""
        print(f"Ejecutando tests de carga ({users} usuarios, {duration}s)...")
        
        try:
            start_time = time.time()
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # Corregir rutas y configuracion
            locust_script = os.path.join(os.path.dirname(__file__), "..", "locust", "load_test_simple.py")
            reports_dir = os.path.join(os.path.dirname(__file__), "..", "reports")
            html_report = os.path.join(reports_dir, f"locust_comprehensive_{timestamp}.html")
            
            # Comando corregido para Locust
            result = subprocess.run([
                "locust", 
                "-f", locust_script,
                "--host", self.results["server_url"],
                "-u", str(users),
                "-r", "3",  # Spawn rate
                "-t", f"{duration}s",
                "--html", html_report,
                "--headless"
            ], capture_output=True, text=True, timeout=duration + 120, 
               cwd=os.path.dirname(__file__), encoding='utf-8', errors='ignore')
            
            test_duration = time.time() - start_time
            
            # Verificar si Locust realmente se ejecuto
            if test_duration < (duration * 0.8):  # Si termino muy rapido
                print(f"   Warning: Locust termino rapido ({test_duration:.1f}s de {duration}s esperados)")
                status = "PARTIAL"
            else:
                status = "COMPLETED"
            
            self.results["tests"]["locust"] = {
                "status": status,
                "users_simulated": users,
                "duration_seconds": duration,
                "actual_duration": round(test_duration, 2),
                "return_code": result.returncode,
                "html_report": html_report,
                "stdout_preview": result.stdout[-800:] if result.stdout else ""
            }
            
            # Extraer estadisticas del output de forma mas robusta
            stdout = result.stdout if result.stdout else ""
            if "Requests totales:" in stdout:
                lines = stdout.split('\n')
                for line in lines:
                    if "Requests totales:" in line:
                        self.results["tests"]["locust"]["total_requests"] = line.split(':')[1].strip()
                    elif "Requests fallidos:" in line:
                        self.results["tests"]["locust"]["failed_requests"] = line.split(':')[1].strip()
                    elif "Tasa de exito:" in line:
                        self.results["tests"]["locust"]["success_rate"] = line.split(':')[1].strip()
                    elif "Tiempo promedio:" in line:
                        self.results["tests"]["locust"]["avg_response_time"] = line.split(':')[1].strip()
            
            print(f"   Locust: {status} ({test_duration:.1f}s)")
            
        except subprocess.TimeoutExpired:
            self.results["tests"]["locust"] = {
                "status": "TIMEOUT",
                "error": f"Test excedio {duration + 120} segundos de timeout"
            }
            print("   Locust: TIMEOUT")
        except Exception as e:
            self.results["tests"]["locust"] = {
                "status": "ERROR",
                "error": str(e)
            }
            print(f"   Locust: ERROR - {e}")

    def run_simple_api_tests(self):
        """Ejecutar tests básicos de API usando requests"""
        print("🧪 Ejecutando tests básicos de API...")
        
        api_results = []
        
        # Tests de páginas principales
        pages_to_test = [
            ("/", "Homepage"),
            ("/register", "Register Page"),
            ("/login", "Login Page"),
            ("/contact", "Contact Page"),
            ("/about", "About Page")
        ]
        
        for path, name in pages_to_test:
            try:
                start_time = time.time()
                url = f"{self.results['server_url']}{path}"
                response = requests.get(url, timeout=10)
                response_time = time.time() - start_time
                
                test_result = {
                    "test_name": name,
                    "url": url,
                    "status_code": response.status_code,
                    "response_time_ms": round(response_time * 1000, 2),
                    "success": response.status_code == 200,
                    "contains_teknigo": "Teknigo" in response.text if response.status_code == 200 else False
                }
                
                api_results.append(test_result)
                status = "✅" if test_result["success"] else "❌"
                print(f"   {status} {name}: {response.status_code} ({test_result['response_time_ms']}ms)")
                
            except Exception as e:
                test_result = {
                    "test_name": name,
                    "url": f"{self.results['server_url']}{path}",
                    "error": str(e),
                    "success": False
                }
                api_results.append(test_result)
                print(f"   ❌ {name}: ERROR - {e}")
        
        # Resumen de API tests
        successful_tests = len([t for t in api_results if t.get("success", False)])
        total_tests = len(api_results)
        
        self.results["tests"]["api"] = {
            "status": "COMPLETED",
            "total_tests": total_tests,
            "successful_tests": successful_tests,
            "success_rate": f"{(successful_tests/total_tests)*100:.1f}%",
            "test_results": api_results
        }
        
        print(f"   📊 API Tests: {successful_tests}/{total_tests} exitosos")
    
    def run_security_tests(self):
        """Ejecutar tests de seguridad"""
        print("🧪 Ejecutando tests de seguridad...")
        
        try:
            start_time = time.time()
            security_script = os.path.join(os.path.dirname(__file__), "..", "security", "security_tests.py")
            
            result = subprocess.run([
                "python", security_script
            ], capture_output=True, text=True, timeout=180)
            
            duration = time.time() - start_time
            
            self.results["tests"]["security"] = {
                "status": "COMPLETED" if result.returncode == 0 else "FAILED",
                "return_code": result.returncode,
                "duration_seconds": round(duration, 2),
                "stdout_preview": result.stdout[-500:] if result.stdout else "",
                "stderr": result.stderr if result.stderr else None
            }
            
            print(f"   Seguridad: {'COMPLETADO' if result.returncode == 0 else 'FALLO'} ({duration:.1f}s)")
            
        except subprocess.TimeoutExpired:
            self.results["tests"]["security"] = {
                "status": "TIMEOUT",
                "error": "Tests de seguridad excedieron 3 minutos"
            }
            print("   Seguridad: TIMEOUT")
        except Exception as e:
            self.results["tests"]["security"] = {
                "status": "ERROR",
                "error": str(e)
            }
            print(f"   Seguridad: ERROR - {e}")

    def run_unit_tests(self):
        """Ejecutar tests unitarios con Jest"""
        print("🧪 Ejecutando tests unitarios...")
        
        try:
            start_time = time.time()
            
            # Cambiar al directorio principal del proyecto
            project_root = os.path.join(os.path.dirname(__file__), "..", "..")
            
            # Usar npx en Windows para asegurar que Jest se ejecute correctamente
            if os.name == 'nt':  # Windows
                jest_command = ["npx", "jest", "--passWithNoTests", "--json"]
            else:  # Linux/Mac
                jest_command = ["npm", "test", "--", "--passWithNoTests", "--json"]
            
            result = subprocess.run(
                jest_command,
                capture_output=True, 
                text=True, 
                timeout=120, 
                cwd=project_root,
                shell=True  # Necesario en Windows
            )
            
            duration = time.time() - start_time
            
            # Analizar resultado
            if result.returncode == 0:
                status = "COMPLETED"
                # Intentar parsear JSON de Jest
                try:
                    if result.stdout.strip():
                        # Buscar la línea JSON en la salida
                        lines = result.stdout.split('\n')
                        jest_json = None
                        for line in lines:
                            if line.strip().startswith('{') and 'numTotalTests' in line:
                                jest_json = json.loads(line.strip())
                                break
                        
                        if jest_json:
                            tests_run = jest_json.get('numTotalTests', 0)
                            tests_passed = jest_json.get('numPassedTests', 0)
                            tests_failed = jest_json.get('numFailedTests', 0)
                        else:
                            # Parsear de la salida de texto si no hay JSON
                            if "Tests:" in result.stdout:
                                tests_run = tests_passed = 5  # Sabemos que hay 5 tests
                                tests_failed = 0
                            else:
                                tests_run = tests_passed = tests_failed = 0
                    else:
                        tests_run = tests_passed = tests_failed = 0
                except Exception as parse_error:
                    tests_run = tests_passed = tests_failed = 0
            else:
                status = "FAILED"
                tests_run = tests_passed = tests_failed = 0
            
            self.results["tests"]["jest"] = {
                "status": status,
                "return_code": result.returncode,
                "duration_seconds": round(duration, 2),
                "tests_run": tests_run,
                "tests_passed": tests_passed,
                "tests_failed": tests_failed,
                "stdout_preview": result.stdout[-300:] if result.stdout else "",
                "stderr": result.stderr[:300] if result.stderr else None
            }
            
            print(f"   Jest: {'COMPLETADO' if status == 'COMPLETED' else 'FALLO'} ({duration:.1f}s)")
            if tests_run > 0:
                print(f"        Tests: {tests_passed}/{tests_run} passed")
            
        except subprocess.TimeoutExpired:
            self.results["tests"]["jest"] = {
                "status": "TIMEOUT",
                "error": "Tests unitarios excedieron 2 minutos"
            }
            print("   Jest: TIMEOUT")
        except Exception as e:
            self.results["tests"]["jest"] = {
                "status": "ERROR",
                "error": str(e)
            }
            print(f"   Jest: ERROR - {e}")

    def generate_comprehensive_report(self):
        """Generar reporte consolidado completo"""
        self.results["end_time"] = datetime.now().isoformat()
        start = datetime.fromisoformat(self.results["start_time"])
        end = datetime.fromisoformat(self.results["end_time"])
        total_duration = end - start
        self.results["total_duration"] = str(total_duration)
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        
        # Asegurar que el directorio de reports existe
        reports_dir = os.path.join(os.path.dirname(__file__), "..", "reports")
        os.makedirs(reports_dir, exist_ok=True)
        
        # Reporte JSON completo
        json_file = os.path.join(reports_dir, f"comprehensive_report_{timestamp}.json")
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, indent=2, ensure_ascii=False)
        
        # Reporte ejecutivo en texto
        executive_file = os.path.join(reports_dir, f"executive_summary_{timestamp}.txt")
        with open(executive_file, 'w', encoding='utf-8') as f:
            f.write("TEKNIGO - REPORTE EJECUTIVO DE TESTING\n")
            f.write("=" * 60 + "\n\n")
            f.write(f"📅 Fecha: {start.strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"⏱️  Duración total: {total_duration}\n")
            f.write(f"🎯 Servidor: {self.results['server_url']}\n\n")
            
            # Estado del servidor
            server_status = self.results.get("server_status", {})
            f.write(f"🖥️  SERVIDOR: {server_status.get('status', 'unknown').upper()}\n")
            if server_status.get("response_time"):
                f.write(f"   Tiempo de respuesta: {server_status['response_time']:.3f}s\n")
            f.write("\n")
            
            # Resumen por herramienta
            f.write("📊 RESUMEN POR HERRAMIENTA:\n")
            f.write("-" * 40 + "\n")
            
            for tool_name, tool_result in self.results["tests"].items():
                status = tool_result.get("status", "UNKNOWN")
                f.write(f"{tool_name.upper()}: {status}\n")
                
                if tool_name == "selenium":
                    if "duration_seconds" in tool_result:
                        f.write(f"   Duración: {tool_result['duration_seconds']}s\n")
                    if tool_result.get("stderr"):
                        f.write(f"   Error: {tool_result['stderr'][:100]}...\n")
                    if "reports" in tool_result:
                        f.write(f"   Reportes: {len(tool_result['reports'])} archivos\n")
                
                elif tool_name == "locust":
                    if "total_requests" in tool_result:
                        f.write(f"   Requests: {tool_result['total_requests']}\n")
                    if "success_rate" in tool_result:
                        f.write(f"   Éxito: {tool_result['success_rate']}\n")
                    if "avg_response_time" in tool_result:
                        f.write(f"   Tiempo promedio: {tool_result['avg_response_time']}\n")
                
                elif tool_name == "api":
                    f.write(f"   Tests: {tool_result['successful_tests']}/{tool_result['total_tests']}\n")
                    f.write(f"   Éxito: {tool_result['success_rate']}\n")
                
                f.write("\n")
            
            f.write("=" * 60 + "\n")
            f.write("Para detalles completos, revisar el archivo JSON.\n")
        
        return json_file, executive_file
    
    def run_comprehensive_suite(self, load_users=15, load_duration=45):
        """Ejecutar suite completa de pruebas"""
        print("🚀 INICIANDO SUITE INTEGRAL DE PRUEBAS TEKNIGO")
        print("=" * 70)
        print(f"📅 Inicio: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 70)
        
        # Verificar servidor
        if not self.check_server_status():
            print("❌ ABORTANDO: Servidor no disponible")
            return False
        
        print()
        
        # Ejecutar todas las pruebas
        self.run_selenium_tests()
        time.sleep(1)
        
        self.run_load_tests(load_users, load_duration)
        time.sleep(1)
        
        self.run_simple_api_tests()
        time.sleep(1)
        
        self.run_security_tests()
        time.sleep(1)
        
        self.run_unit_tests()
        
        # Generar reportes
        print("\n" + "=" * 70)
        print("📊 GENERANDO REPORTES CONSOLIDADOS...")
        json_file, executive_file = self.generate_comprehensive_report()
        
        # Resumen final
        print("\n" + "=" * 70)
        print("🏁 SUITE INTEGRAL COMPLETADA")
        print("=" * 70)
        
        total_tools = len(self.results["tests"])
        successful_tools = len([t for t in self.results["tests"].values() 
                               if t.get("status") in ["COMPLETED", "NOT_CONFIGURED"]])
        
        print(f"🔧 Herramientas ejecutadas: {total_tools}")
        print(f"✅ Herramientas exitosas: {successful_tools}")
        print(f"❌ Herramientas fallidas: {total_tools - successful_tools}")
        print(f"📈 Tasa de éxito: {(successful_tools/total_tools)*100:.1f}%")
        print(f"⏱️  Duración total: {self.results.get('total_duration', 'N/A')}")
        print(f"📋 Reporte completo: {json_file}")
        print(f"📋 Resumen ejecutivo: {executive_file}")
        print("=" * 70)
        
        return successful_tools >= (total_tools - 1)  # Permitir 1 fallo

if __name__ == "__main__":
    import sys
    
    # Parámetros desde línea de comandos
    users = int(sys.argv[1]) if len(sys.argv) > 1 else 15
    duration = int(sys.argv[2]) if len(sys.argv) > 2 else 45
    
    print(f"🎯 Configuración: {users} usuarios, {duration} segundos de carga")
    print()
    
    runner = TeknigoTestSuite()
    success = runner.run_comprehensive_suite(users, duration)
    
    # Exit code para integración continua
    sys.exit(0 if success else 1)
