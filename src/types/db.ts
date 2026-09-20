// NOTE: every domain shape below is a `type` alias, not an `interface`. Supabase-js's
// generic inference for .insert()/.update() (RejectExcessProperties, in
// @supabase/postgrest-js) does not resolve correctly when Row/Insert/Update reference
// an `interface` — it silently degrades to `never`. Plain object type aliases (or
// inline literals) work correctly, so we use those exclusively here even though the
// two are otherwise interchangeable for these flat shapes.

export type TafsirBookKey = "tabari" | "kathir" | "saadi" | "muyassar";

export type RevelationType = "meccan" | "medinan";

export type Surah = {
  id: number;
  name_ar: string;
  ayah_count: number;
  revelation_type: RevelationType;
};

export type Ayah = {
  surah: number;
  number: number;
  text: string;
  text_normalized: string;
};

export type TafsirBook = {
  id: number;
  key: TafsirBookKey;
  name_ar: string;
  author_ar: string;
  sort_order: number;
};

export type TafsirEntry = {
  id: number;
  book_id: number;
  surah: number;
  verse_from: number;
  verse_to: number;
  text: string;
  source_path: string;
  reviewed: boolean;
};

export type Profile = {
  id: string;
  display_name: string;
  preferred_books: TafsirBookKey[];
};

export type Project = {
  id: string;
  user_id: string;
  title: string;
  description: string;
  notes: string;
  created_at: string;
};

export type Chat = {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  created_at: string;
};

export type MessageRole = "user" | "assistant";

export type RouterIntent =
  | "search"
  | "no_result"
  | "out_of_scope"
  | "ruling_request"
  | "about_app"
  | "distress";

/** Reference-only payload: never a copy of verse/tafsir text (spec section 4/10). */
export type AnswerContent = {
  intent: RouterIntent;
  results?: {
    surah: number;
    ayah_from: number;
    ayah_to: number;
    book_ids: number[];
  }[];
};

export type UserMessageContent = {
  text: string;
};

export type MessageContent = UserMessageContent | AnswerContent;

export type Message = {
  id: string;
  chat_id: string;
  role: MessageRole;
  content_json: MessageContent;
  created_at: string;
};

export type SavedSource = {
  id: string;
  project_id: string;
  surah: number;
  ayah: number;
  book_id: number;
  created_at: string;
};

// Flat (non-intersection) *Insert shapes, one per table, matching what's actually
// optional on insert (defaults, generated ids/timestamps).
export type TafsirBookInsert = {
  id?: number;
  key: TafsirBookKey;
  name_ar: string;
  author_ar: string;
  sort_order: number;
};

export type TafsirEntryInsert = {
  id?: number;
  book_id: number;
  surah: number;
  verse_from: number;
  verse_to: number;
  text: string;
  source_path: string;
  reviewed?: boolean;
};

export type ProjectInsert = {
  id?: string;
  user_id: string;
  title: string;
  description?: string;
  notes?: string;
  created_at?: string;
};

export type ChatInsert = {
  id?: string;
  user_id: string;
  project_id?: string | null;
  title?: string;
  created_at?: string;
};

export type MessageInsert = {
  id?: string;
  chat_id: string;
  role: MessageRole;
  content_json: MessageContent;
  created_at?: string;
};

export type SavedSourceInsert = {
  id?: string;
  project_id: string;
  surah: number;
  ayah: number;
  book_id: number;
  created_at?: string;
};

export type Database = {
  public: {
    Views: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
    Functions: {
      search_verses_by_topic: {
        Args: {
          topic_normalized: string;
          p_book_ids: number[];
          match_limit?: number;
        };
        Returns: { surah: number; ayah: number; score: number }[];
      };
    };
    Tables: {
      surahs: { Row: Surah; Insert: Surah; Update: Partial<Surah>; Relationships: [] };
      ayahs: { Row: Ayah; Insert: Ayah; Update: Partial<Ayah>; Relationships: [] };
      tafsir_books: {
        Row: TafsirBook;
        Insert: TafsirBookInsert;
        Update: Partial<TafsirBook>;
        Relationships: [];
      };
      tafsir_entries: {
        Row: TafsirEntry;
        Insert: TafsirEntryInsert;
        Update: Partial<TafsirEntry>;
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: Profile;
        Update: Partial<Profile>;
        Relationships: [];
      };
      projects: {
        Row: Project;
        Insert: ProjectInsert;
        Update: Partial<Project>;
        Relationships: [];
      };
      chats: {
        Row: Chat;
        Insert: ChatInsert;
        Update: Partial<Chat>;
        Relationships: [
          {
            foreignKeyName: "chats_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
      messages: {
        Row: Message;
        Insert: MessageInsert;
        Update: Partial<Message>;
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey";
            columns: ["chat_id"];
            isOneToOne: false;
            referencedRelation: "chats";
            referencedColumns: ["id"];
          },
        ];
      };
      saved_sources: {
        Row: SavedSource;
        Insert: SavedSourceInsert;
        Update: Partial<SavedSource>;
        Relationships: [
          {
            foreignKeyName: "saved_sources_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          },
        ];
      };
    };
  };
};
