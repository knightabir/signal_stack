import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import dbConnect from '@/lib/db';
import { Workspace, Feedback, Vote, FEEDBACK_STATUS } from '@/models';
import { applyRateLimit } from '@/lib/rateLimit';

/**
 * GET /api/workspaces/[workspaceId]/feedback
 * List feedback for a workspace (public)
 */
export async function GET(request, { params }) {
  try {
    const { workspaceId } = await params;
    const { searchParams } = new URL(request.url);

    // Rate limiting
    const rateLimitResponse = applyRateLimit(request, 'public');
    if (rateLimitResponse) return rateLimitResponse;

    await dbConnect();

    // Find workspace by ID or slug
    let workspace = await Workspace.findById(workspaceId).lean();
    if (!workspace) {
      workspace = await Workspace.findOne({ slug: workspaceId }).lean();
    }

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Query parameters
    const status = searchParams.get('status');
    const sort = searchParams.get('sort') || 'votes'; // votes, newest, oldest
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = Math.min(parseInt(searchParams.get('limit')) || 20, 50);
    const skip = (page - 1) * limit;

    // Build query
    const query = {
      workspaceId: workspace._id,
      isHidden: false,
      mergedIntoId: null, // Don't show merged feedback
    };

    if (status && Object.values(FEEDBACK_STATUS).includes(status)) {
      query.status = status;
    }

    // Sort options
    let sortOption = {};
    switch (sort) {
      case 'newest':
        sortOption = { createdAt: -1 };
        break;
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'votes':
      default:
        sortOption = { voteCount: -1, createdAt: -1 };
    }

    // Fetch feedback
    const [feedbackList, total] = await Promise.all([
      Feedback.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .populate('authorId', 'name image')
        .lean(),
      Feedback.countDocuments(query),
    ]);

    // Check if current user has voted on each item
    const session = await getServerSession(authOptions);
    let userVotes = {};

    if (session?.user?.id) {
      const votes = await Vote.find({
        feedbackId: { $in: feedbackList.map((f) => f._id) },
        userId: session.user.id,
      }).lean();

      votes.forEach((v) => {
        userVotes[v.feedbackId.toString()] = true;
      });
    }

    // Format response
    const feedback = feedbackList.map((f) => ({
      id: f._id.toString(),
      title: f.title,
      description: f.description,
      status: f.status,
      voteCount: f.voteCount,
      commentCount: f.commentCount,
      hasVoted: !!userVotes[f._id.toString()],
      author: f.authorId
        ? { name: f.authorId.name, image: f.authorId.image }
        : f.isAnonymous
        ? { name: 'Anonymous' }
        : { name: f.authorName || 'Guest' },
      createdAt: f.createdAt,
    }));

    return NextResponse.json({
      feedback,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ error: 'Failed to fetch feedback' }, { status: 500 });
  }
}

/**
 * POST /api/workspaces/[workspaceId]/feedback
 * Submit new feedback (public, optional auth)
 */
export async function POST(request, { params }) {
  try {
    const { workspaceId } = await params;

    // Rate limiting (stricter for submissions)
    const rateLimitResponse = applyRateLimit(request, 'api');
    if (rateLimitResponse) return rateLimitResponse;

    await dbConnect();

    // Find workspace
    let workspace = await Workspace.findById(workspaceId).lean();
    if (!workspace) {
      workspace = await Workspace.findOne({ slug: workspaceId }).lean();
    }

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Check if anonymous submissions are allowed
    const session = await getServerSession(authOptions);
    const isLoggedIn = !!session?.user?.id;

    if (!isLoggedIn && !workspace.settings?.allowAnonymousFeedback) {
      return NextResponse.json(
        { error: 'Please sign in to submit feedback' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, authorName, authorEmail, isAnonymous } = body;

    // Validation
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    if (title.length > 200) {
      return NextResponse.json(
        { error: 'Title cannot exceed 200 characters' },
        { status: 400 }
      );
    }

    // Create feedback
    const feedback = await Feedback.create({
      workspaceId: workspace._id,
      title: title.trim(),
      description: description?.trim() || '',
      authorId: isLoggedIn ? session.user.id : null,
      authorName: isLoggedIn ? null : authorName?.trim() || null,
      authorEmail: isLoggedIn ? null : authorEmail?.trim() || null,
      isAnonymous: isAnonymous || false,
      status: FEEDBACK_STATUS.NEW,
    });

    return NextResponse.json(
      {
        message: 'Feedback submitted successfully',
        feedback: {
          id: feedback._id.toString(),
          title: feedback.title,
          status: feedback.status,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating feedback:', error);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return NextResponse.json({ error: messages.join(', ') }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }
}
