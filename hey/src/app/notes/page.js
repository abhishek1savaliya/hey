'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/DashboardLayout';
import Link from 'next/link';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTag, setSelectedTag] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [notesRes, tagsRes] = await Promise.all([
          axios.get('/api/notes'),
          axios.get('/api/tags'),
        ]);
        setNotes(notesRes.data);
        setTags(tagsRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      await axios.delete(`/api/notes/${id}`);
      setNotes(notes.filter((note) => note._id !== id));
    } catch (error) {
      alert('Error deleting note');
    }
  };

  const filteredNotes = notes.filter((note) => {
    const matchesTag = !selectedTag || note.tagId?._id === selectedTag;
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTag && matchesSearch;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Notes</h1>
          <Link href="/notes/new" className="btn-primary">
            + Create Note
          </Link>
        </div>

        {/* Filters */}
        <div className="card space-y-4">
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input"
          />
          <div>
            <label className="label">Filter by Tag</label>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="input"
            >
              <option value="">All Tags</option>
              {tags.map((tag) => (
                <option key={tag._id} value={tag._id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notes List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading notes...</div>
        ) : filteredNotes.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-500 mb-4">No notes found.</p>
            <Link href="/notes/new" className="btn-primary">
              Create Your First Note
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredNotes.map((note) => (
              <div
                key={note._id}
                className="card hover:shadow-lg transition-shadow flex justify-between items-start"
              >
                <div className="flex-1">
                  <Link href={`/notes/${note._id}`}>
                    <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                      {note.title}
                    </h3>
                  </Link>
                  <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                    {note.description.replace(/<[^>]*>/g, '')}
                  </p>
                  <div className="flex items-center gap-2 mt-3 flex-wrap">
                    {note.tagId && (
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: note.tagId.color }}
                      >
                        {note.tagId.name}
                      </span>
                    )}
                    {note.files?.length > 0 && (
                      <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                        📎 {note.files.length} file{note.files.length > 1 ? 's' : ''}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {new Date(note.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Link href={`/notes/${note._id}`} className="btn-secondary text-sm">
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(note._id)}
                    className="btn-danger text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
