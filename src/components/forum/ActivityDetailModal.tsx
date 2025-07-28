'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ForumActivity, ActivityParticipant } from '@/types/forum';
import { Calendar, Users, Gift, MapPin, Clock, AlertCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Image from 'next/image';

interface ActivityDetailModalProps {
  activity: ForumActivity | null;
  isOpen: boolean;
  onClose: () => void;
  onRegister?: (activityId: string) => void;
  isRegistering?: boolean;
  currentUserId?: string;
}

const ActivityDetailModal: React.FC<ActivityDetailModalProps> = ({
  activity,
  isOpen,
  onClose,
  onRegister,
  isRegistering = false,
  currentUserId
}) => {
  if (!activity) return null;

  const isRegistrationClosed = new Date() > new Date(activity.registrationDeadline);
  const isFull = activity.maxParticipants ? activity.currentParticipants >= activity.maxParticipants : false;
  const isUserRegistered = activity.participants?.some(p => p.userId === currentUserId);

  const getMembershipBadge = (participant: ActivityParticipant) => {
    const isExpired = participant.isExpired || 
      (participant.membershipExpiry && new Date() > new Date(participant.membershipExpiry));
    
    let badgeText = '';
    let badgeVariant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
    
    switch (participant.membershipType) {
      case 'yearly':
        badgeText = '年费';
        badgeVariant = isExpired ? 'destructive' : 'default';
        break;
      case 'monthly':
        badgeText = '月费';
        badgeVariant = isExpired ? 'destructive' : 'secondary';
        break;
      case 'free':
      default:
        badgeText = '免费';
        badgeVariant = 'outline';
        break;
    }
    
    return (
      <Badge 
        variant={badgeVariant} 
        className={isExpired ? 'text-red-600 border-red-600' : ''}
      >
        {badgeText}
      </Badge>
    );
  };

  const getRegisterButtonText = () => {
    if (!currentUserId) return '请先登录';
    if (isUserRegistered) return '已报名';
    if (isRegistrationClosed) return '报名已截止';
    if (isFull) return '报名已满';
    return '立即报名';
  };

  const canRegister = currentUserId && !isUserRegistered && !isRegistrationClosed && !isFull;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{activity.title}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* 活动配图 */}
            {activity.imageUrls && activity.imageUrls.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">活动配图</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {activity.imageUrls.map((imageUrl, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                      <Image
                        src={imageUrl}
                        alt={`活动配图 ${index + 1}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform cursor-pointer"
                        onClick={() => window.open(imageUrl, '_blank')}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* 活动信息 */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">活动描述</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{activity.description}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">
                    开始时间: {format(new Date(activity.startTime), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-red-500" />
                  <span className="text-sm">
                    结束时间: {format(new Date(activity.endTime), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                  </span>
                </div>
                
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">
                    报名截止: {format(new Date(activity.registrationDeadline), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                  </span>
                </div>
                
                {activity.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-500" />
                    <span className="text-sm">地点: {activity.location}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">
                    参与人数: {activity.currentParticipants}
                    {activity.maxParticipants && `/${activity.maxParticipants}`}
                  </span>
                </div>
              </div>
              
              {/* 活动奖励 */}
              {activity.rewards && activity.rewards.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <Gift className="h-5 w-5 text-yellow-500" />
                    活动奖励
                  </h3>
                  <div className="space-y-2">
                    {activity.rewards.map((reward, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                        <span>{reward.name}</span>
                        <span className="text-sm text-gray-600">{reward.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* 活动要求 */}
              {activity.requirements && (
                <div>
                  <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-500" />
                    活动要求
                  </h3>
                  <p className="text-gray-700 whitespace-pre-wrap bg-blue-50 p-3 rounded-lg">
                    {activity.requirements}
                  </p>
                </div>
              )}
            </div>
            
            {/* 已报名成员 */}
            {activity.participants && activity.participants.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">已报名成员 ({activity.participants.length}人)</h3>
                <div className="space-y-2">
                  {activity.participants.map((participant) => (
                    <div 
                      key={participant.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        participant.isExpired ? 'bg-red-50 border-red-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={participant.userAvatar} />
                          <AvatarFallback>{participant.userName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <span className={`font-medium ${
                            participant.isExpired ? 'text-red-600' : 'text-gray-900'
                          }`}>
                            {participant.userName}
                          </span>
                          <div className="text-xs text-gray-500">
                            {format(new Date(participant.registeredAt), 'MM月dd日 HH:mm', { locale: zhCN })} 报名
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getMembershipBadge(participant)}
                        {participant.isExpired && (
                          <Badge variant="destructive" className="text-xs">
                            逾期
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
        
        {/* 底部操作按钮 */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            关闭
          </Button>
          
          <Button
            onClick={() => canRegister && onRegister?.(activity.id)}
            disabled={!canRegister || isRegistering}
            variant={isUserRegistered ? 'secondary' : 'default'}
          >
            {isRegistering ? '报名中...' : getRegisterButtonText()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ActivityDetailModal;