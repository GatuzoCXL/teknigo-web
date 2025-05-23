export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-blue-800 py-16">
        <div className="absolute inset-0">
          <img className="w-full h-full object-cover" src="/images/about-hero.jpg" alt="Equipo de Teknigo" />
          <div className="absolute inset-0 bg-blue-900 opacity-75"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Sobre Teknigo
            </h1>
            <p className="mt-6 text-xl text-blue-100 max-w-3xl mx-auto">
              Conectando a clientes con los mejores técnicos profesionales desde 2023.
            </p>
          </div>
        </div>
      </div>

      {/* Mission section */}
      <div className="py-16 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Nuestra Misión
              </h2>
              <p className="mt-3 max-w-3xl text-lg text-gray-500">
                En Teknigo, nuestra misión es conectar a personas que necesitan servicios técnicos con profesionales calificados, de manera rápida, segura y confiable.
              </p>
              <p className="mt-3 max-w-3xl text-lg text-gray-500">
                Buscamos transformar la forma en que se contratan servicios técnicos, garantizando transparencia, calidad y satisfacción tanto para clientes como para los técnicos.
              </p>
            </div>
            <div className="mt-10 lg:mt-0">
              <div className="pl-4 -mr-48 sm:pl-6 md:-mr-16 lg:px-0 lg:m-0 lg:relative lg:h-full">
                <img
                  className="w-full rounded-xl shadow-xl ring-1 ring-black ring-opacity-5 lg:absolute lg:left-0 lg:h-full lg:w-auto lg:max-w-none"
                  src="/images/mission.jpg"
                  alt="Misión de Teknigo"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Values section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Nuestros Valores
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-500">
              Los valores que nos guían y definen nuestra cultura organizacional.
            </p>
          </div>

          <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-6 py-8">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="ml-4 text-lg font-medium text-gray-900">Confianza</h3>
                </div>
                <div className="mt-4 text-base text-gray-500">
                  Construimos relaciones basadas en la confianza y transparencia, garantizando que cada interacción sea honesta y directa.
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-6 py-8">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <h3 className="ml-4 text-lg font-medium text-gray-900">Excelencia</h3>
                </div>
                <div className="mt-4 text-base text-gray-500">
                  Nos esforzamos por la excelencia en todo lo que hacemos, desde nuestra plataforma hasta los servicios que ofrecen nuestros técnicos.
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-6 py-8">
                <div className="flex items-center">
                  <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                    <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="ml-4 text-lg font-medium text-gray-900">Comunidad</h3>
                </div>
                <div className="mt-4 text-base text-gray-500">
                  Creemos en el poder de la comunidad y en conectar a personas con profesionales locales que pueden ayudarles con sus necesidades.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Team section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">Nuestro Equipo</h2>
            <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-500">
              Conozca a las personas detrás de Teknigo, comprometidas con hacer realidad nuestra misión.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <div className="space-y-4">
                <img className="mx-auto h-40 w-40 rounded-full" src="/images/team-member-1.jpg" alt="Miembro del equipo 1" />
                <div className="space-y-2">
                  <div className="text-lg leading-6 font-medium space-y-1">
                    <h3 className="text-gray-900">Gasut</h3>
                    <p className="text-blue-600">CEO & Co-Fundador</p>
                  </div>
                  <div className="text-gray-500">
                    <p>Con más de 15 años de experiencia en tecnología y servicios.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="space-y-4">
                <img className="mx-auto h-40 w-40 rounded-full" src="/images/team-member-2.jpg" alt="Miembro del equipo 2" />
                <div className="space-y-2">
                  <div className="text-lg leading-6 font-medium space-y-1">
                    <h3 className="text-gray-900">Rosy</h3>
                    <p className="text-blue-600">CTO & Co-Fundadora</p>
                  </div>
                  <div className="text-gray-500">
                    <p>Ingeniera de software especializada en plataformas de servicios.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <div className="space-y-4">
                <img className="mx-auto h-40 w-40 rounded-full" src="/images/team-member-3.jpg" alt="Miembro del equipo 3" />
                <div className="space-y-2">
                  <div className="text-lg leading-6 font-medium space-y-1">
                    <h3 className="text-gray-900">Shrek 50</h3>
                    <p className="text-blue-600">Director de Operaciones</p>
                  </div>
                  <div className="text-gray-500">
                    <p>Experto en logística y coordinación de servicios técnicos.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-700">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">¿Listo para comenzar?</span>
            <span className="block text-blue-200">Únete a nuestra comunidad hoy.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <a
                href="/register"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50"
              >
                Registrarse
              </a>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Contáctanos
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer (simple) */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-base text-gray-400">
            &copy; 2025 Teknigo. Todos los derechos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
