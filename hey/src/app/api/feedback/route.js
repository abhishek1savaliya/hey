import dbConnect from '@/lib/mongodb';
import Feedback from '@/models/Feedback';
import { FeedbackSchema } from '@/lib/validation';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(req) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const feedbacks = await Feedback.find()
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json(feedbacks);
  } catch (error) {
    console.error('Get feedback error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const session = await auth();

    const body = await req.json();
    const validatedData = FeedbackSchema.parse(body);

    await dbConnect();

    const feedbackData = {
      rating: validatedData.rating,
      message: validatedData.message,
    };

    if (session) {
      feedbackData.userId = session.user.id;
      feedbackData.email = session.user.email;
    } else {
      feedbackData.email = body.email || 'anonymous@example.com';
    }

    const feedback = await Feedback.create(feedbackData);

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error('Create feedback error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
