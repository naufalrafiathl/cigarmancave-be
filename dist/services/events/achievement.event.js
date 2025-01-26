"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.achievementEvents = void 0;
const events_1 = require("events");
const achievement_service_1 = require("../achievement.service");
class AchievementEventManager {
    constructor() {
        this.eventEmitter = new events_1.EventEmitter();
        this.achievementService = new achievement_service_1.AchievementService();
        this.setupEventListeners();
    }
    setupEventListeners() {
        this.eventEmitter.on('achievement_event', (event) => {
            this.achievementService.processAchievementEvent(event);
        });
    }
    emitAchievementEvent(event) {
        this.eventEmitter.emit('achievement_event', event);
    }
}
exports.achievementEvents = new AchievementEventManager();
//# sourceMappingURL=achievement.event.js.map