'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import DashboardLayout from '@/components/DashboardLayout';

export default function NoteEditor() {
  const router = useRouter();
  const params = useParams();
  const isEditing = !!params.id;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tagId: '',
    expiryDate: '',
  });

  const [tags, setTags] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const tagsRes = await axios.get('/api/tags');
        setTags(tagsRes.data);
      } catch (err) {
        console.error('Error loading tags:', err);
        // Continue with empty tags
      }

      if (isEditing) {
        try {
          const noteRes = await axios.get(`/api/notes/${params.id}`);
          setFormData({
            title: noteRes.data.title,
            description: noteRes.data.description,
            tagId: noteRes.data.tagId?._id || '',
            expiryDate: noteRes.data.expiryDate
              ? new Date(noteRes.data.expiryDate).toISOString().split('T')[0]
              : '',
          });
          setFiles(noteRes.data.files || []);
        } catch (err) {
          setError('Error loading note');
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [isEditing, params.id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDescriptionChange = (value) => {
    setFormData((prev) => ({ ...prev, description: value }));
  };

  const handleFileUpload = async (e) => {
    const uploadedFiles = Array.from(e.target.files || []);

    if (!isEditing) {
      alert('Please save the note first before uploading files');
      return;
    }

    for (const file of uploadedFiles) {
      const formDataFile = new FormData();
      formDataFile.append('files', file);

      try {
        const res = await axios.post(`/api/notes/${params.id}/files`, formDataFile, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setFiles(res.data.note.files);
      } catch (err) {
        alert('Error uploading file: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  const handleDeleteFile = async (fileId) => {
    try {
      await axios.delete(`/api/notes/${params.id}/files?fileId=${fileId}`);
      setFiles(files.filter((f) => f._id !== fileId));
    } catch (err) {
      alert('Error deleting file');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      if (isEditing) {
        await axios.put(`/api/notes/${params.id}`, formData);
      } else {
        await axios.post('/api/notes', formData);
      }
      router.push('/notes');
    } catch (err) {
      setError(err.response?.data?.error || 'Error saving note');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-center py-12 text-gray-500">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Edit Note' : 'Create Note'}
          </h1>
          <button
            onClick={() => router.back()}
            className="btn-secondary"
          >
            Back
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="card space-y-4">
            <div>
              <label htmlFor="title" className="label">
                Title
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleChange}
                className="input"
                placeholder="Note title"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="label">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
                className="input h-40 resize-none"
                placeholder="Enter your note description..."
              />
            </div>

            {/* Tag Selection */}
            <div>
              <label htmlFor="tagId" className="label">
                Tag
              </label>
              <select
                id="tagId"
                name="tagId"
                value={formData.tagId}
                onChange={handleChange}
                className="input"
              >
                <option value="">Select a tag</option>
                {tags.map((tag) => (
                  <option key={tag._id} value={tag._id}>
                    {tag.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Expiry Date */}
            <div>
              <label htmlFor="expiryDate" className="label">
                Expiry Date (Optional)
              </label>
              <input
                id="expiryDate"
                name="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={handleChange}
                className="input"
              />
            </div>
          </div>

          {/* Files Section */}
          {isEditing && (
            <div className="card space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Files</h2>

              {files.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Attached files ({files.length})
                  </p>
                  <div className="space-y-2">
                    {files.map((file) => (
                      <div
                        key={file._id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.originalname}
                          </p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                        <div className="flex gap-2 ml-2">
                          {file.url && (
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-secondary text-sm"
                            >
                              Download
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteFile(file._id)}
                            className="btn-danger text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="files" className="label">
                  Add Files (Max 100MB total per note)
                </label>
                <input
                  id="files"
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="input file:btn file:mr-2"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Total size: {files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024 > 0
                    ? (files.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)
                    : '0'}{' '}
                  / 100 MB
                </p>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEditing ? 'Update Note' : 'Create Note'}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
