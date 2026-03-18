import dbConnect from '@/lib/mongodb';
import Note from '@/models/Note';
import User from '@/models/User';
import { encrypt } from '@/lib/encryption';
import { NoteSchema } from '@/lib/validation';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const note = await Note.findById(id).populate('tagId', 'name color');

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Check if user owns this note or is admin
    if (note.userId.toString() !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('Get note error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const validatedData = NoteSchema.parse(body);

    await dbConnect();

    const note = await Note.findById(id);

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Check if user owns this note
    if (note.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Encrypt the description
    const encryptedDescription = encrypt(validatedData.description);

    note.title = validatedData.title;
    note.description = validatedData.description;
    note.encryptedDescription = encryptedDescription;
    note.tagId = validatedData.tagId || null;
    note.expiryDate = validatedData.expiryDate || null;
    note.updatedAt = new Date();

    await note.save();
    await note.populate('tagId', 'name color');

    return NextResponse.json(note);
  } catch (error) {
    console.error('Update note error:', error);
    
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

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const note = await Note.findById(id);

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    // Check if user owns this note
    if (note.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete associated files from Cloudinary
    if (note.files && note.files.length > 0) {
      for (const file of note.files) {
        try {
          if (file.cloudinaryId) {
            await cloudinary.uploader.destroy(file.cloudinaryId);
          }
        } catch (err) {
          console.error('Error deleting file from Cloudinary:', err);
        }
      }
    }

    await Note.findByIdAndDelete(id);

    // Update user notes count
    await User.findByIdAndUpdate(session.user.id, { $inc: { notesCount: -1 } });

    return NextResponse.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Delete note error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
