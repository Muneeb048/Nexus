const Message = require('../models/Message');

exports.getMessages = async (currentUserId, otherUserId) => {
  const messages = await Message.find({
    $or: [
      { senderId: currentUserId, receiverId: otherUserId },
      { senderId: otherUserId, receiverId: currentUserId }
    ]
  })
    .populate('senderId', 'name avatarUrl')
    .populate('receiverId', 'name avatarUrl')
    .sort({ createdAt: 1 });

  return messages;
};

exports.sendMessage = async (senderId, receiverId, content) => {
  const message = await Message.create({
    senderId,
    receiverId,
    content
  });

  await message.populate([
    { path: 'senderId', select: 'name avatarUrl' },
    { path: 'receiverId', select: 'name avatarUrl' }
  ]);

  return message;
};

exports.getConversations = async (currentUserId) => {
  const conversations = await Message.aggregate([
    {
      $match: {
        $or: [
          { senderId: currentUserId },
          { receiverId: currentUserId }
        ]
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $addFields: {
        partnerId: {
          $cond: {
            if: { $eq: ['$senderId', currentUserId] },
            then: '$receiverId',
            else: '$senderId'
          }
        }
      }
    },
    {
      $group: {
        _id: '$partnerId',
        lastMessage: { $first: '$$ROOT' },
        updatedAt: { $first: '$createdAt' }
      }
    },
    {
      $sort: { updatedAt: -1 }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'partner'
      }
    },
    {
      $unwind: '$partner'
    },
    {
      $project: {
        _id: 1,
        partner: {
          _id: '$partner._id',
          name: '$partner.name',
          avatarUrl: '$partner.avatarUrl',
          role: '$partner.role',
          isOnline: '$partner.isOnline'
        },
        lastMessage: {
          content: '$lastMessage.content',
          createdAt: '$lastMessage.createdAt',
          senderId: '$lastMessage.senderId',
          isRead: '$lastMessage.isRead'
        },
        updatedAt: 1
      }
    }
  ]);

  return conversations;
};
