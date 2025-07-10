"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { TopicCard } from "@/components/topics/topic-card";
import { User } from "@supabase/supabase-js";

interface Topic {
  topic_id: string;
  name: string;
  icon_url: string;
  description?: string;
  difficulty?: string;
  category?: string;
  created_at: string;
  updated_at: string;
}

export default function TopicsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuthAndFetchTopics = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/');
        return;
      }
      setUser(user);

      // Fetch topics
      const { data: topicsData, error } = await supabase
        .from('topics')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching topics:', error);
      } else {
        setTopics(topicsData || []);
      }

      setLoading(false);
    };

    checkAuthAndFetchTopics();
  }, [supabase, router]);

  if (loading) {
    return <div className="container py-12 md:py-8">Loading...</div>;
  }

  if (!user) {
    return <div className="container py-12 md:py-8">Please log in to access this page.</div>;
  }

  if (!topics || topics.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Choose a Topic</h1>
        <p className="text-muted-foreground">No topics found. Please add some topics to the database.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Choose a Topic</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-5">
        {topics.map((topic) => (
          <TopicCard 
            key={topic.topic_id} 
            name={topic.name} 
            iconUrl={topic.icon_url}
            topicId={topic.topic_id}
          />
        ))}
      </div>
    </div>
  );
}