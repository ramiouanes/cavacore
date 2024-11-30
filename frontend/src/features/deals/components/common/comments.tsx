import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Reply, MoreVertical, Edit, Trash, Send } from 'lucide-react';
import { useDealComments } from '../../hooks/common/use-deal-comments';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/contexts/auth-context';
import { Badge } from '@/components/ui/badge';

interface CommentProps {
  comment: {
    id: string;
    content: string;
    createdBy: string;
    createdAt: Date;
    replies?: CommentProps['comment'][];
  };
  onReply: (id: string | null) => void;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  depth?: number;
}

const Comment = ({ comment, onReply, onEdit, onDelete, depth = 0 }: CommentProps) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);

  const handleSaveEdit = () => {
    onEdit(comment.id, editedContent);
    setIsEditing(false);
  };

  const isOwner = comment.createdBy === user?.id;

  return (
    <div className={`pl-${depth * 6} py-2`}>
      <div className="flex gap-4">
        <Avatar className="h-8 w-8">
          <AvatarFallback>{comment.createdBy.substring(0, 2)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="bg-muted rounded-lg p-3">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-medium">{comment.createdBy}</span>
                <span className="text-sm text-muted-foreground ml-2">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDelete(comment.id)} className="text-destructive">
                      <Trash className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveEdit}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
            )}
          </div>
          <div className="flex gap-2 mt-2">
            <Button variant="ghost" size="sm" onClick={() => onReply(comment.id)}>
              <Reply className="h-4 w-4 mr-2" />
              Reply
            </Button>
          </div>
        </div>
      </div>
      {(comment.replies ?? []).length > 0 && (
        <div className="mt-2">
          {(comment.replies ?? []).map((reply) => (
            <Comment
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface CommentsProps {
  dealId: string;
}

export function Comments({ dealId }: CommentsProps) {
  const {
    comments,
    isLoading,
    error,
    addComment,
    updateComment,
    deleteComment,
    replyToComment,
  } = useDealComments(dealId);

  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  if (isLoading) {
    return <div className="text-center py-8">Loading comments...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8 text-destructive">
        Error loading comments: {error.message}
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    if (replyingTo) {
      await replyToComment({ parentId: replyingTo, content: newComment });
      setReplyingTo(null);
    } else {
      await addComment(newComment);
    }
    setNewComment('');
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-medium">Comments</h3>
        <Badge variant="secondary" className="ml-2">
          {comments.length}
        </Badge>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={replyingTo ? "Write a reply..." : "Add a comment..."}
            className="min-h-[100px]"
          />
          <div className="flex justify-between items-center">
            {replyingTo && (
              <Button variant="ghost" onClick={() => setReplyingTo(null)}>
                Cancel Reply
              </Button>
            )}
            <Button className="ml-auto text-secondary" onClick={handleSubmit}>
              <Send className="h-4 w-4 mr-2" />
              {replyingTo ? "Reply" : "Comment"}
            </Button>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {comments.map((comment) => (
            <motion.div
              key={comment.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Comment
                comment={comment}
                onReply={(id) => setReplyingTo(id)}
                onEdit={(commentId, content) => updateComment({ commentId, content }).then(() => {})}
                onDelete={(commentId) => deleteComment(commentId)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Card>
  );
}

export default Comments;