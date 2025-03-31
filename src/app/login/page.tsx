import LoginForm from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-900 via-black to-gray-900">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-1/3 top-1/4 w-96 h-96 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
        <div className="absolute right-1/3 top-1/3 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute left-1/2 bottom-1/4 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-2000"></div>
      </div>
      
      <div className="relative z-10 w-full max-w-md py-12 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Agent Platform</h1>
          <p className="text-gray-400">Your AI Assistant Workspace</p>
        </div>
        
        <LoginForm />
        
        <div className="mt-10 text-center text-gray-500 text-xs">
          &copy; {new Date().getFullYear()} Agent Platform. All rights reserved.
        </div>
      </div>
    </div>
  );
}
