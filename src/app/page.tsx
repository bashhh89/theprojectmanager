export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-blue-500">ProjectHub</span>
          </div>
          
          <nav>
            <ul className="flex space-x-6">
              <li>
                <a href="/login" className="text-gray-300 hover:text-white transition-colors">
                  Login
                </a>
              </li>
              <li>
                <a href="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
                  Sign Up
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      
      {/* Hero */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
              Manage Your Projects with Ease
            </h1>
            <p className="text-xl text-gray-400 max-w-3xl mx-auto">
              Organize tasks, track progress, and collaborate with your team in one powerful platform
            </p>
            <div className="mt-10">
              <a href="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors inline-block">
                Get Started For Free
              </a>
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-xl overflow-hidden">
            <div className="p-8">
              <div className="bg-gray-900 rounded-lg p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">Project Dashboard</h2>
                  <span className="px-3 py-1 bg-blue-900/30 text-blue-400 border border-blue-800 rounded-full text-sm">Preview</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                      <h3 className="font-medium mb-2">Sample Project {i}</h3>
                      <div className="h-2 bg-gray-700 rounded-full mb-3">
                        <div 
                          className="h-2 bg-blue-600 rounded-full" 
                          style={{ width: `${i * 25}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-400">Tasks: {i * 3}/12</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features */}
      <section className="py-16 px-6 bg-gray-800/50">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl font-bold mb-12 text-center">Powerful Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="text-blue-500 mb-4 text-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="3" y1="9" x2="21" y2="9"></line>
                  <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Project Management</h3>
              <p className="text-gray-400">
                Create and organize projects with detailed information and progress tracking.
              </p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="text-blue-500 mb-4 text-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Task Tracking</h3>
              <p className="text-gray-400">
                Break down projects into manageable tasks with priorities, due dates, and status tracking.
              </p>
            </div>
            
            <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
              <div className="text-blue-500 mb-4 text-2xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2">Progress Analytics</h3>
              <p className="text-gray-400">
                Visualize project progress and track completion rates with intuitive progress bars.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to get started?</h2>
          <p className="text-xl text-gray-400 mb-10">
            Sign up now and start managing your projects more efficiently.
          </p>
          <div className="flex justify-center space-x-4">
            <a href="/register" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
              Create Free Account
            </a>
            <a href="/login" className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg transition-colors">
              Sign In
            </a>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-800 py-10 border-t border-gray-700">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="text-2xl font-bold text-blue-500">ProjectHub</span>
            </div>
            <div className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} ProjectHub. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
