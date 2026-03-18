import dbConnect from '@/lib/mongodb';
import Note from '@/models/Note';
import User from '@/models/User';
import { encrypt } from '@/lib/encryption';
import { NoteSchema } from '@/lib/validation';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { v4 as uuidv4 } from 'uuid';

export async function GET(req) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const { searchParams } = new URL(req.url);
    const tagId = searchParams.get('tagId');

    const query = { userId: session.user.id };
    if (tagId) {
      query.tagId = tagId;
    }

    const notes = await Note.find(query)
      .populate('tagId', 'name color')
      .sort({ createdAt: -1 });

    return NextResponse.json(notes);
  } catch (error) {
    console.error('Get notes error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = NoteSchema.parse(body);

    await dbConnect();

    // Encrypt the description
    const encryptedDescription = encrypt(validatedData.description);

    const note = await Note.create({
      title: validatedData.title,
      description: validatedData.description,
      encryptedDescription,
      userId: session.user.id,
      tagId: validatedData.tagId || null,
      expiryDate: validatedData.expiryDate || null,
    });

    // Update user notes count
    await User.findByIdAndUpdate(session.user.id, { $inc: { notesCount: 1 } });

    await note.populate('tagId', 'name color');

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error('Create note error:', error);
    
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
