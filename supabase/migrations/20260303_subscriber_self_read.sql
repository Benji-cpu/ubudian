-- Allow authenticated users to read their own newsletter subscriber record
CREATE POLICY "Users can read own subscription"
  ON newsletter_subscribers FOR SELECT
  TO authenticated
  USING (email = (SELECT email FROM profiles WHERE id = auth.uid()));
