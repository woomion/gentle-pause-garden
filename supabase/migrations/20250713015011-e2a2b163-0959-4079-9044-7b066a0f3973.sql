-- Create a table to track read status of comments
CREATE TABLE public.comment_read_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  comment_id UUID NOT NULL,
  item_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, comment_id)
);

-- Enable Row Level Security
ALTER TABLE public.comment_read_status ENABLE ROW LEVEL SECURITY;

-- Create policies for read status
CREATE POLICY "Users can view their own read status" 
ON public.comment_read_status 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own read status" 
ON public.comment_read_status 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own read status" 
ON public.comment_read_status 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Add foreign key constraint
ALTER TABLE public.comment_read_status 
ADD CONSTRAINT comment_read_status_comment_id_fkey 
FOREIGN KEY (comment_id) REFERENCES public.item_comments(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX idx_comment_read_status_user_item ON public.comment_read_status(user_id, item_id);
CREATE INDEX idx_comment_read_status_user_comment ON public.comment_read_status(user_id, comment_id);