import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MailCheckIcon } from 'lucide-react';

export default function RegisterConfirmationPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-zinc-900">
      <div className="relative z-10 w-full max-w-md py-12 px-4">
        <div className="bg-zinc-800 backdrop-blur-lg rounded-xl border border-zinc-700 shadow-xl p-8 space-y-6 text-center">
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 mx-auto bg-gradient-to-r from-zinc-600 to-zinc-800 rounded-full flex items-center justify-center mb-4 border border-zinc-600">
              <MailCheckIcon className="text-white h-8 w-8" />
            </div>
            <h1 className="text-2xl font-bold text-white">Check Your Email</h1>
            <p className="mt-4 text-zinc-400">
              We've sent a confirmation email to your address. Please check your inbox and click the confirmation link to activate your account.
            </p>
          </div>
          
          <div className="mt-8">
            <p className="text-sm text-zinc-400 mb-4">
              Didn't receive an email? Check your spam folder or try again.
            </p>
            <Link href="/register">
              <Button variant="outline">Back to Registration</Button>
            </Link>
          </div>
          
          <div className="mt-8">
            <p className="text-sm text-zinc-400">
              Already confirmed?
            </p>
            <Link href="/login">
              <Button variant="link">Sign in</Button>
            </Link>
          </div>
        </div>
        
        <div className="mt-10 text-center text-zinc-500 text-xs">
          &copy; {new Date().getFullYear()} QanDu AI. All rights reserved.
        </div>
      </div>
    </div>
  );
} 