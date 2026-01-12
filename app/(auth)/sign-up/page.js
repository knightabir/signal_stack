'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function SignUpPage() {
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError('');
  };

  const validateForm = () => {
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
      // Register user (no workspace created yet)
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create account');
        setIsLoading(false);
        return;
      }

      // Auto sign-in after registration
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
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

  const passwordRequirements = [
    { met: formData.password.length >= 8, text: 'At least 8 characters' },
    { met: formData.password === formData.confirmPassword && formData.confirmPassword.length > 0, text: 'Passwords match' },
  ];

  return (
    <Card className="w-full border-slate-700/50 bg-slate-800/50 backdrop-blur-xl shadow-2xl">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
          <svg
            className="h-6 w-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <CardTitle className="text-2xl font-bold text-white">Create your account</CardTitle>
        <CardDescription className="text-slate-400">Start collecting feedback in minutes</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Error Alert */}
        {error && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
            </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <div className="relative">
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                    <Input
                        id="name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                        placeholder="John Doe"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                        placeholder="you@example.com"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                    <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="pl-10 bg-slate-900/50 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                        placeholder="••••••••"
                    />
                </div>
            </div>

            {/* Password Requirements */}
            {formData.password.length > 0 && (
            <div className="space-y-2">
                {passwordRequirements.map((req, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle2
                    className={`h-4 w-4 ${
                        req.met ? 'text-green-400' : 'text-slate-600'
                    }`}
                    />
                    <span className={req.met ? 'text-green-400' : 'text-slate-500'}>
                    {req.text}
                    </span>
                </div>
                ))}
            </div>
            )}

            <Button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 font-medium text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-600 hover:to-purple-700"
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
        <p className="w-full text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link
            href="/sign-in"
            className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
            Sign in
            </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
