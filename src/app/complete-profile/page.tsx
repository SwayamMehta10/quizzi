"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileSetupForm } from "@/features/auth/profile-setup-form";
import { ProfileSetupValues } from "@/features/auth/schemas";
import { createClient } from "@/utils/supabase/client";
import { notify } from "@/lib/notifications";

export default function CompleteProfilePage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleProfileSetup = async (values: ProfileSetupValues) => {
    setLoading(true);
    
    try {
      // Get the current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        notify.error("Authentication error. Please try logging in again.");
        return;
      }

      // Prepare the profile data
      const profileData = {
        id: user.id,
        username: values.username,
        dob: values.dob.toISOString().split('T')[0],
        gender: values.gender,
        country: values.country,
        avatar_url: values.profilePicture || null,
        email: user.email,
        updated_at: new Date().toISOString(),
      };

      // Insert or update the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(profileData, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('Profile setup error:', profileError);
        notify.error("Failed to save profile. Please try again.");
        return;
      }

      // Success - redirect to main app
      router.push('/');
    } catch (error) {
      console.error('Unexpected error during profile setup:', error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Complete Your Profile</h1>
          <p className="text-muted-foreground">
            Let&apos;s set up your profile to get started with Quizzi!
          </p>
        </div>
        
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <ProfileSetupForm 
            onSubmit={handleProfileSetup}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}
