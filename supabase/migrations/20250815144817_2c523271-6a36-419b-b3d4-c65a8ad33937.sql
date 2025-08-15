-- Call the test reminder function with updated code
SELECT
  net.http_post(
      url:='https://cnjznmbgxprsrovmdywe.supabase.co/functions/v1/send-test-reminder',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuanpubWJneHByc3Jvdm1keXdlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNjI2NDIsImV4cCI6MjA2NDYzODY0Mn0._JiyhTGq-nUGBNu28EzvA2ye6udS9NP2jKWMOA5JB1A"}'::jsonb,
      body:='{"email": "woodsmiche@gmail.com"}'::jsonb
  ) as request_id;