import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import Workspace from '@/models/Workspace';

// Reserved slugs that cannot be used as workspace URLs
const RESERVED_SLUGS = [
  'api', 'sign-in', 'sign-up', 'onboarding', 'settings', 'admin',
  'dashboard', 'app', 'www', 'mail', 'ftp', 'localhost', 'signalstack',
  'feedback', 'roadmap', 'changelog', 'widget', 'embed', 'public', 'p',
];

/**
 * GET /api/onboarding/check-slug?slug=xxx
 * Check if a workspace slug is available
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug')?.toLowerCase();

    if (!slug) {
      return NextResponse.json({ available: false, error: 'Slug is required' });
    }

    if (slug.length < 3) {
      return NextResponse.json({ available: false, error: 'URL must be at least 3 characters' });
    }

    if (slug.length > 50) {
      return NextResponse.json({ available: false, error: 'URL must be at most 50 characters' });
    }

    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json({ 
        available: false, 
        error: 'Only lowercase letters, numbers, and hyphens allowed' 
      });
    }

    if (RESERVED_SLUGS.includes(slug)) {
      return NextResponse.json({ available: false, error: 'This URL is reserved' });
    }

    await dbConnect();
    const existing = await Workspace.findOne({ slug });
    
    if (existing) {
      return NextResponse.json({ available: false, error: 'This URL is already taken' });
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error('Error checking slug:', error);
    return NextResponse.json({ available: false, error: 'Server error' }, { status: 500 });
  }
}
