"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionStatus = void 0;
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["INCOMPLETE"] = "incomplete";
    SubscriptionStatus["INCOMPLETE_EXPIRED"] = "incomplete_expired";
    SubscriptionStatus["TRIALING"] = "trialing";
    SubscriptionStatus["ACTIVE"] = "active";
    SubscriptionStatus["PAST_DUE"] = "past_due";
    SubscriptionStatus["CANCELED"] = "canceled";
    SubscriptionStatus["CANCELING"] = "canceling";
    SubscriptionStatus["UNPAID"] = "unpaid";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
//# sourceMappingURL=subscription.js.map