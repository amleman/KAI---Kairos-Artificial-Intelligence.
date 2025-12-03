const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
            <div className="mb-8">
              <span className="text-6xl">🎉</span>
            </div>
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              ¡Bienvenido!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Has iniciado sesión correctamente en tu cuenta
            </p>
            <div className="inline-block bg-gradient-to-r from-green-400 to-blue-500 text-white px-6 py-3 rounded-full font-semibold">
              ✓ Sesión activa
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;