CREATE OR REPLACE FUNCTION insert_recommendation(p_user_id TEXT, p_type TEXT, p_data JSONB) 
RETURNS BIGINT AS $$
DECLARE
  v_id BIGINT;
BEGIN
  -- Force bypass RLS and insert data
  INSERT INTO recommendations (user_id, type, data)
  VALUES (p_user_id, p_type, p_data)
  RETURNING id INTO v_id;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 