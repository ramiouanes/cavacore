import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dealService } from '../../services/deal-service';
import { useToast } from '@/hooks/use-toast';
import { CommentType } from '../../types/comments.types';

export function useDealComments(dealId: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const {
    data: comments = [],
    isLoading,
    error
  } = useQuery({
    queryKey: ['deal', dealId, 'comments'],
    queryFn: () => dealService.getComments(dealId),
    staleTime: 30000 
  });

  const addCommentMutation = useMutation({
    mutationFn: (content: string) =>
      dealService.addComment(dealId, {
        content,
        type: CommentType.GENERAL
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] });
      toast({
        title: 'Comment added',
        description: 'Your comment has been posted successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      dealService.updateComment(dealId, commentId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] });
      toast({
        title: 'Comment updated',
        description: 'Your comment has been updated successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: string) =>
      dealService.deleteComment(dealId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] });
      toast({
        title: 'Comment deleted',
        description: 'Your comment has been deleted successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const replyToCommentMutation = useMutation({
    mutationFn: ({ parentId, content }: { parentId: string; content: string }) =>
      dealService.addComment(dealId, {
        content,
        type: CommentType.GENERAL,
        parentId
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deal', dealId] });
      toast({
        title: 'Reply added',
        description: 'Your reply has been posted successfully'
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  return {
    comments,
    isLoading,
    error,
    addComment: addCommentMutation.mutateAsync,
    updateComment: updateCommentMutation.mutateAsync,
    deleteComment: deleteCommentMutation.mutateAsync,
    replyToComment: replyToCommentMutation.mutateAsync
  };
}