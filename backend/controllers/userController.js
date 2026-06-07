const User = require('../models/User');

// @desc    Get all users (filterable by role)
// @route   GET /api/users
// @access  Private
exports.getUsers = async (req, res) => {
  try {
    const query = {};

    // Filter by role if provided
    if (req.query.role) {
      query.role = req.query.role;
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('GetUsers error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single user by ID
// @route   GET /api/users/:id
// @access  Private
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('GetUser error:', error);

    // Handle invalid ObjectId
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/:id
// @access  Private (owner only)
exports.updateUser = async (req, res) => {
  try {
    // Check if user is updating their own profile
    if (req.params.id !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own profile'
      });
    }

    // Fields that are allowed to be updated
    const allowedUpdates = [
      'name', 'bio', 'avatarUrl', 'location',
      // Entrepreneur fields
      'startupName', 'pitchSummary', 'fundingNeeded', 'industry',
      'foundedYear', 'teamSize',
      // Investor fields
      'investmentInterests', 'investmentStage', 'portfolioCompanies',
      'totalInvestments', 'minimumInvestment', 'maximumInvestment'
    ];

    const updates = {};
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    console.error('UpdateUser error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
