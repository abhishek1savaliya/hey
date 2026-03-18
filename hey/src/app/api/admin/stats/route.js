import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import Note from '@/models/Note';
import { NextResponse } from 'next/server';
import { auth } from '@/auth';

export async function GET(req) {
  try {
    const session = await auth();
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalNotes = await Note.countDocuments();

    // Get notes per user
    const notesPerUser = await Note.aggregate([
      {
        $group: {
          _id: '$userId',
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          userId: '$_id',
          userName: '$user.name',
          userEmail: '$user.email',
          notesCount: '$count',
        },
      },
      {
        $sort: { notesCount: -1 },
      },
    ]);

    // Get admin stats
    const adminStats = {
      totalUsers,
      totalNotes,
      notesPerUser,
      averageNotesPerUser: totalUsers > 0 ? (totalNotes / totalUsers).toFixed(2) : 0,
    };

    return NextResponse.json(adminStats);
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
