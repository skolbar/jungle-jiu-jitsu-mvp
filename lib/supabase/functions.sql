-- Function to increment total_classes count
CREATE OR REPLACE FUNCTION increment_total_classes(student_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET total_classes = total_classes + 1
  WHERE id = student_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
