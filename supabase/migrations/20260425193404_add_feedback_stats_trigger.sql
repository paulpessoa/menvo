-- Cria o trigger para recalcular estatísticas de mentor (rating e total de reviews)
-- Sempre que um feedback for aprovado, alterado ou deletado.

CREATE OR REPLACE FUNCTION public.handle_feedback_stats_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Se o status mudou para 'approved' ou se um feedback aprovado foi deletado/alterado
    IF (TG_OP = 'INSERT' AND NEW.status = 'approved') OR 
       (TG_OP = 'UPDATE' AND NEW.status = 'approved') OR
       (TG_OP = 'DELETE' AND OLD.status = 'approved') OR
       (TG_OP = 'UPDATE' AND OLD.status = 'approved' AND NEW.status != 'approved') THEN
        
        UPDATE public.profiles
        SET 
            average_rating = (
                SELECT COALESCE(AVG(rating), 0)
                FROM public.appointment_feedbacks
                WHERE reviewed_id = COALESCE(NEW.reviewed_id, OLD.reviewed_id) 
                AND status = 'approved'
            ),
            total_reviews = (
                SELECT COUNT(*)
                FROM public.appointment_feedbacks
                WHERE reviewed_id = COALESCE(NEW.reviewed_id, OLD.reviewed_id) 
                AND status = 'approved'
            )
        WHERE id = COALESCE(NEW.reviewed_id, OLD.reviewed_id);
    END IF;
    RETURN NULL;
END;
$$;

-- Criar o trigger na tabela de feedbacks
DROP TRIGGER IF EXISTS tr_update_mentor_stats ON public.appointment_feedbacks;
CREATE TRIGGER tr_update_mentor_stats
AFTER INSERT OR UPDATE OR DELETE ON public.appointment_feedbacks
FOR EACH ROW EXECUTE FUNCTION public.handle_feedback_stats_update();
