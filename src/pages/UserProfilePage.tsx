import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Award, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';

export const UserProfilePage: React.FC = () => {
  const { user, profile, refreshUserData } = useAuth();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    mobileNumber: user?.mobileNumber || '',
    bio: profile?.bio || '',
    city: profile?.city || '',
    skills: profile?.skills || '',
    education: profile?.education || '',
    idDocumentType: profile?.idDocumentType || 'CNIC',
    idDocumentNumber: profile?.idDocumentNumber || '',
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && profile) {
      setFormData({
        fullName: user.fullName || '',
        mobileNumber: user.mobileNumber || '',
        bio: profile.bio || '',
        city: profile.city || '',
        skills: profile.skills || '',
        education: profile.education || '',
        idDocumentType: profile.idDocumentType || 'CNIC',
        idDocumentNumber: profile.idDocumentNumber || '',
      });
    }
  }, [user, profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      await apiRequest('/api/profile', {
        method: 'PUT',
        body: JSON.stringify(formData),
      });

      await refreshUserData();
      setSuccess('Profile details saved successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-100 tracking-tight">User Profile & Performer Credentials</h2>
          <p className="text-xs sm:text-sm text-stone-400 mt-1">
            Maintain your skill qualifications and contact details for premium task matching.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-800 text-emerald-400 text-xs font-semibold self-start sm:self-auto">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Verified Performer</span>
        </div>
      </div>

      {success && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Identity Information */}
        <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
          <h3 className="text-sm font-bold text-stone-200 uppercase tracking-wider">
            Identity & Contact Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-1.5">
                Full Name
              </label>
              <input
                id="profile-fullname"
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-1.5">
                Registered Email (Permanent)
              </label>
              <input
                id="profile-email"
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 bg-stone-950/50 border border-stone-800 rounded-lg text-sm text-stone-400 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-1.5">
                Mobile Number
              </label>
              <input
                id="profile-mobile"
                type="tel"
                name="mobileNumber"
                required
                value={formData.mobileNumber}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-1.5">
                City / Region
              </label>
              <input
                id="profile-city"
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Lahore, Islamabad, Karachi"
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-400 mb-1.5">
              Performer Bio / Professional Summary
            </label>
            <textarea
              id="profile-bio"
              name="bio"
              rows={3}
              value={formData.bio}
              onChange={handleChange}
              placeholder="Brief description of your background, languages, and technical strengths..."
              className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Task Skills & Qualifications */}
        <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
          <h3 className="text-sm font-bold text-stone-200 uppercase tracking-wider">
            Skills & Education
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-1.5">
                Primary Task Competencies
              </label>
              <input
                id="profile-skills"
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="Data Validation, QA Testing, Transcription, Surveys"
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-1.5">
                Highest Completed Education
              </label>
              <input
                id="profile-education"
                type="text"
                name="education"
                value={formData.education}
                onChange={handleChange}
                placeholder="e.g. Bachelor in Computer Science / Intermediate"
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* KYC / ID Verification Information */}
        <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-200 uppercase tracking-wider">
              Identity Verification (KYC)
            </h3>
            <span className="text-[11px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-sm border border-emerald-800/60">
              {profile?.isKycVerified ? 'Verified' : 'Optional for micro-tasks below 10,000 PKR'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-1.5">
                Document Type
              </label>
              <select
                id="profile-doc-type"
                name="idDocumentType"
                value={formData.idDocumentType}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 focus:outline-hidden focus:border-emerald-500"
              >
                <option value="CNIC">National ID Card (CNIC / Smart Card)</option>
                <option value="Passport">Passport</option>
                <option value="DrivingLicense">Driving License</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-400 mb-1.5">
                Document Number
              </label>
              <input
                id="profile-doc-number"
                type="text"
                name="idDocumentNumber"
                value={formData.idDocumentNumber}
                onChange={handleChange}
                placeholder="35202-XXXXXXXX-X"
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-lg text-sm text-stone-100 placeholder-stone-500 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            id="profile-save-btn"
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-stone-700 text-stone-950 font-bold text-sm shadow-sm transition-all"
          >
            {saving ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
