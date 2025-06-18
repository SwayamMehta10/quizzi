export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      topics: {
        Row: {
          id: string
          name: string
          description: string | null
          icon_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          icon_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          icon_url?: string | null
          created_at?: string
        }
        Relationships: []
      },
      questions: {
        Row: {
          id: string
          topic_id: string
          question_text: string
          correct_answer: string
          wrong_answers: string[]
          created_at: string
        }
        Insert: {
          id?: string
          topic_id: string
          question_text: string
          correct_answer: string
          wrong_answers: string[]
          created_at?: string
        }
        Update: {
          id?: string
          topic_id?: string
          question_text?: string
          correct_answer?: string
          wrong_answers?: string[]
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          }
        ]
      },
      matches: {
        Row: {
          id: string
          topic_id: string
          started_at: string
          ended_at: string | null
          status: 'waiting' | 'active' | 'completed'
        }
        Insert: {
          id?: string
          topic_id: string
          started_at?: string
          ended_at?: string | null
          status?: 'waiting' | 'active' | 'completed'
        }
        Update: {
          id?: string
          topic_id?: string
          started_at?: string
          ended_at?: string | null
          status?: 'waiting' | 'active' | 'completed'
        }
        Relationships: [
          {
            foreignKeyName: "matches_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          }
        ]
      },
      match_participants: {
        Row: {
          id: string
          match_id: string
          user_id: string
          score: number
          joined_at: string
          is_winner: boolean
        }
        Insert: {
          id?: string
          match_id: string
          user_id: string
          score?: number
          joined_at?: string
          is_winner?: boolean
        }
        Update: {
          id?: string
          match_id?: string
          user_id?: string
          score?: number
          joined_at?: string
          is_winner?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "match_participants_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "match_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      },
      answers: {
        Row: {
          id: string
          match_id: string
          user_id: string
          question_id: string
          selected_answer: string
          is_correct: boolean
          answered_at: string
        }
        Insert: {
          id?: string
          match_id: string
          user_id: string
          question_id: string
          selected_answer: string
          is_correct: boolean
          answered_at?: string
        }
        Update: {
          id?: string
          match_id?: string
          user_id?: string
          question_id?: string
          selected_answer?: string
          is_correct?: boolean
          answered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          }
        ]
      },
      users: {
        Row: {
          id: string
          username: string
          email: string
          avatar_url: string | null
          country: string | null
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          email: string
          avatar_url?: string | null
          country?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          email?: string
          avatar_url?: string | null
          country?: string | null
          created_at?: string
        }
        Relationships: []
      },
      user_topic_xp: {
        Row: {
          id: string
          user_id: string
          topic_id: string
          xp: number
          level: number
        }
        Insert: {
          id?: string
          user_id: string
          topic_id: string
          xp?: number
          level?: number
        }
        Update: {
          id?: string
          user_id?: string
          topic_id?: string
          xp?: number
          level?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_topic_xp_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_topic_xp_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          }
        ]
      }
    },
    Views: {
      global_leaderboard: {
        Row: {
          user_id: string
          total_xp: number
        }
        Relationships: [
          {
            foreignKeyName: "global_leaderboard_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
