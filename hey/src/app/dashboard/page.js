'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function Dashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    totalNotes: 0,
    recentNotes: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('/api/notes');
        setStats({
          totalNotes: response.data.length,
          recentNotes: response.data.slice(0, 5),
        });
      } catch (error) {
        console.error('Error fetching notes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome back, {session?.user?.name}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what you've been working on lately.
          </p>
        </div>

        {/* Stats */}
        <div className="dashboard-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalNotes}</div>
            <div className="stat-label">Total Notes</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.recentNotes.length}</div>
            <div className="stat-label">Recent Notes</div>
          </div>
          <div className="stat-card">
            <Link href="/notes" className="btn-primary">
              View All Notes
            </Link>
          </div>
        </div>

        {/* Recent Notes */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Notes</h2>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : stats.recentNotes.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-gray-500 mb-4">You haven't created any notes yet.</p>
              <Link href="/notes?tab=create" className="btn-primary">
                Create Your First Note
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentNotes.map((note) => (
                <div key={note._id} className="card hover:shadow-lg transition-shadow">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Link href={`/notes/${note._id}`}>
                        <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                          {note.title}
                        </h3>
                      </Link>
                      <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                        {note.description.replace(/<[^>]*>/g, '')}
                      </p>
                      <div className="flex items-center gap-2 mt-3">
                        {note.tagId && (
                          <span
                            className="px-3 py-1 rounded-full text-xs font-medium text-white"
                            style={{ backgroundColor: note.tagId.color }}
                          >
                            {note.tagId.name}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Link href={`/notes/${note._id}`} className="btn-secondary text-sm">
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/notes?tab=create"
            className="card text-center hover:shadow-lg transition-shadow cursor-pointer"
          >
            <p className="text-3xl mb-2">📝</p>
            <h3 className="font-semibold text-gray-900">Create Note</h3>
            <p className="text-sm text-gray-600 mt-1">Start a new note</p>
          </Link>

          <Link
            href="/profile"
            className="card text-center hover:shadow-lg transition-shadow cursor-pointer"
          >
            <p className="text-3xl mb-2">👤</p>
            <h3 className="font-semibold text-gray-900">View Profile</h3>
            <p className="text-sm text-gray-600 mt-1">Edit your info</p>
          </Link>

          <Link
            href="/feedback"
            className="card text-center hover:shadow-lg transition-shadow cursor-pointer"
          >
            <p className="text-3xl mb-2">⭐</p>
            <h3 className="font-semibold text-gray-900">Send Feedback</h3>
            <p className="text-sm text-gray-600 mt-1">Share your thoughts</p>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}
