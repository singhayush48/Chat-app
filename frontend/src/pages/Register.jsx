import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { AuthLayout } from '@/layouts/AuthLayout';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ROUTES } from '@/constants/routes';

export default function Register() {
  return (
    <AuthLayout>
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
          <MessageCircle className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-lg font-semibold text-foreground">Create an account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Get started in a few seconds</p>
      </div>

      <RegisterForm />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to={ROUTES.LOGIN} className="font-medium text-primary hover:underline">
          Log in
        </Link>
      </p>
    </AuthLayout>
  );
}
