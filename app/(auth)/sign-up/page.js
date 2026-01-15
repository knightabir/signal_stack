'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Loader2,
  User,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

function PasswordRequirements({ password, confirmPassword }) {
  const requirements = [
    { met: password.length >= 8, text: 'At least 8 characters' },
    {
      met: !!password && !!confirmPassword && password === confirmPassword,
      text: 'Passwords match'
    }
  ];
  if (!password.length) return null;
  return (
    <ul className="space-y-1 mt-2">
      {requirements.map((req, i) => (
        <li key={i} className="flex items-center text-sm gap-2">
          <CheckCircle2 className={`h-4 w-4 ${req.met ? 'text-green-500' : 'text-muted-foreground'}`} />
          <span className={req.met ? 'text-green-500' : 'text-muted-foreground'}>
            {req.text}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function SignUpPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    setError('');
  };

  const validateForm = () => {
    if (formData.name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return false;
    }
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Enter a valid email address');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create account');
        setIsLoading(false);
        return;
      }

      // Auto sign-in
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false
      });

      if (result?.error) {
        setError('Account created but sign in failed. Please try signing in manually.');
        setIsLoading(false);
        return;
      }

      // Redirect to onboarding
      router.push('/onboarding');
      router.refresh();
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-xl border border-border backdrop-blur-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 via-purple-500 to-blue-600 shadow-lg">
            <svg
              className="h-7 w-7 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Create your account
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Start collecting feedback in minutes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error &&
            <div className="mb-4 flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive font-medium animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          }
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            <div>
              <Label htmlFor="name">Full name</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  autoComplete="name"
                  required
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-9 shadow-none bg-background border-border ring-0 focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email address</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  autoComplete="email"
                  required
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-9 shadow-none bg-background border-border ring-0 focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  required
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-9 shadow-none bg-background border-border ring-0 focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  autoComplete="new-password"
                  required
                  type="password"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-9 shadow-none bg-background border-border ring-0 focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <PasswordRequirements
              password={formData.password}
              confirmPassword={formData.confirmPassword}
            />
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full font-bold mt-3 text-white bg-gradient-to-r from-indigo-500 via-purple-600 to-blue-600 hover:from-indigo-600 hover:to-blue-700 transition-colors focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <div className="w-full flex flex-col items-center gap-2">
            <div className="w-full h-px bg-border my-1" />
            <p className="text-sm text-muted-foreground text-center">
              Already have an account?{' '}
              <Link href="/sign-in" className="font-medium text-indigo-500 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400">
                Sign in
              </Link>
            </p>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
