import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function RegisterConfirmationPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8 text-center">
        <div>
          <h1 className="text-3xl font-bold">Check Your Email</h1>
          <p className="mt-4 text-muted-foreground">
            We've sent a confirmation email to your address. Please check your inbox and click the confirmation link to activate your account.
          </p>
        </div>
        
        <div className="mt-8">
          <p className="text-sm text-muted-foreground mb-4">
            Didn't receive an email? Check your spam folder or try again.
          </p>
          <Link href="/register">
            <Button variant="outline">Back to Registration</Button>
          </Link>
        </div>
        
        <div className="mt-8">
          <p className="text-sm text-muted-foreground">
            Already confirmed?
          </p>
          <Link href="/login">
            <Button variant="link">Sign in</Button>
          </Link>
        </div>
      </div>
    </div>
  );
} 