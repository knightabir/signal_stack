import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Workspace, Feedback, Vote } from '@/models';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/widget/[token]
 * Get workspace data for widget iframe
 */
export async function GET(request, { params }) {
  try {
    const { token } = await params;

    const rateLimitResponse = applyRateLimit(request, 'public');
    if (rateLimitResponse) return rateLimitResponse;

    await dbConnect();

    const workspace = await Workspace.findOne({ widgetToken: token }).lean();

    if (!workspace || !workspace.settings?.widgetEnabled) {
      return NextResponse.json({ error: 'Widget not found or disabled' }, { status: 404 });
    }

    // Get feedback for this workspace
    const feedback = await Feedback.find({
      workspaceId: workspace._id,
      isHidden: false,
      mergedIntoId: null,
    })
      .select('title description status voteCount commentCount createdAt authorName isAnonymous')
      .sort({ voteCount: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({
      workspace: {
        id: workspace._id.toString(),
        name: workspace.name,
        slug: workspace.slug,
        settings: {
          theme: workspace.settings.widgetTheme,
          position: workspace.settings.widgetPosition,
          buttonText: workspace.settings.widgetButtonText,
          allowAnonymous: workspace.settings.allowAnonymousFeedback,
          primaryColor: workspace.settings.primaryColor,
        },
      },
      feedback: feedback.map((f) => ({
        id: f._id.toString(),
        title: f.title,
        description: f.description,
        status: f.status,
        voteCount: f.voteCount,
        commentCount: f.commentCount,
        author: f.isAnonymous ? 'Anonymous' : f.authorName || 'Guest',
        createdAt: f.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching widget data:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}

/**
 * POST /api/widget/[token]
 * Submit feedback via widget
 */
export async function POST(request, { params }) {
  try {
    const { token } = await params;

    const rateLimitResponse = applyRateLimit(request, 'api');
    if (rateLimitResponse) return rateLimitResponse;

    await dbConnect();

    const workspace = await Workspace.findOne({ widgetToken: token }).lean();

    if (!workspace || !workspace.settings?.widgetEnabled) {
      return NextResponse.json({ error: 'Widget not found or disabled' }, { status: 404 });
    }

    const body = await request.json();
    const { title, description, authorName, authorEmail } = body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (title.trim().length < 5) {
      return NextResponse.json({ error: 'Title must be at least 5 characters' }, { status: 400 });
    }

    // Check if anonymous allowed
    if (!workspace.settings.allowAnonymousFeedback && !authorEmail) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Create feedback
    const feedback = await Feedback.create({
      workspaceId: workspace._id,
      title: title.trim(),
      description: description?.trim() || '',
      authorName: authorName?.trim() || null,
      authorEmail: authorEmail?.trim() || null,
      isAnonymous: !authorEmail,
      status: 'new',
      voteCount: 0,
      commentCount: 0,
    });

    return NextResponse.json(
      {
        message: 'Feedback submitted',
        feedback: {
          id: feedback._id.toString(),
          title: feedback.title,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error submitting widget feedback:', error);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
