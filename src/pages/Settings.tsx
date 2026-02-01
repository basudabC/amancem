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
    full_name: user?.name || '',
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
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings[item.key as keyof typeof settings] ? 'bg-[#2ECC71]' : 'bg-[#4A5B7A]'
            }`}
          >
            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
              settings[item.key as keyof typeof settings] ? 'left-7' : 'left-1'
            }`} />
          </button>
        </div>
      ))}
    </div>
  );
}

// App Preferences Section
function PreferencesSection() {
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState('en');

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
          onClick={() => setDarkMode(!darkMode)}
          className={`relative w-12 h-6 rounded-full transition-colors ${
            darkMode ? 'bg-[#9B6BFF]' : 'bg-[#4A5B7A]'
          }`}
        >
          <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
            darkMode ? 'left-7' : 'left-1'
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
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); toast.info('Help center coming soon'); }}
          className="flex items-center gap-3 p-4 bg-[#061A3A] rounded-xl hover:bg-[#0F3460] transition-colors"
        >
          <HelpCircle className="w-5 h-5 text-[#3A9EFF]" />
          <div>
            <p className="font-medium text-[#F0F4F8]">Help Center</p>
            <p className="text-sm text-[#8B9CB8]">Get support and documentation</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#8B9CB8] ml-auto" />
        </a>

        <a
          href="#"
          onClick={(e) => { e.preventDefault(); toast.info('Privacy policy coming soon'); }}
          className="flex items-center gap-3 p-4 bg-[#061A3A] rounded-xl hover:bg-[#0F3460] transition-colors"
        >
          <FileText className="w-5 h-5 text-[#2ECC71]" />
          <div>
            <p className="font-medium text-[#F0F4F8]">Privacy Policy</p>
            <p className="text-sm text-[#8B9CB8]">Read our privacy policy</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#8B9CB8] ml-auto" />
        </a>

        <a
          href="#"
          onClick={(e) => { e.preventDefault(); toast.info('Terms of service coming soon'); }}
          className="flex items-center gap-3 p-4 bg-[#061A3A] rounded-xl hover:bg-[#0F3460] transition-colors"
        >
          <Shield className="w-5 h-5 text-[#D4A843]" />
          <div>
            <p className="font-medium text-[#F0F4F8]">Terms of Service</p>
            <p className="text-sm text-[#8B9CB8]">Read our terms and conditions</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#8B9CB8] ml-auto" />
        </a>

        <a
          href="#"
          onClick={(e) => { e.preventDefault(); toast.info('Contact support: support@aman-cement.com'); }}
          className="flex items-center gap-3 p-4 bg-[#061A3A] rounded-xl hover:bg-[#0F3460] transition-colors"
        >
          <Mail className="w-5 h-5 text-[#C41E3A]" />
          <div>
            <p className="font-medium text-[#F0F4F8]">Contact Support</p>
            <p className="text-sm text-[#8B9CB8]">Get in touch with our team</p>
          </div>
          <ChevronRight className="w-5 h-5 text-[#8B9CB8] ml-auto" />
        </a>
      </div>

      <div className="text-center text-sm text-[#4A5B7A]">
        <p>© 2024 Aman Cement Mills Ltd. All rights reserved.</p>
        <p className="mt-1">Built with care for the Aman Cement sales team.</p>
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
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id
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
