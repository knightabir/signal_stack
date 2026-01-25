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
  AlertCircle,
  Check,
  Command,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div className="space-y-2 mt-3 p-3 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
      <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Password requirements:</p>
      <ul className="space-y-1.5">
        {requirements.map((req, i) => (
          <li key={i} className="flex items-center text-xs gap-2">
            <div className={cn(
              "flex items-center justify-center w-4 h-4 rounded-full border",
              req.met 
                ? "bg-emerald-500 border-emerald-500 text-white" 
                : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-transparent"
            )}>
              <Check className="w-2.5 h-2.5" />
            </div>
            <span className={cn(
              "transition-colors",
              req.met ? "text-zinc-900 dark:text-zinc-200" : "text-zinc-500 dark:text-zinc-500"
            )}>
              {req.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
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
    <div className="space-y-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
             <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                 <Command className="h-6 w-6" />
             </div>
             <div className="space-y-2">
                 <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                     Create an account
                 </h1>
                 <p className="text-sm text-zinc-500 dark:text-zinc-400">
                     Enter your details below to create your account
                 </p>
             </div>
        </div>

      <Card className="border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
        <CardContent className="pt-6">
           {error &&
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-50 dark:bg-red-900/10 p-3 text-sm text-red-600 dark:text-red-400">
               <AlertCircle className="h-4 w-4 shrink-0" />
               <span>{error}</span>
            </div>
           }
          
           <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
             <div className="space-y-2">
               <Label htmlFor="name">Full Name</Label>
               <Input
                   id="name"
                   name="name"
                   autoComplete="name"
                   required
                   type="text"
                   placeholder="John Doe"
                   value={formData.name}
                   onChange={handleChange}
                   className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:ring-indigo-500 rounded-lg"
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="email">Email</Label>
               <Input
                   id="email"
                   name="email"
                   autoComplete="email"
                   required
                   type="email"
                   placeholder="name@example.com"
                   value={formData.email}
                   onChange={handleChange}
                   className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:ring-indigo-500 rounded-lg"
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="password">Password</Label>
               <Input
                   id="password"
                   name="password"
                   autoComplete="new-password"
                   required
                   type="password"
                   placeholder="••••••••"
                   value={formData.password}
                   onChange={handleChange}
                   className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:ring-indigo-500 rounded-lg"
               />
             </div>
             
             <div className="space-y-2">
               <Label htmlFor="confirmPassword">Confirm Password</Label>
               <Input
                   id="confirmPassword"
                   name="confirmPassword"
                   autoComplete="new-password"
                   required
                   type="password"
                   placeholder="••••••••"
                   value={formData.confirmPassword}
                   onChange={handleChange}
                   className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 focus:ring-indigo-500 rounded-lg"
               />
             </div>

             <PasswordRequirements
               password={formData.password}
               confirmPassword={formData.confirmPassword}
             />

             <Button
               type="submit"
               disabled={isLoading}
               className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 rounded-lg h-10 font-medium mt-2"
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
        <CardFooter className="flex flex-col gap-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-6 rounded-b-xl">
             <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
                Already have an account?{' '}
                <Link href="/sign-in" className="font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 underline-offset-4 hover:underline">
                    Sign in
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
