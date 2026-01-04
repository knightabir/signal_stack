import mongoose from 'mongoose';

// Roadmap stages
export const ROADMAP_STAGES = {
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  SHIPPED: 'shipped',
};

export const ROADMAP_STAGE_LABELS = {
  [ROADMAP_STAGES.PLANNED]: 'Planned',
  [ROADMAP_STAGES.IN_PROGRESS]: 'In Progress',
  [ROADMAP_STAGES.SHIPPED]: 'Shipped',
};

export const ROADMAP_STAGE_COLORS = {
  [ROADMAP_STAGES.PLANNED]: 'bg-purple-500',
  [ROADMAP_STAGES.IN_PROGRESS]: 'bg-orange-500',
  [ROADMAP_STAGES.SHIPPED]: 'bg-green-500',
};

const RoadmapItemSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true,
    },
    // Optional link to feedback (null for standalone items)
    feedbackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Feedback',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    stage: {
      type: String,
      enum: Object.values(ROADMAP_STAGES),
      default: ROADMAP_STAGES.PLANNED,
      index: true,
    },
    // Order within stage for drag & drop
    order: {
      type: Number,
      default: 0,
    },
    // Admin who created/promoted this item
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
RoadmapItemSchema.index({ workspaceId: 1, stage: 1, order: 1 });
RoadmapItemSchema.index({ feedbackId: 1 }, { sparse: true });

// Static method to get next order number for a stage
RoadmapItemSchema.statics.getNextOrder = async function (workspaceId, stage) {
  const lastItem = await this.findOne({ workspaceId, stage })
    .sort({ order: -1 })
    .lean();
  return lastItem ? lastItem.order + 1 : 0;
};

// Static method to reorder items after drag & drop
RoadmapItemSchema.statics.reorderItems = async function (workspaceId, itemId, newStage, newOrder) {
  const item = await this.findById(itemId);
  if (!item || item.workspaceId.toString() !== workspaceId.toString()) {
    return null;
  }

  const oldStage = item.stage;
  const oldOrder = item.order;

  // If moving to a different stage
  if (oldStage !== newStage) {
    // Decrement order of items after the old position in the old stage
    await this.updateMany(
      { workspaceId, stage: oldStage, order: { $gt: oldOrder } },
      { $inc: { order: -1 } }
    );

    // Increment order of items at or after the new position in the new stage
    await this.updateMany(
      { workspaceId, stage: newStage, order: { $gte: newOrder } },
      { $inc: { order: 1 } }
    );
  } else {
    // Moving within the same stage
    if (newOrder > oldOrder) {
      // Moving down - decrement items between old and new position
      await this.updateMany(
        { workspaceId, stage: oldStage, order: { $gt: oldOrder, $lte: newOrder } },
        { $inc: { order: -1 } }
      );
    } else if (newOrder < oldOrder) {
      // Moving up - increment items between new and old position
      await this.updateMany(
        { workspaceId, stage: oldStage, order: { $gte: newOrder, $lt: oldOrder } },
        { $inc: { order: 1 } }
      );
    }
  }

  // Update the item's position
  item.stage = newStage;
  item.order = newOrder;
  await item.save();

  return item;
};

// Prevent model recompilation in development
const RoadmapItem = mongoose.models.RoadmapItem || mongoose.model('RoadmapItem', RoadmapItemSchema);

export default RoadmapItem;
