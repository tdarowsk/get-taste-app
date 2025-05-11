export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  graphql_public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  public: {
    Tables: {
      film_preferences: {
        Row: {
          cast: string[] | null;
          director: string | null;
          genres: string[] | null;
          screenwriter: string | null;
          user_id: string;
          liked_movies: string[] | null;
        };
        Insert: {
          cast?: string[] | null;
          director?: string | null;
          genres?: string[] | null;
          screenwriter?: string | null;
          user_id: string;
          liked_movies?: string[] | null;
        };
        Update: {
          cast?: string[] | null;
          director?: string | null;
          genres?: string[] | null;
          screenwriter?: string | null;
          user_id?: string;
          liked_movies?: string[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "film_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      item_feedback: {
        Row: {
          id: number;
          user_id: string;
          item_id: string;
          feedback_type: string;
          created_at: string;
          genre: string | null;
          artist: string | null;
          cast: string | null;
        };
        Insert: {
          id?: number;
          user_id: string;
          item_id: string;
          feedback_type: string;
          created_at?: string;
          genre?: string | null;
          artist?: string | null;
          cast?: string | null;
        };
        Update: {
          id?: number;
          user_id?: string;
          item_id?: string;
          feedback_type?: string;
          created_at?: string;
          genre?: string | null;
          artist?: string | null;
          cast?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "item_feedback_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      music_preferences: {
        Row: {
          artists: string[] | null;
          genres: string[] | null;
          user_id: string;
        };
        Insert: {
          artists?: string[] | null;
          genres?: string[] | null;
          user_id: string;
        };
        Update: {
          artists?: string[] | null;
          genres?: string[] | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "music_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      recommendations: {
        Row: {
          id: number;
          user_id: string;
          type: string;
          data: Json;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          type: string;
          data: Json;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          type?: string;
          data?: Json;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recommendations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      sessions: {
        Row: {
          created_at: string;
          id: number;
          token: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: number;
          token: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: number;
          token?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sessions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      spotify_data: {
        Row: {
          album_id: string | null;
          artist_id: string | null;
          created_at: string;
          data: Json | null;
          id: number;
          user_id: string;
        };
        Insert: {
          album_id?: string | null;
          artist_id?: string | null;
          created_at?: string;
          data?: Json | null;
          id?: number;
          user_id: string;
        };
        Update: {
          album_id?: string | null;
          artist_id?: string | null;
          created_at?: string;
          data?: Json | null;
          id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "spotify_data_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user2fa: {
        Row: {
          created_at: string;
          expires_at: string;
          id: number;
          user_id: string;
          verification_code: string;
          verified_at: string | null;
        };
        Insert: {
          created_at?: string;
          expires_at: string;
          id?: number;
          user_id: string;
          verification_code: string;
          verified_at?: string | null;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          id?: number;
          user_id?: string;
          verification_code?: string;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user2fa_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          email: string;
          id: string;
          nick: string;
          password_hash: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          email: string;
          id?: string;
          nick: string;
          password_hash: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          email?: string;
          id?: string;
          nick?: string;
          password_hash?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      seen_recommendations: {
        Row: {
          id: number;
          user_id: string;
          item_id: string;
          item_name: string;
          item_type: string;
          recommendation_id: number;
          type: string;
          created_at: string;
          feedback_type?: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          item_id: string;
          item_name: string;
          item_type: string;
          recommendation_id: number;
          type: string;
          created_at?: string;
          feedback_type?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          item_id?: string;
          item_name?: string;
          item_type?: string;
          recommendation_id?: number;
          type?: string;
          created_at?: string;
          feedback_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "seen_recommendations_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "seen_recommendations_recommendation_id_fkey";
            columns: ["recommendation_id"];
            isOneToOne: false;
            referencedRelation: "recommendations";
            referencedColumns: ["id"];
          },
        ];
      };
      recommendation_feedback: {
        Row: {
          id: number;
          user_id: string;
          recommendation_id: number;
          feedback_type: string;
          metadata: Json;
          created_at: string;
          content_id: string | null;
          content_type: string | null;
        };
        Insert: {
          id?: number;
          user_id: string;
          recommendation_id: number;
          feedback_type: string;
          metadata?: Json;
          created_at?: string;
          content_id?: string | null;
          content_type?: string | null;
        };
        Update: {
          id?: number;
          user_id?: string;
          recommendation_id?: number;
          feedback_type?: string;
          metadata?: Json;
          created_at?: string;
          content_id?: string | null;
          content_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "recommendation_feedback_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recommendation_feedback_recommendation_id_fkey";
            columns: ["recommendation_id"];
            isOneToOne: false;
            referencedRelation: "recommendations";
            referencedColumns: ["id"];
          },
        ];
      };
      movies_mapping: {
        Row: {
          movie_id: string;
          title: string;
          original_title: string | null;
          release_year: string | null;
          tmdb_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          movie_id: string;
          title: string;
          original_title?: string | null;
          release_year?: string | null;
          tmdb_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          movie_id?: string;
          title?: string;
          original_title?: string | null;
          release_year?: string | null;
          tmdb_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const;
