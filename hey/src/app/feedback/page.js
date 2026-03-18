'use client';

import { useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/DashboardLayout';

export default function FeedbackPage() {
  const [formData, setFormData] = useState({
    rating: 5,
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'rating' ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.post('/api/feedback', formData);
      setSuccess('Thank you for your feedback!');
      setFormData({ rating: 5, message: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error submitting feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Feedback</h1>
          <p className="text-gray-600 mt-2">
            We'd love to hear what you think about Hey!
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="card space-y-6">
          {/* Rating */}
          <div>
            <label htmlFor="rating" className="label">
              How would you rate Hey? ⭐
            </label>
            <select
              id="rating"
              name="rating"
              value={formData.rating}
              onChange={handleChange}
              className="input"
            >
              <option value={1}>1 - Poor</option>
              <option value={2}>2 - Fair</option>
              <option value={3}>3 - Good</option>
              <option value={4}>4 - Very Good</option>
              <option value={5}>5 - Excellent</option>
            </select>
          </div>

          {/* Message */}
          <div>
            <label htmlFor="message" className="label">
              Your Feedback
            </label>
            <textarea
              id="message"
              name="message"
              required
              value={formData.message}
              onChange={handleChange}
              className="input h-32 resize-none"
              placeholder="Tell us what you think... What features would you like? What can we improve?"
            />
            <p className="text-xs text-gray-500 mt-2">
              Minimum 10 characters
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50 w-full"
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>

        {/* Info */}
        <div className="card bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-700">
            💡 Your feedback helps us improve Hey and provide a better experience for all users.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
