export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      parametros_legales: {
        Row: {
          created_at: string
          descripcion: string | null
          fecha_fin_vigencia: string | null
          fecha_inicio_vigencia: string
          id: number
          tipo: Database["public"]["Enums"]["tipo_parametro"]
          valor: number
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          fecha_fin_vigencia?: string | null
          fecha_inicio_vigencia: string
          id?: number
          tipo: Database["public"]["Enums"]["tipo_parametro"]
          valor: number
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          fecha_fin_vigencia?: string | null
          fecha_inicio_vigencia?: string
          id?: number
          tipo?: Database["public"]["Enums"]["tipo_parametro"]
          valor?: number
        }
        Relationships: []
      }
      pruebas: {
        Row: {
          created_at: string
          id: number
          mensaje: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          mensaje?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          mensaje?: string | null
        }
        Relationships: []
      }
      puestos_de_trabajo: {
        Row: {
          created_at: string
          es_activo: boolean | null
          id: number
          nombre_puesto: string
          tarifa_base_dia: number
        }
        Insert: {
          created_at?: string
          es_activo?: boolean | null
          id?: number
          nombre_puesto: string
          tarifa_base_dia?: number
        }
        Update: {
          created_at?: string
          es_activo?: boolean | null
          id?: number
          nombre_puesto?: string
          tarifa_base_dia?: number
        }
        Relationships: []
      }
      trabajador_puestos: {
        Row: {
          created_at: string
          es_activo: boolean
          fecha_fin: string | null
          fecha_inicio: string
          id: number
          puesto_id: number
          tarifa_acordada: number
          trabajador_id: number
        }
        Insert: {
          created_at?: string
          es_activo?: boolean
          fecha_fin?: string | null
          fecha_inicio: string
          id?: number
          puesto_id: number
          tarifa_acordada: number
          trabajador_id: number
        }
        Update: {
          created_at?: string
          es_activo?: boolean
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: number
          puesto_id?: number
          tarifa_acordada?: number
          trabajador_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "trabajador_puestos_puesto_id_fkey"
            columns: ["puesto_id"]
            isOneToOne: false
            referencedRelation: "puestos_de_trabajo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trabajador_puestos_trabajador_id_fkey"
            columns: ["trabajador_id"]
            isOneToOne: false
            referencedRelation: "trabajadores"
            referencedColumns: ["id"]
          },
        ]
      }
      trabajadores: {
        Row: {
          created_at: string
          dni: string
          id: number
          modalidad_principal: Database["public"]["Enums"]["modalidad_laboral"]
          nombre_completo: string
        }
        Insert: {
          created_at?: string
          dni: string
          id?: number
          modalidad_principal: Database["public"]["Enums"]["modalidad_laboral"]
          nombre_completo: string
        }
        Update: {
          created_at?: string
          dni?: string
          id?: number
          modalidad_principal?: Database["public"]["Enums"]["modalidad_laboral"]
          nombre_completo?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      color_source:
        | "99COLORS_NET"
        | "ART_PAINTS_YG07S"
        | "BYRNE"
        | "CRAYOLA"
        | "CMYK_COLOR_MODEL"
        | "COLORCODE_IS"
        | "COLORHEXA"
        | "COLORXS"
        | "CORNELL_UNIVERSITY"
        | "COLUMBIA_UNIVERSITY"
        | "DUKE_UNIVERSITY"
        | "ENCYCOLORPEDIA_COM"
        | "ETON_COLLEGE"
        | "FANTETTI_AND_PETRACCHI"
        | "FINDTHEDATA_COM"
        | "FERRARIO_1919"
        | "FEDERAL_STANDARD_595"
        | "FLAG_OF_INDIA"
        | "FLAG_OF_SOUTH_AFRICA"
        | "GLAZEBROOK_AND_BALDRY"
        | "GOOGLE"
        | "HEXCOLOR_CO"
        | "ISCC_NBS"
        | "KELLY_MOORE"
        | "MATTEL"
        | "MAERZ_AND_PAUL"
        | "MILK_PAINT"
        | "MUNSELL_COLOR_WHEEL"
        | "NATURAL_COLOR_SYSTEM"
        | "PANTONE"
        | "PLOCHERE"
        | "POURPRE_COM"
        | "RAL"
        | "RESENE"
        | "RGB_COLOR_MODEL"
        | "THOM_POOLE"
        | "UNIVERSITY_OF_ALABAMA"
        | "UNIVERSITY_OF_CALIFORNIA_DAVIS"
        | "UNIVERSITY_OF_CAMBRIDGE"
        | "UNIVERSITY_OF_NORTH_CAROLINA"
        | "UNIVERSITY_OF_TEXAS_AT_AUSTIN"
        | "X11_WEB"
        | "XONA_COM"
      modalidad_laboral: "planilla" | "rh" | "eventual"
      tipo_parametro:
        | "rmv"
        | "tasa_bono_beta"
        | "tasa_gratificacion"
        | "tasa_cts"
        | "tasa_essalud_extra"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      color_source: [
        "99COLORS_NET",
        "ART_PAINTS_YG07S",
        "BYRNE",
        "CRAYOLA",
        "CMYK_COLOR_MODEL",
        "COLORCODE_IS",
        "COLORHEXA",
        "COLORXS",
        "CORNELL_UNIVERSITY",
        "COLUMBIA_UNIVERSITY",
        "DUKE_UNIVERSITY",
        "ENCYCOLORPEDIA_COM",
        "ETON_COLLEGE",
        "FANTETTI_AND_PETRACCHI",
        "FINDTHEDATA_COM",
        "FERRARIO_1919",
        "FEDERAL_STANDARD_595",
        "FLAG_OF_INDIA",
        "FLAG_OF_SOUTH_AFRICA",
        "GLAZEBROOK_AND_BALDRY",
        "GOOGLE",
        "HEXCOLOR_CO",
        "ISCC_NBS",
        "KELLY_MOORE",
        "MATTEL",
        "MAERZ_AND_PAUL",
        "MILK_PAINT",
        "MUNSELL_COLOR_WHEEL",
        "NATURAL_COLOR_SYSTEM",
        "PANTONE",
        "PLOCHERE",
        "POURPRE_COM",
        "RAL",
        "RESENE",
        "RGB_COLOR_MODEL",
        "THOM_POOLE",
        "UNIVERSITY_OF_ALABAMA",
        "UNIVERSITY_OF_CALIFORNIA_DAVIS",
        "UNIVERSITY_OF_CAMBRIDGE",
        "UNIVERSITY_OF_NORTH_CAROLINA",
        "UNIVERSITY_OF_TEXAS_AT_AUSTIN",
        "X11_WEB",
        "XONA_COM",
      ],
      modalidad_laboral: ["planilla", "rh", "eventual"],
      tipo_parametro: [
        "rmv",
        "tasa_bono_beta",
        "tasa_gratificacion",
        "tasa_cts",
        "tasa_essalud_extra",
      ],
    },
  },
} as const
