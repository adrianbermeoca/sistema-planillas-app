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
      campos: {
        Row: {
          created_at: string
          id: number
          nombre: string
          tipo_tenencia: Database["public"]["Enums"]["tipo_tenencia_enum"]
        }
        Insert: {
          created_at?: string
          id?: never
          nombre: string
          tipo_tenencia: Database["public"]["Enums"]["tipo_tenencia_enum"]
        }
        Update: {
          created_at?: string
          id?: never
          nombre?: string
          tipo_tenencia?: Database["public"]["Enums"]["tipo_tenencia_enum"]
        }
        Relationships: []
      }
      equipos: {
        Row: {
          bonificacion_uso_equipo: number | null
          created_at: string
          id: number
          nombre: string
          tipo: string | null
        }
        Insert: {
          bonificacion_uso_equipo?: number | null
          created_at?: string
          id?: never
          nombre: string
          tipo?: string | null
        }
        Update: {
          bonificacion_uso_equipo?: number | null
          created_at?: string
          id?: never
          nombre?: string
          tipo?: string | null
        }
        Relationships: []
      }
      labor: {
        Row: {
          created_at: string
          es_activo: boolean
          es_labor_generica: boolean
          id: number
          indicador_destajo: string | null
          metodo_pago: Database["public"]["Enums"]["metodo_pago_enum"]
          nombre_labor: string
          tarifa_destajo: number
        }
        Insert: {
          created_at?: string
          es_activo?: boolean
          es_labor_generica?: boolean
          id?: never
          indicador_destajo?: string | null
          metodo_pago: Database["public"]["Enums"]["metodo_pago_enum"]
          nombre_labor: string
          tarifa_destajo?: number
        }
        Update: {
          created_at?: string
          es_activo?: boolean
          es_labor_generica?: boolean
          id?: never
          indicador_destajo?: string | null
          metodo_pago?: Database["public"]["Enums"]["metodo_pago_enum"]
          nombre_labor?: string
          tarifa_destajo?: number
        }
        Relationships: []
      }
      lotes: {
        Row: {
          area_ha: number | null
          campo_id: number
          created_at: string
          id: number
          nombre: string
        }
        Insert: {
          area_ha?: number | null
          campo_id: number
          created_at?: string
          id?: never
          nombre: string
        }
        Update: {
          area_ha?: number | null
          campo_id?: number
          created_at?: string
          id?: never
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "lotes_campo_id_fkey"
            columns: ["campo_id"]
            isOneToOne: false
            referencedRelation: "campos"
            referencedColumns: ["id"]
          },
        ]
      }
      ordenes_de_trabajo: {
        Row: {
          created_at: string
          descripcion: string
          estado: string
          fecha_planificacion_fin: string | null
          fecha_planificacion_inicio: string
          id: number
          supervisor_id: string | null
        }
        Insert: {
          created_at?: string
          descripcion: string
          estado?: string
          fecha_planificacion_fin?: string | null
          fecha_planificacion_inicio: string
          id?: never
          supervisor_id?: string | null
        }
        Update: {
          created_at?: string
          descripcion?: string
          estado?: string
          fecha_planificacion_fin?: string | null
          fecha_planificacion_inicio?: string
          id?: never
          supervisor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ordenes_de_trabajo_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ot_labor_detalle: {
        Row: {
          created_at: string
          horas_estimadas: number | null
          id: number
          labor_id: number
          ot_id: number
          sublote_id: number
        }
        Insert: {
          created_at?: string
          horas_estimadas?: number | null
          id?: never
          labor_id: number
          ot_id: number
          sublote_id: number
        }
        Update: {
          created_at?: string
          horas_estimadas?: number | null
          id?: never
          labor_id?: number
          ot_id?: number
          sublote_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "ot_labor_detalle_labor_id_fkey"
            columns: ["labor_id"]
            isOneToOne: false
            referencedRelation: "labor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ot_labor_detalle_ot_id_fkey"
            columns: ["ot_id"]
            isOneToOne: false
            referencedRelation: "ordenes_de_trabajo"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ot_labor_detalle_sublote_id_fkey"
            columns: ["sublote_id"]
            isOneToOne: false
            referencedRelation: "sublotes"
            referencedColumns: ["id"]
          },
        ]
      }
      parametros_legales: {
        Row: {
          created_at: string
          descripcion: string | null
          fecha_fin_vigencia: string | null
          fecha_inicio_vigencia: string
          id: number
          tipo: Database["public"]["Enums"]["tipo_parametro_legal_enum"]
          valor: number
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          fecha_fin_vigencia?: string | null
          fecha_inicio_vigencia: string
          id?: never
          tipo: Database["public"]["Enums"]["tipo_parametro_legal_enum"]
          valor: number
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          fecha_fin_vigencia?: string | null
          fecha_inicio_vigencia?: string
          id?: never
          tipo?: Database["public"]["Enums"]["tipo_parametro_legal_enum"]
          valor?: number
        }
        Relationships: []
      }
      partes_diarios: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["estado_parte_diario_enum"]
          fecha_parte: string
          id: number
          supervisor_id: string
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_parte_diario_enum"]
          fecha_parte: string
          id?: never
          supervisor_id: string
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_parte_diario_enum"]
          fecha_parte?: string
          id?: never
          supervisor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partes_diarios_supervisor_id_fkey"
            columns: ["supervisor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          id: string
          nombre_completo: string | null
          rol: Database["public"]["Enums"]["rol_usuario_enum"]
        }
        Insert: {
          id: string
          nombre_completo?: string | null
          rol: Database["public"]["Enums"]["rol_usuario_enum"]
        }
        Update: {
          id?: string
          nombre_completo?: string | null
          rol?: Database["public"]["Enums"]["rol_usuario_enum"]
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
          id?: never
          nombre_puesto: string
          tarifa_base_dia?: number
        }
        Update: {
          created_at?: string
          es_activo?: boolean | null
          id?: never
          nombre_puesto?: string
          tarifa_base_dia?: number
        }
        Relationships: []
      }
      sistemas_pensiones: {
        Row: {
          id: number
          nombre: string
          tipo_sistema: string
        }
        Insert: {
          id?: never
          nombre: string
          tipo_sistema: string
        }
        Update: {
          id?: never
          nombre?: string
          tipo_sistema?: string
        }
        Relationships: []
      }
      sublotes: {
        Row: {
          created_at: string
          es_proyecto: boolean
          id: number
          lote_id: number
          nombre: string
          num_cilindros: number | null
          variedad_cultivo: string | null
        }
        Insert: {
          created_at?: string
          es_proyecto?: boolean
          id?: never
          lote_id: number
          nombre: string
          num_cilindros?: number | null
          variedad_cultivo?: string | null
        }
        Update: {
          created_at?: string
          es_proyecto?: boolean
          id?: never
          lote_id?: number
          nombre?: string
          num_cilindros?: number | null
          variedad_cultivo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sublotes_lote_id_fkey"
            columns: ["lote_id"]
            isOneToOne: false
            referencedRelation: "lotes"
            referencedColumns: ["id"]
          },
        ]
      }
      tareo_detalle: {
        Row: {
          bonificacion_adicional: number | null
          created_at: string
          equipo_id: number | null
          es_dia_excepcional: boolean | null
          factor_ajuste_dia: number | null
          horas_extras: number | null
          horas_imputadas: number | null
          id: number
          labor_id: number
          ot_labor_detalle_id: number | null
          parte_diario_id: number
          sublote_id: number
          trabajador_id: number
          trabajador_puesto_id: number | null
          unidad_avance: number | null
        }
        Insert: {
          bonificacion_adicional?: number | null
          created_at?: string
          equipo_id?: number | null
          es_dia_excepcional?: boolean | null
          factor_ajuste_dia?: number | null
          horas_extras?: number | null
          horas_imputadas?: number | null
          id?: never
          labor_id: number
          ot_labor_detalle_id?: number | null
          parte_diario_id: number
          sublote_id: number
          trabajador_id: number
          trabajador_puesto_id?: number | null
          unidad_avance?: number | null
        }
        Update: {
          bonificacion_adicional?: number | null
          created_at?: string
          equipo_id?: number | null
          es_dia_excepcional?: boolean | null
          factor_ajuste_dia?: number | null
          horas_extras?: number | null
          horas_imputadas?: number | null
          id?: never
          labor_id?: number
          ot_labor_detalle_id?: number | null
          parte_diario_id?: number
          sublote_id?: number
          trabajador_id?: number
          trabajador_puesto_id?: number | null
          unidad_avance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tareo_detalle_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareo_detalle_labor_id_fkey"
            columns: ["labor_id"]
            isOneToOne: false
            referencedRelation: "labor"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareo_detalle_ot_labor_detalle_id_fkey"
            columns: ["ot_labor_detalle_id"]
            isOneToOne: false
            referencedRelation: "ot_labor_detalle"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareo_detalle_parte_diario_id_fkey"
            columns: ["parte_diario_id"]
            isOneToOne: false
            referencedRelation: "partes_diarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareo_detalle_sublote_id_fkey"
            columns: ["sublote_id"]
            isOneToOne: false
            referencedRelation: "sublotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareo_detalle_trabajador_id_fkey"
            columns: ["trabajador_id"]
            isOneToOne: false
            referencedRelation: "trabajadores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tareo_detalle_trabajador_puesto_id_fkey"
            columns: ["trabajador_puesto_id"]
            isOneToOne: false
            referencedRelation: "trabajador_puestos"
            referencedColumns: ["id"]
          },
        ]
      }
      tasas_legales_progresivas: {
        Row: {
          created_at: string
          descripcion: string
          es_activo: boolean
          fecha_fin_vigencia: string | null
          fecha_inicio_vigencia: string
          id: number
          num_trabajadores_max: number | null
          num_trabajadores_min: number | null
          tasa_porcentaje: number
          tipo_tasa: Database["public"]["Enums"]["tipo_tasa_legal_enum"]
          ventas_uit_max: number | null
          ventas_uit_min: number | null
        }
        Insert: {
          created_at?: string
          descripcion: string
          es_activo?: boolean
          fecha_fin_vigencia?: string | null
          fecha_inicio_vigencia: string
          id?: never
          num_trabajadores_max?: number | null
          num_trabajadores_min?: number | null
          tasa_porcentaje: number
          tipo_tasa: Database["public"]["Enums"]["tipo_tasa_legal_enum"]
          ventas_uit_max?: number | null
          ventas_uit_min?: number | null
        }
        Update: {
          created_at?: string
          descripcion?: string
          es_activo?: boolean
          fecha_fin_vigencia?: string | null
          fecha_inicio_vigencia?: string
          id?: never
          num_trabajadores_max?: number | null
          num_trabajadores_min?: number | null
          tasa_porcentaje?: number
          tipo_tasa?: Database["public"]["Enums"]["tipo_tasa_legal_enum"]
          ventas_uit_max?: number | null
          ventas_uit_min?: number | null
        }
        Relationships: []
      }
      tasas_pensiones_vigencia: {
        Row: {
          fecha_inicio_vigencia: string
          id: number
          remuneracion_maxima_asegururable: number | null
          sistema_pension_id: number
          tasa_aporte_obligatorio_pct: number
          tasa_comision_flujo_pct: number
          tasa_comision_saldo_pct: number
          tasa_prima_seguro_pct: number
        }
        Insert: {
          fecha_inicio_vigencia: string
          id?: never
          remuneracion_maxima_asegururable?: number | null
          sistema_pension_id: number
          tasa_aporte_obligatorio_pct?: number
          tasa_comision_flujo_pct?: number
          tasa_comision_saldo_pct?: number
          tasa_prima_seguro_pct?: number
        }
        Update: {
          fecha_inicio_vigencia?: string
          id?: never
          remuneracion_maxima_asegururable?: number | null
          sistema_pension_id?: number
          tasa_aporte_obligatorio_pct?: number
          tasa_comision_flujo_pct?: number
          tasa_comision_saldo_pct?: number
          tasa_prima_seguro_pct?: number
        }
        Relationships: [
          {
            foreignKeyName: "tasas_pensiones_vigencia_sistema_pension_id_fkey"
            columns: ["sistema_pension_id"]
            isOneToOne: false
            referencedRelation: "sistemas_pensiones"
            referencedColumns: ["id"]
          },
        ]
      }
      tasas_sctr: {
        Row: {
          actividad_descripcion: string
          ciiu_codigo: string | null
          fecha_inicio_vigencia: string
          id: number
          tasa_pension_pct: number
          tasa_salud_pct: number
        }
        Insert: {
          actividad_descripcion: string
          ciiu_codigo?: string | null
          fecha_inicio_vigencia: string
          id?: never
          tasa_pension_pct?: number
          tasa_salud_pct?: number
        }
        Update: {
          actividad_descripcion?: string
          ciiu_codigo?: string | null
          fecha_inicio_vigencia?: string
          id?: never
          tasa_pension_pct?: number
          tasa_salud_pct?: number
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
          id?: never
          puesto_id: number
          tarifa_acordada: number
          trabajador_id: number
        }
        Update: {
          created_at?: string
          es_activo?: boolean
          fecha_fin?: string | null
          fecha_inicio?: string
          id?: never
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
          modalidad_principal: Database["public"]["Enums"]["modalidad_trabajador_enum"]
          nombre_completo: string
          opcion_pago_beneficios: Database["public"]["Enums"]["opcion_pago_beneficios_enum"]
          sistema_pension_id: number | null
          tiene_asignacion_familiar: boolean
          tipo_comision_afp:
            | Database["public"]["Enums"]["tipo_comision_afp_enum"]
            | null
        }
        Insert: {
          created_at?: string
          dni: string
          id?: never
          modalidad_principal: Database["public"]["Enums"]["modalidad_trabajador_enum"]
          nombre_completo: string
          opcion_pago_beneficios?: Database["public"]["Enums"]["opcion_pago_beneficios_enum"]
          sistema_pension_id?: number | null
          tiene_asignacion_familiar?: boolean
          tipo_comision_afp?:
            | Database["public"]["Enums"]["tipo_comision_afp_enum"]
            | null
        }
        Update: {
          created_at?: string
          dni?: string
          id?: never
          modalidad_principal?: Database["public"]["Enums"]["modalidad_trabajador_enum"]
          nombre_completo?: string
          opcion_pago_beneficios?: Database["public"]["Enums"]["opcion_pago_beneficios_enum"]
          sistema_pension_id?: number | null
          tiene_asignacion_familiar?: boolean
          tipo_comision_afp?:
            | Database["public"]["Enums"]["tipo_comision_afp_enum"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "trabajadores_sistema_pension_id_fkey"
            columns: ["sistema_pension_id"]
            isOneToOne: false
            referencedRelation: "sistemas_pensiones"
            referencedColumns: ["id"]
          },
        ]
      }
      tramos_impuesto_renta: {
        Row: {
          fecha_inicio_vigencia: string
          id: number
          limite_inferior_uit: number
          limite_superior_uit: number | null
          tasa_porcentaje: number
        }
        Insert: {
          fecha_inicio_vigencia: string
          id?: never
          limite_inferior_uit: number
          limite_superior_uit?: number | null
          tasa_porcentaje: number
        }
        Update: {
          fecha_inicio_vigencia?: string
          id?: never
          limite_inferior_uit?: number
          limite_superior_uit?: number | null
          tasa_porcentaje?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      crear_ot_completa: {
        Args: {
          descripcion_ot: string
          detalles: Database["public"]["CompositeTypes"]["ot_detalle_payload"][]
          fecha_fin: string
          fecha_inicio: string
        }
        Returns: Json
      }
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
      estado_parte_diario_enum: "Pendiente" | "Aprobado" | "Rechazado"
      metodo_pago_enum: "PorTiempo" | "PorDestajo"
      modalidad_laboral: "planilla" | "rh" | "eventual"
      modalidad_trabajador_enum: "Planilla" | "RH" | "Eventual"
      opcion_pago_beneficios_enum: "Prorrateado" | "Periodico"
      rol_usuario_enum:
        | "Coordinador de Operaciones"
        | "Supervisor de Campo"
        | "Coordinador"
        | "Supervisor"
        | "Gerente"
      tipo_comision_afp_enum: "flujo" | "mixta"
      tipo_parametro:
        | "rmv"
        | "tasa_bono_beta"
        | "tasa_gratificacion"
        | "tasa_cts"
        | "tasa_essalud_extra"
      tipo_parametro_legal_enum:
        | "RMV"
        | "Tasa Bono BETA"
        | "Tasa Gratificacion"
        | "Tasa CTS"
        | "Tasa EsSalud"
        | "Tasa ONP"
        | "Tasa AFP Flujo"
        | "Tasa HE 25"
        | "Tasa HE 35"
        | "UIT"
        | "BETA_PCT"
        | "GRATI_PCT"
        | "CTS_PCT"
        | "ASIGNACION_FAMILIAR"
      tipo_tasa_legal_enum: "ESSALUD" | "UTILIDADES"
      tipo_tenencia_enum: "Propio" | "Alquilado"
    }
    CompositeTypes: {
      ot_detalle_payload: {
        labor_id: number | null
        sublote_id: number | null
        horas_estimadas: number | null
      }
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
      estado_parte_diario_enum: ["Pendiente", "Aprobado", "Rechazado"],
      metodo_pago_enum: ["PorTiempo", "PorDestajo"],
      modalidad_laboral: ["planilla", "rh", "eventual"],
      modalidad_trabajador_enum: ["Planilla", "RH", "Eventual"],
      opcion_pago_beneficios_enum: ["Prorrateado", "Periodico"],
      rol_usuario_enum: [
        "Coordinador de Operaciones",
        "Supervisor de Campo",
        "Coordinador",
        "Supervisor",
        "Gerente",
      ],
      tipo_comision_afp_enum: ["flujo", "mixta"],
      tipo_parametro: [
        "rmv",
        "tasa_bono_beta",
        "tasa_gratificacion",
        "tasa_cts",
        "tasa_essalud_extra",
      ],
      tipo_parametro_legal_enum: [
        "RMV",
        "Tasa Bono BETA",
        "Tasa Gratificacion",
        "Tasa CTS",
        "Tasa EsSalud",
        "Tasa ONP",
        "Tasa AFP Flujo",
        "Tasa HE 25",
        "Tasa HE 35",
        "UIT",
        "BETA_PCT",
        "GRATI_PCT",
        "CTS_PCT",
        "ASIGNACION_FAMILIAR",
      ],
      tipo_tasa_legal_enum: ["ESSALUD", "UTILIDADES"],
      tipo_tenencia_enum: ["Propio", "Alquilado"],
    },
  },
} as const
