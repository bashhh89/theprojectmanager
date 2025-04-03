import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-900">
      <div className="relative z-10 w-full max-w-md py-12 px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">QanDu AI</h1>
          <p className="text-zinc-400">Create your AI assistant account</p>
        </div>
        
        <RegisterForm />
        
        <div className="mt-10 text-center text-zinc-500 text-xs">
          &copy; {new Date().getFullYear()} QanDu AI. All rights reserved.
        </div>
      </div>
    </div>
  );
} 