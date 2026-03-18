import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    // Check for admin password in request or env
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminPassword || !adminEmail) {
      return NextResponse.json(
        { error: 'Admin credentials not configured in environment variables' },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      return NextResponse.json(
        { 
          message: 'Admin user already exists',
          email: adminEmail 
        },
        { status: 200 }
      );
    }

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin',
      email: adminEmail,
      password: adminPassword,
      role: 'admin',
    });

    return NextResponse.json(
      {
        message: 'Admin user created successfully',
        user: {
          id: adminUser._id,
          email: adminUser.email,
          name: adminUser.name,
          role: adminUser.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Admin initialization error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize admin user' },
      { status: 500 }
    );
  }
}
