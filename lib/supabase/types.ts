export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          name: string;
          parent_name: string;
          time_slot: string;
          day_of_week: "sat" | "sun";
          payment_status: "paid" | "unpaid";
          course_type: "regular" | "trial";
          parent_email: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["students"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["students"]["Insert"]>;
      };
      sessions: {
        Row: {
          id: string;
          student_id: string;
          total_classes: number;
          start_date: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["sessions"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["sessions"]["Insert"]>;
      };
      attendance: {
        Row: {
          id: string;
          student_id: string;
          session_id: string;
          attended_date: string;
          is_makeup: boolean;
          is_cancelled: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["attendance"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["attendance"]["Insert"]>;
      };
    };
    Views: {
      session_progress: {
        Row: {
          student_id: string;
          student_name: string;
          session_id: string;
          total_classes: number;
          start_date: string;
          attended_count: number;
        };
      };
    };
  };
}

export type Student = Database["public"]["Tables"]["students"]["Row"];
export type Session = Database["public"]["Tables"]["sessions"]["Row"];
export type Attendance = Database["public"]["Tables"]["attendance"]["Row"];
export type SessionProgress = Database["public"]["Views"]["session_progress"]["Row"];
