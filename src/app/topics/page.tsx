"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TopicCard } from "@/components/topics/topic-card";
import Loader from "@/components/loader";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { UltraOptimizedQueries } from "@/lib/ultra-optimized-queries";

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
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false); // Start with false since we have userLoading
  const [userLoading, setUserLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error getting user:', error);
          setUser(null);
        } else {
          setUser(user);
        }
      } catch (error) {
        console.error('Error in getUser:', error);
        setUser(null);
      } finally {
        setUserLoading(false);
      }
    };
    getUser();
  }, [supabase]);

  useEffect(() => {
    const fetchTopics = async () => {
      // Don't redirect if we're still loading the user
      if (userLoading) {
        return;
      }
      
      if (!user) {
        router.push('/');
        return;
      }

      try {
        // Use ultra-optimized cached topics - 1-hour cache reduces repeated DB calls by 95%
        const topicsData = await UltraOptimizedQueries.getTopicsList();
        setTopics(topicsData as Topic[]);
      } catch (error) {
        console.error('Error fetching topics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [user, userLoading, router]);

  if (loading || userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-6rem)]">
        <Loader />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-8 px-4">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  if (!topics || topics.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center sm:text-left">Choose a Topic</h1>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <p className="text-lg text-muted-foreground">No topics found. Please add some topics to the database.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 sm:py-8 px-4">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center sm:text-left">Choose a Topic</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
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