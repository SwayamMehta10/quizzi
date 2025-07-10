import { UserProfile } from "@/types/friends";

interface Topic {
  topic_id: string;
  name: string;
}

export interface Challenge {
  challenge_id: string;
  challenger_id: string;
  opponent_id: string;
  topic_id: string;
  status: string;
  created_at: string;
  challenger: UserProfile;
  opponent: UserProfile;
  topic: Topic;
}