-- =================================================================
-- 1. CREAR FUNCIÓN TRANSACCIONAL PARA ORDEN DE TRABAJO (CU-006)
-- =================================================================

-- Primero, definimos un tipo para el payload de los detalles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ot_detalle_payload') THEN
        CREATE TYPE public.ot_detalle_payload AS (
            labor_id BIGINT,
            sublote_id BIGINT,
            horas_estimadas NUMERIC
        );
    END IF;
END$$;

-- Ahora, la función principal
CREATE OR REPLACE FUNCTION public.crear_ot_completa(
    descripcion_ot TEXT,
    fecha_inicio DATE,
    fecha_fin DATE,
    detalles ot_detalle_payload[]
)
RETURNS JSONB -- Devolverá la OT creada con sus detalles
LANGUAGE plpgsql
AS $$
DECLARE
    nueva_ot_id BIGINT;
    ot_creada ordenes_de_trabajo;
    detalles_creados JSONB;
BEGIN
    -- Validar que haya detalles
    IF array_length(detalles, 1) IS NULL OR array_length(detalles, 1) = 0 THEN
        RAISE EXCEPTION 'La orden de trabajo debe tener al menos un detalle de labor.';
    END IF;

    -- PASO 1: Insertar la cabecera de la OT
    INSERT INTO public.ordenes_de_trabajo (descripcion, fecha_planificacion_inicio, fecha_planificacion_fin, estado)
    VALUES (descripcion_ot, fecha_inicio, fecha_fin, 'Pendiente')
    RETURNING id INTO nueva_ot_id;

    -- PASO 2: Insertar los detalles asociándolos con el ID de la cabecera
    INSERT INTO public.ot_labor_detalle (ot_id, labor_id, sublote_id, horas_estimadas)
    SELECT
        nueva_ot_id,
        d.labor_id,
        d.sublote_id,
        d.horas_estimadas
    FROM unnest(detalles) AS d;

    -- PASO 3: Recuperar la OT y sus detalles para devolverlos
    SELECT * INTO ot_creada FROM public.ordenes_de_trabajo WHERE id = nueva_ot_id;

    SELECT jsonb_agg(d) INTO detalles_creados
    FROM (
        SELECT id, ot_id, labor_id, sublote_id, horas_estimadas
        FROM public.ot_labor_detalle
        WHERE ot_id = nueva_ot_id
    ) d;

    -- Devolver un objeto JSON combinado
    RETURN jsonb_build_object(
        'ot', to_jsonb(ot_creada),
        'detalles', detalles_creados
    );
END;
$$;

COMMENT ON FUNCTION public.crear_ot_completa(TEXT, DATE, DATE, ot_detalle_payload[]) IS 'Crea una Orden de Trabajo y sus detalles de forma transaccional (CU-006).';