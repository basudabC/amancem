// ============================================================
// AMAN CEMENT CRM — Settings Page
// User profile and application settings
// ============================================================

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Lock,
  MapPin,
  Smartphone,
  Mail,
  Camera,
  Save,
  RefreshCw,
  CheckCircle2,
  Eye,
  EyeOff,
  LogOut,
  Moon,
  Sun,
  Globe,
  ChevronRight,
  Shield,
  HelpCircle,
  FileText,
  X
} from 'lucide-react';
import { toast } from 'sonner';

// Profile Section
function ProfileSection() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: '',
    email: user?.email || '',
  });

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Update form data when profile loads
  useState(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        email: profile.email || '',
      });
    }
  });

  const updateProfile = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.full_name,
          phone: data.phone,
        })
        .eq('id', user?.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });

  const uploadAvatar = useMutation({
    mutationFn: async (file: File) => {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) throw updateError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Avatar updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload avatar');
    },
  });

  const handleSave = async () => {
    setIsSaving(true);
    await updateProfile.mutateAsync(formData);
    setIsSaving(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatar.mutate(file);
    }
  };

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <div className="flex items-center gap-6">
        <div className="relative">
          <div className="w-24 h-24 bg-[#0F3460] rounded-full flex items-center justify-center overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-3xl text-[#F0F4F8] font-semibold">
                {formData.full_name.charAt(0).toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 w-8 h-8 bg-[#C41E3A] rounded-full flex items-center justify-center hover:bg-[#9B1830] transition-colors"
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-[#F0F4F8]">{formData.full_name}</h3>
          <p className="text-[#8B9CB8]">{user?.role?.replace('_', ' ')}</p>
          <p className="text-sm text-[#4A5B7A]">{profile?.employee_code}</p>
        </div>
      </div>

      {/* Form */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm text-[#8B9CB8]">Full Name</label>
          <input
            type="text"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            disabled={!isEditing}
            className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none disabled:opacity-50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-[#8B9CB8]">Email</label>
          <input
            type="email"
            value={formData.email}
            disabled
            className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#8B9CB8] disabled:opacity-50"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-[#8B9CB8]">Phone</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={!isEditing}
            className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none disabled:opacity-50"
            placeholder="+880..."
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-[#8B9CB8]">Employee Code</label>
          <input
            type="text"
            value={profile?.employee_code || ''}
            disabled
            className="w-full px-3 py-2 bg-[#061A3A] border border-white/10 rounded-lg text-[#8B9CB8] disabled:opacity-50"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {isEditing ? (
          <>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 text-[#8B9CB8] hover:text-[#F0F4F8] hover:bg-white/5 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-[#C41E3A] hover:bg-[#9B1830] text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0F3460] hover:bg-[#143874] text-[#F0F4F8] rounded-lg transition-colors"
          >
            <User className="w-4 h-4" />
            Edit Profile
          </button>
        )}
      </div>
    </div>
  );
}

// Security Section
function SecuritySection() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsChanging(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#061A3A] rounded-xl p-5">
        <h3 className="text-lg font-semibold text-[#F0F4F8] mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5 text-[#C41E3A]" />
          Change Password
        </h3>
        <div className="space-y-4 max-w-md">
          <div className="space-y-2">
            <label className="text-sm text-[#8B9CB8]">Current Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 bg-[#0A2A5C] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
              />
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B9CB8] hover:text-[#F0F4F8]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[#8B9CB8]">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#0A2A5C] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-[#8B9CB8]">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#0A2A5C] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
            />
          </div>
          <button
            onClick={changePassword}
            disabled={isChanging || !currentPassword || !newPassword || !confirmPassword}
            className="flex items-center gap-2 px-4 py-2 bg-[#C41E3A] hover:bg-[#9B1830] text-white rounded-lg transition-colors disabled:opacity-50"
          >
            {isChanging ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            Change Password
          </button>
        </div>
      </div>

      <div className="bg-[#061A3A] rounded-xl p-5">
        <h3 className="text-lg font-semibold text-[#F0F4F8] mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#2ECC71]" />
          Two-Factor Authentication
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#F0F4F8]">Enable 2FA</p>
            <p className="text-sm text-[#8B9CB8]">Add an extra layer of security to your account</p>
          </div>
          <button
            onClick={() => toast.info('2FA setup coming soon')}
            className="px-4 py-2 bg-[#0F3460] hover:bg-[#143874] text-[#F0F4F8] rounded-lg transition-colors"
          >
            Setup 2FA
          </button>
        </div>
      </div>
    </div>
  );
}

// Notifications Section
function NotificationsSection() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    visitReminders: true,
    dailySummary: true,
    conversionAlerts: true,
    targetAlerts: true,
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      {[
        { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive updates via email', icon: Mail },
        { key: 'pushNotifications', label: 'Push Notifications', description: 'Receive push notifications on your device', icon: Smartphone },
        { key: 'visitReminders', label: 'Visit Reminders', description: 'Get reminded about upcoming visits', icon: Bell },
        { key: 'dailySummary', label: 'Daily Summary', description: 'Receive a daily summary of your activities', icon: FileText },
        { key: 'conversionAlerts', label: 'Conversion Alerts', description: 'Get notified when customers convert', icon: CheckCircle2 },
        { key: 'targetAlerts', label: 'Target Alerts', description: 'Alerts when approaching or missing targets', icon: MapPin },
      ].map((item) => (
        <div key={item.key} className="flex items-center justify-between p-4 bg-[#061A3A] rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#0F3460] rounded-lg flex items-center justify-center">
              <item.icon className="w-5 h-5 text-[#3A9EFF]" />
            </div>
            <div>
              <p className="font-medium text-[#F0F4F8]">{item.label}</p>
              <p className="text-sm text-[#8B9CB8]">{item.description}</p>
            </div>
          </div>
          <button
            onClick={() => toggleSetting(item.key as any)}
            className={`relative w-12 h-6 rounded-full transition-colors ${settings[item.key as keyof typeof settings] ? 'bg-[#2ECC71]' : 'bg-[#4A5B7A]'
              }`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${settings[item.key as keyof typeof settings] ? 'left-7' : 'left-1'
              }`} />
          </button>
        </div>
      ))}
    </div>
  );
}

// App Preferences Section
function PreferencesSection() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') !== 'light';
  });
  const [language, setLanguage] = useState('en');

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    
    if (newDarkMode) {
      document.documentElement.classList.remove('light-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.add('light-mode');
      localStorage.setItem('theme', 'light');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-[#061A3A] rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0F3460] rounded-lg flex items-center justify-center">
            {darkMode ? <Moon className="w-5 h-5 text-[#9B6BFF]" /> : <Sun className="w-5 h-5 text-[#D4A843]" />}
          </div>
          <div>
            <p className="font-medium text-[#F0F4F8]">Dark Mode</p>
            <p className="text-sm text-[#8B9CB8]">Toggle between light and dark theme</p>
          </div>
        </div>
        <button
          onClick={toggleDarkMode}
          className={`relative w-12 h-6 rounded-full transition-colors ${darkMode ? 'bg-[#9B6BFF]' : 'bg-[#4A5B7A]'
            }`}
        >
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${darkMode ? 'left-7' : 'left-1'
            }`} />
        </button>
      </div>

      <div className="flex items-center justify-between p-4 bg-[#061A3A] rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0F3460] rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-[#2DD4BF]" />
          </div>
          <div>
            <p className="font-medium text-[#F0F4F8]">Language</p>
            <p className="text-sm text-[#8B9CB8]">Choose your preferred language</p>
          </div>
        </div>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-3 py-2 bg-[#0A2A5C] border border-white/10 rounded-lg text-[#F0F4F8] focus:border-[#3A9EFF] outline-none"
        >
          <option value="en">English</option>
          <option value="bn">বাংলা (Bengali)</option>
        </select>
      </div>
    </div>
  );
}

// About Section
function AboutSection() {
  const [view, setView] = useState<'main' | 'help' | 'privacy' | 'terms' | 'contact'>('main');

  if (view !== 'main') {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
        <button
          onClick={() => setView('main')}
          className="flex items-center gap-2 text-[#8B9CB8] hover:text-[#F0F4F8] transition-colors"
        >
          <ChevronRight className="w-5 h-5 rotate-180" />
          Back to About
        </button>

        {view === 'help' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-[#F0F4F8]">Help Center</h3>
            <div className="grid gap-4">
              <div className="bg-[#061A3A] p-5 rounded-xl border border-white/5">
                <h4 className="text-[#3A9EFF] font-semibold mb-2">How to schedule a visit?</h4>
                <p className="text-[#8B9CB8] text-sm">Navigate to the Visits tab, select a customer, and click the 'Schedule' button to pick a date and time.</p>
              </div>
              <div className="bg-[#061A3A] p-5 rounded-xl border border-white/5">
                <h4 className="text-[#2ECC71] font-semibold mb-2">How to add a new customer?</h4>
                <p className="text-[#8B9CB8] text-sm">Go to the Customers tab and click on the 'Add Customer' button at the top right of the page.</p>
              </div>
              <div className="bg-[#061A3A] p-5 rounded-xl border border-white/5">
                <h4 className="text-[#D4A843] font-semibold mb-2">Can I use the app offline?</h4>
                <p className="text-[#8B9CB8] text-sm">Currently, an active internet connection is required to sync data in real-time with the central server.</p>
              </div>
              <div className="bg-[#061A3A] p-5 rounded-xl border border-white/5">
                <h4 className="text-[#9B6BFF] font-semibold mb-2">Need priority support?</h4>
                <p className="text-[#8B9CB8] text-sm">Reach out via the Contact Support page for fast resolution of critical issues directly from the creator.</p>
              </div>
            </div>
          </div>
        )}

        {view === 'privacy' && (
          <div className="space-y-4 text-[#8B9CB8] text-sm leading-relaxed p-6 bg-[#061A3A] rounded-xl border border-white/5">
            <h3 className="text-xl font-bold text-[#F0F4F8] mb-4">Privacy Policy</h3>
            <p className="text-[#2ECC71] font-medium text-base mb-4">Strict Ownership & Data Confidentiality</p>
            <p>This software, Aman Cement CRM, is exclusively owned, developed, and maintained by <strong>Basudab Chowdhury Raj</strong>, an AI & Data Engineer specializing in modern business intelligence, machine learning, and secure scalable solutions.</p>
            <p>All data processed within this platform is handled with enterprise-grade security protocols. Information tracked—such as GPS coordinates for check-ins, sales metrics, and customer profiles—will only be utilized for internal analytic purposes. Data will never be sold to or exposed to unauthorized third parties.</p>
            <p>As an <strong>AI & BI Solutions Strategist</strong> building intelligent, data-driven systems, Basudab ensures the employment of advanced encryption and rigorous RLS (Row Level Security) at the database level to maintain complete confidentiality and system integrity.</p>
          </div>
        )}

        {view === 'terms' && (
          <div className="space-y-4 text-[#8B9CB8] text-sm leading-relaxed p-6 bg-[#061A3A] rounded-xl border border-white/5">
            <h3 className="text-xl font-bold text-[#F0F4F8] mb-4">Terms of Service</h3>
            <p className="text-[#D4A843] font-medium text-base mb-4">License and Usage</p>
            <p>This application explicitly belongs to <strong>Basudab Chowdhury Raj</strong>. By operating this CRM, users must abide by standard corporate IT policies regarding data modification and operational integrity.</p>
            <p>The code architecture, design systems, algorithms, and AI/BI integration pipelines are the strategic intellectual property of Basudab Chowdhury Raj. Any unauthorized reproduction, distribution, or reverse-engineering of this proprietary dashboard is strictly prohibited without direct written consent.</p>
            <p>System misuse, artificial GPS spoofing, and intentional data corruption will be auto-flagged by internal analytics and may result in immediate access revocation.</p>
          </div>
        )}

        {view === 'contact' && (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-[#F0F4F8]">Contact Support</h3>
            <div className="bg-gradient-to-br from-[#061A3A] to-[#0A2A5C] p-6 rounded-xl border border-white/10 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                <Shield className="w-48 h-48" />
              </div>
              <div className="relative z-10 space-y-6">
                <div>
                  <h4 className="text-2xl font-bold text-white mb-1">Basudab Chowdhury Raj</h4>
                  <p className="text-[#3A9EFF] font-medium">AI, Data Science & BI Solutions Strategist</p>
                  <p className="text-[#8B9CB8] text-sm mt-2 max-w-lg">
                    I build intelligent, data-driven systems that automate decisions and shape the future. Expert in LLMs, Computer Vision, Analytics, and scalable business process automation.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mt-6">
                  <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
                    <Mail className="w-5 h-5 text-[#C41E3A]" />
                    <a href="mailto:basudab.chowdhory@gmail.com" className="text-[#F0F4F8] hover:text-[#C41E3A] transition-colors text-sm truncate">
                      basudab.chowdhory@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5">
                    <Smartphone className="w-5 h-5 text-[#2ECC71]" />
                    <a href="tel:+8801750973483" className="text-[#F0F4F8] hover:text-[#2ECC71] transition-colors text-sm">
                      +88 01750 973483
                    </a>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/5 sm:col-span-2">
                    <MapPin className="w-5 h-5 text-[#D4A843]" />
                    <span className="text-[#F0F4F8] text-sm">
                      Dhaka, Bangladesh
                    </span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/5 p-4 rounded-lg border border-white/5 sm:col-span-2 justify-center hover:bg-white/10 transition-colors">
                    <a href="https://basudabch.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-[#3A9EFF] font-medium text-sm flex items-center gap-2">
                      <Globe className="w-4 h-4" /> View Full Portfolio & Expertise
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="w-20 h-20 bg-gradient-to-br from-[#C41E3A] to-[#9B1830] rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">AC</span>
        </div>
        <h2 className="text-2xl font-bold text-[#F0F4F8]">Aman Cement CRM</h2>
        <p className="text-[#8B9CB8]">Version 1.0.0</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setView('help')}
          className="flex items-center gap-3 p-4 bg-[#061A3A] rounded-xl hover:bg-[#0F3460] transition-colors text-left"
        >
          <HelpCircle className="w-5 h-5 text-[#3A9EFF]" />
          <div className="flex-1">
            <p className="font-medium text-[#F0F4F8]">Help Center</p>
            <p className="text-sm text-[#8B9CB8]">Get support and docs</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#8B9CB8]" />
        </button>

        <button
          onClick={() => setView('privacy')}
          className="flex items-center gap-3 p-4 bg-[#061A3A] rounded-xl hover:bg-[#0F3460] transition-colors text-left"
        >
          <FileText className="w-5 h-5 text-[#2ECC71]" />
          <div className="flex-1">
            <p className="font-medium text-[#F0F4F8]">Privacy Policy</p>
            <p className="text-sm text-[#8B9CB8]">Read our privacy policy</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#8B9CB8]" />
        </button>

        <button
          onClick={() => setView('terms')}
          className="flex items-center gap-3 p-4 bg-[#061A3A] rounded-xl hover:bg-[#0F3460] transition-colors text-left"
        >
          <Shield className="w-5 h-5 text-[#D4A843]" />
          <div className="flex-1">
            <p className="font-medium text-[#F0F4F8]">Terms of Service</p>
            <p className="text-sm text-[#8B9CB8]">Terms and conditions</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#8B9CB8]" />
        </button>

        <button
          onClick={() => setView('contact')}
          className="flex items-center gap-3 p-4 bg-[#061A3A] rounded-xl hover:bg-[#0F3460] transition-colors text-left"
        >
          <Mail className="w-5 h-5 text-[#C41E3A]" />
          <div className="flex-1">
            <p className="font-medium text-[#F0F4F8]">Contact Support</p>
            <p className="text-sm text-[#8B9CB8]">Get in touch</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#8B9CB8]" />
        </button>
      </div>

      <div className="text-center text-sm text-[#4A5B7A] mt-8">
        <p>© 2025 Basudab Chowdhury Raj. All rights reserved.</p>
        <p className="mt-1">Built with care for the Aman Cement team.</p>
      </div>
    </div>
  );
}

// Main Settings Page
export function Settings() {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'preferences' | 'about'>('profile');
  const { logout } = useAuthStore();

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'Preferences', icon: SettingsIcon },
    { id: 'about', label: 'About', icon: HelpCircle },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#F0F4F8]">Settings</h1>
          <p className="text-[#8B9CB8] text-sm mt-1">Manage your account and preferences</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 bg-[#E74C5E]/20 text-[#E74C5E] hover:bg-[#E74C5E]/30 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-white/10">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab.id
                ? 'border-[#C41E3A] text-[#F0F4F8]'
                : 'border-transparent text-[#8B9CB8] hover:text-[#F0F4F8]'
              }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-[#0A2A5C] rounded-xl p-6 border border-white/10 min-h-[400px]">
        {activeTab === 'profile' && <ProfileSection />}
        {activeTab === 'security' && <SecuritySection />}
        {activeTab === 'notifications' && <NotificationsSection />}
        {activeTab === 'preferences' && <PreferencesSection />}
        {activeTab === 'about' && <AboutSection />}
      </div>
    </div>
  );
}
