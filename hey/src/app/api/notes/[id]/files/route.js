import dbConnect from '@/lib/mongodb';
import Note from '@/models/Note';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB for entire note

// Configure body size limit for this route
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '100mb',
    },
  },
};

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req, { params }) {
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

    const formData = await req.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const uploadedFiles = [];
    let totalSize = note.totalFileSize || 0;

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      if (buffer.length > 100 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'File size exceeds 100MB limit' },
          { status: 400 }
        );
      }

      if (totalSize + buffer.length > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: 'Total file size exceeds 100MB limit' },
          { status: 400 }
        );
      }

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: `notes/${note._id}`,
            resource_type: 'auto',
            public_id: `${uuidv4()}-${file.name}`,
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        stream.end(buffer);
      });

      uploadedFiles.push({
        _id: uuidv4(),
        filename: result.public_id,
        originalname: file.name,
        mimetype: file.type,
        size: result.bytes,
        url: result.secure_url,
        cloudinaryId: result.public_id,
        uploadedAt: new Date(),
      });

      totalSize += buffer.length;
    }

    note.files.push(...uploadedFiles);
    note.totalFileSize = totalSize;
    await note.save();

    return NextResponse.json({
      message: 'Files uploaded successfully',
      files: uploadedFiles,
      note: await note.populate('tagId', 'name color'),
    });
  } catch (error) {
    console.error('Upload error:', error);
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

    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'File ID is required' }, { status: 400 });
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

    const fileIndex = note.files.findIndex((f) => f._id.toString() === fileId);

    if (fileIndex === -1) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const file = note.files[fileIndex];

    // Delete from Cloudinary
    if (file.cloudinaryId) {
      try {
        await cloudinary.uploader.destroy(file.cloudinaryId);
      } catch (err) {
        console.error('Error deleting from Cloudinary:', err);
      }
    }

    note.totalFileSize -= file.size;
    note.files.splice(fileIndex, 1);
    await note.save();

    return NextResponse.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
