import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { WorkspaceMember } from '@/models';
import Link from 'next/link';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  
  // Not authenticated - show landing page
  if (!session?.user?.id) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent" />
        
        {/* Header */}
        <header className="relative z-10 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
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
                <span className="text-xl font-bold text-white">Signalstack</span>
              </div>
              <div className="flex items-center gap-4">
                <Button asChild variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/10">
                  <Link href="/sign-in">
                    Sign in
                  </Link>
                </Button>
                <Button asChild className="bg-indigo-500 hover:bg-indigo-600 text-white">
                  <Link href="/sign-up">
                    Get Started
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero */}
        <main className="relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
            <div className="text-center">
              <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
                Product feedback,{' '}
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  simplified.
                </span>
              </h1>
              <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
                Collect feedback, build public roadmaps, and keep your users in the loop with beautiful changelogs.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button asChild size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25 border-0">
                  <Link href="/sign-up">
                    Start for free
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700">
                  <Link href="#features">
                    Learn more
                  </Link>
                </Button>
              </div>
            </div>

            {/* Feature Cards */}
            <div id="features" className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <CardTitle className="text-white">Collect Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400 text-base">
                    Let users submit and vote on ideas. Understand what matters most to your customers.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                    </svg>
                  </div>
                  <CardTitle className="text-white">Public Roadmap</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400 text-base">
                    Share your product direction transparently. Build trust with a beautiful public roadmap.
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 backdrop-blur-xl border-slate-700/50">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                    </svg>
                  </div>
                  <CardTitle className="text-white">Changelog</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-400 text-base">
                    Announce new features and updates. Keep users engaged and informed about your progress.
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-slate-800 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-slate-500 text-sm">
              © 2024 Signalstack. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // Authenticated - redirect to default workspace
  await dbConnect();

  const membership = await WorkspaceMember.findOne({ userId: session.user.id })
    .populate('workspaceId', 'slug')
    .lean();

  if (membership?.workspaceId?.slug) {
    redirect(`/${membership.workspaceId.slug}`);
  }

  // No workspace - redirect to onboarding
  redirect('/onboarding');
}
