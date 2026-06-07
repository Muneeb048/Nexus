const messageService = require('../services/messageService');

exports.getMessages = async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const currentUserId = req.user._id;

    const messages = await messageService.getMessages(currentUserId, otherUserId);
    res.json({ success: true, count: messages.length, messages });
  } catch (error) {
    console.error('GetMessages error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    if (!receiverId || !content) {
      return res.status(400).json({ success: false, message: 'Receiver ID and content are required' });
    }

    const message = await messageService.sendMessage(req.user._id, receiverId, content);
    res.status(201).json({ success: true, message });
  } catch (error) {
    console.error('SendMessage error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const conversations = await messageService.getConversations(req.user._id);
    res.json({ success: true, count: conversations.length, conversations });
  } catch (error) {
    console.error('GetConversations error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
