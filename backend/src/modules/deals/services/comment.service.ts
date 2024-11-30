import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deal } from '../entities/deal.entity';
import { Comment, CommentType, AddCommentDto, UpdateCommentDto } from '../interfaces/comments.interface';
import { TimelineManager } from './timeline-manager.service';
import { TimelineEventType } from '../interfaces/timeline.interface';
import { DealEventsGateway } from '../gateways/deal-events.gateway';
import { DealEventType } from '../interfaces/deal-events.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Deal)
    private readonly dealRepository: Repository<Deal>,
    private readonly timelineManager: TimelineManager,
    private readonly eventsGateway: DealEventsGateway
  ) {}

  async addComment(
    dealId: string,
    userId: string,
    dto: AddCommentDto
  ): Promise<Comment> {
    const deal = await this.dealRepository.findOne({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Deal not found');

    // Create comment
    const comment: Comment = {
      id: uuidv4(),
      dealId,
      type: dto.type,
      content: dto.content,
      createdBy: userId,
      createdAt: new Date(),
      parentId: dto.parentId,
      metadata: dto.metadata
    };

    // Handle mentions
    const mentions = this.extractMentions(dto.content);
    if (mentions.length > 0) {
      comment.metadata = {
        ...comment.metadata,
        mentions
      };
    }

    // Add to deal's comments array
    if (!deal.metadata?.comments) {
      deal.metadata = { ...deal.metadata, comments: [] };
    }
    deal.metadata.comments.push(comment);

    // Add timeline entry
    await this.timelineManager.addTimelineEntry(
      deal,
      TimelineEventType.COMMENT,
      dto.content,
      userId,
      {
        commentId: comment.id,
        commentType: dto.type,
        mentions
      }
    );

    await this.dealRepository.save(deal);

    // Notify participants
    this.eventsGateway.emitDealEvent({
      id: uuidv4(),
      type: DealEventType.COMMENT_ADDED,
      dealId,
      timestamp: new Date(),
      actor: { id: userId },
      data: { comment },
      recipients: this.getCommentRecipients(deal, comment)
    });

    return comment;
  }

  async updateComment(
    dealId: string,
    commentId: string,
    userId: string,
    dto: UpdateCommentDto
  ): Promise<Comment> {
    const deal = await this.dealRepository.findOne({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Deal not found');

    const commentIndex = deal.metadata?.comments?.findIndex((c: Comment) => c.id === commentId);
    if (commentIndex === -1) throw new NotFoundException('Comment not found');

    // Verify ownership
    if (!deal.metadata || deal.metadata.comments[commentIndex].createdBy !== userId) {
      throw new BadRequestException('Can only edit own comments');
    }

    // Update comment
    const updatedComment = {
      ...deal.metadata.comments[commentIndex],
      ...dto,
      updatedAt: new Date()
    };

    deal.metadata.comments[commentIndex] = updatedComment;
    await this.dealRepository.save(deal);

    return updatedComment;
  }

  async deleteComment(
    dealId: string,
    commentId: string,
    userId: string
  ): Promise<void> {
    const deal = await this.dealRepository.findOne({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Deal not found');

    const commentIndex = deal.metadata?.comments?.findIndex((c: Comment) => c.id === commentId);
    if (commentIndex === -1) throw new NotFoundException('Comment not found');

    // Verify ownership or admin status
    const isOwner = deal.metadata?.comments && deal.metadata.comments[commentIndex].createdBy === userId;
    const isAdmin = deal.participants.some(p => 
      p.userId === userId && p.permissions.includes('manage_comments')
    );

    if (!isOwner && !isAdmin) {
      throw new BadRequestException('Not authorized to delete this comment');
    }

    // Remove comment
    if (deal.metadata && deal.metadata.comments) {
      deal.metadata.comments.splice(commentIndex, 1);
      await this.dealRepository.save(deal);
    }
  }

  async getComments(
    dealId: string,
    filters?: {
      type?: CommentType;
      parentId?: string;
      since?: Date;
    }
  ): Promise<Comment[]> {
    const deal = await this.dealRepository.findOne({ where: { id: dealId } });
    if (!deal) throw new NotFoundException('Deal not found');

    let comments = deal.metadata?.comments || [];

    if (filters) {
      if (filters.type) {
        comments = comments.filter((c: Comment) => c.type === filters.type);
      }
      if (filters.parentId !== undefined) {
        comments = comments.filter((c: Comment) => c.parentId === filters.parentId);
      }
      if (filters.since) {
        comments = comments.filter((c: Comment) => new Date(c.createdAt) > filters.since!);
      }
    }

    return this.buildCommentThreads(comments);
  }

  private buildCommentThreads(comments: Comment[]): Comment[] {
    const rootComments = comments.filter(c => !c.parentId);
    
    // Update the typing of the Map to explicitly include replies array
    const commentMap = new Map<string, Comment & { replies: Comment[] }>(
      comments.map(c => [c.id, { ...c, replies: [] }])
    );

    comments.forEach(comment => {
      if (comment.parentId && commentMap.has(comment.parentId)) {
        const parentComment = commentMap.get(comment.parentId);
        const childComment = commentMap.get(comment.id);
        if (parentComment && childComment) {
          parentComment.replies.push(childComment);
        }
      }
    });

    return rootComments.map(c => commentMap.get(c.id)!);
}

  private extractMentions(content: string): string[] {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions: string[] = [];
    let match;

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[2]); // Extract user ID
    }

    return mentions;
  }

  private getCommentRecipients(deal: Deal, comment: Comment): string[] {
    const recipients = new Set<string>();

    // Add all participants
    deal.participants.forEach(p => recipients.add(p.userId));

    // Add mentioned users
    comment.metadata?.mentions?.forEach(userId => recipients.add(userId));

    // Add parent comment author if it's a reply
    if (comment.parentId) {
      const parentComment = deal.metadata?.comments?.find((c: Comment) => c.id === comment.parentId);
      if (parentComment) {
        recipients.add(parentComment.createdBy);
      }
    }

    return Array.from(recipients);
  }
}