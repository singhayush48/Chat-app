import { Link } from 'react-router-dom';
import { AuthLayout } from '@/layouts/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';
import { Logo } from '@/components/common/Logo';
import { ROUTES } from '@/constants/routes';

export default function Login() {
  return (
    <AuthLayout>
      <div className="mb-6 flex flex-col items-center text-center animate-fade-in">
        <Logo size="lg" layout="stack" className="mb-4" />
        <h1 className="text-lg font-semibold text-foreground">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Log in to continue chatting</p>
      </div>

      <LoginForm />

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link to={ROUTES.REGISTER} className="font-medium text-primary hover:underline">
          Register
        </Link>
      </p>
    </AuthLayout>
  );
}
