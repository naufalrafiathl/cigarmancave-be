import { EventEmitter } from 'events';
import { AchievementEvent } from '../../types/achievement';
import { AchievementService } from '../achievement.service';

class AchievementEventManager {
  private eventEmitter: EventEmitter;
  private achievementService: AchievementService;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.achievementService = new AchievementService();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.eventEmitter.on('achievement_event', (event: AchievementEvent) => {
      this.achievementService.processAchievementEvent(event);
    });
  }

  emitAchievementEvent(event: AchievementEvent): void {
    this.eventEmitter.emit('achievement_event', event);
  }
}

export const achievementEvents = new AchievementEventManager();