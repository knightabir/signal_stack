'use client';

import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Mail, Lock, AlertCircle, Command } from 'lucide-react';

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                <Command className="h-6 w-6" />
            </div>
            <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Welcome back
                </h1>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Enter your email to sign in to your account
                </p>
            </div>
       </div>

      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <CardContent className="pt-6">
            {/* Error Alert */}
            {error && (
                <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-50 dark:bg-red-900/10 p-3 text-sm text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:ring-indigo-500 rounded-lg"
                        placeholder="name@example.com"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        <Link 
                            href="/forgot-password"
                            className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <Input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:ring-indigo-500 rounded-lg"
                        placeholder="••••••••"
                    />
                </div>

                <Button
                type="submit"
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 rounded-lg h-10 font-medium"
                >
                    {isLoading ? (
                        <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                        </>
                    ) : (
                        'Sign in'
                    )}
                </Button>
            </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-6 rounded-b-xl">
             <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                Don&apos;t have an account?{' '}
                <Link
                    href="/sign-up"
                    className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 underline-offset-4 hover:underline"
                >
                    Sign up
                </Link>
             </div>
        </CardFooter>
      </Card>
      
      <p className="px-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          By clicking continue, you agree to our{' '}
          <Link href="/terms" className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-zinc-900 dark:hover:text-zinc-100">
            Privacy Policy
          </Link>
          .
        </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div>}>
        <SignInForm />
    </Suspense>
  )
}
