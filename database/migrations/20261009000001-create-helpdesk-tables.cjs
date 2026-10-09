'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Users table
    await queryInterface.createTable('Users', {
      id: { type: Sequelize.STRING, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, unique: true, allowNull: false },
      passwordHash: { type: Sequelize.STRING, allowNull: false },
      role: { type: Sequelize.ENUM('CUSTOMER', 'PROVIDER', 'ADMIN'), allowNull: false },
      phone: { type: Sequelize.STRING, allowNull: false },
      avatarUrl: { type: Sequelize.STRING },
      status: { type: Sequelize.ENUM('ACTIVE', 'SUSPENDED'), defaultValue: 'ACTIVE' },
      statusReason: { type: Sequelize.TEXT },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 2. ServiceCategories table
    await queryInterface.createTable('ServiceCategories', {
      id: { type: Sequelize.STRING, primaryKey: true },
      name: { type: Sequelize.STRING, allowNull: false },
      slug: { type: Sequelize.STRING, unique: true, allowNull: false },
      description: { type: Sequelize.TEXT },
      iconName: { type: Sequelize.STRING, allowNull: false },
      baseCalloutFeeLkr: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      typicalHourlyRateLkr: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      emergencyMultiplier: { type: Sequelize.DECIMAL(3, 2), defaultValue: 1.5 },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      popularTasks: { type: Sequelize.JSONB, defaultValue: [] },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 3. ProviderProfiles table
    await queryInterface.createTable('ProviderProfiles', {
      id: { type: Sequelize.STRING, primaryKey: true },
      userId: { 
        type: Sequelize.STRING, 
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE'
      },
      businessName: { type: Sequelize.STRING },
      categoryIds: { type: Sequelize.JSONB, defaultValue: [] },
      experienceYears: { type: Sequelize.INTEGER, defaultValue: 1 },
      bio: { type: Sequelize.TEXT },
      serviceAreas: { type: Sequelize.JSONB, defaultValue: [] },
      workingHours: { type: Sequelize.STRING },
      baseRateLkr: { type: Sequelize.DECIMAL(10, 2), defaultValue: 1500 },
      calloutFeeLkr: { type: Sequelize.DECIMAL(10, 2), defaultValue: 1500 },
      verificationStatus: { 
        type: Sequelize.ENUM('PENDING_VERIFICATION', 'APPROVED', 'REJECTED', 'SUSPENDED'),
        defaultValue: 'PENDING_VERIFICATION'
      },
      verificationNotes: { type: Sequelize.TEXT },
      verificationDate: { type: Sequelize.DATE },
      isOnline: { type: Sequelize.BOOLEAN, defaultValue: false },
      rating: { type: Sequelize.DECIMAL(3, 2), defaultValue: 0 },
      reviewCount: { type: Sequelize.INTEGER, defaultValue: 0 },
      completedJobsCount: { type: Sequelize.INTEGER, defaultValue: 0 },
      nationalIdUrl: { type: Sequelize.STRING },
      certificateUrl: { type: Sequelize.STRING },
      portfolio: { type: Sequelize.JSONB, defaultValue: [] },
      latitude: { type: Sequelize.FLOAT },
      longitude: { type: Sequelize.FLOAT },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 4. Addresses table
    await queryInterface.createTable('Addresses', {
      id: { type: Sequelize.STRING, primaryKey: true },
      userId: { 
        type: Sequelize.STRING, 
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE'
      },
      label: { type: Sequelize.STRING, defaultValue: 'Home' },
      addressLine: { type: Sequelize.STRING, allowNull: false },
      district: { type: Sequelize.STRING, defaultValue: 'Colombo' },
      city: { type: Sequelize.STRING, allowNull: false },
      latitude: { type: Sequelize.FLOAT },
      longitude: { type: Sequelize.FLOAT },
      isDefault: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 5. ServiceRequests table
    await queryInterface.createTable('ServiceRequests', {
      id: { type: Sequelize.STRING, primaryKey: true },
      bookingReference: { type: Sequelize.STRING, unique: true, allowNull: false },
      customerId: { 
        type: Sequelize.STRING, 
        allowNull: false,
        references: { model: 'Users', key: 'id' }
      },
      providerId: { 
        type: Sequelize.STRING,
        references: { model: 'ProviderProfiles', key: 'id' }
      },
      categoryId: { 
        type: Sequelize.STRING, 
        allowNull: false,
        references: { model: 'ServiceCategories', key: 'id' }
      },
      title: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      urgency: { type: Sequelize.ENUM('NORMAL', 'EMERGENCY'), defaultValue: 'NORMAL' },
      address: { type: Sequelize.STRING, allowNull: false },
      city: { type: Sequelize.STRING, allowNull: false },
      district: { type: Sequelize.STRING, defaultValue: 'Colombo' },
      latitude: { type: Sequelize.FLOAT },
      longitude: { type: Sequelize.FLOAT },
      preferredDate: { type: Sequelize.STRING, allowNull: false },
      preferredTime: { type: Sequelize.STRING },
      additionalInstructions: { type: Sequelize.TEXT },
      attachments: { type: Sequelize.JSONB, defaultValue: [] },
      aiClassifiedCategory: { type: Sequelize.STRING },
      aiSafetyWarning: { type: Sequelize.TEXT },
      aiEstimatedUrgency: { type: Sequelize.STRING },
      status: { 
        type: Sequelize.ENUM(
          'PENDING', 
          'ACCEPTED', 
          'ON_THE_WAY', 
          'IN_PROGRESS', 
          'AWAITING_CUSTOMER_CONFIRMATION', 
          'COMPLETED', 
          'CANCELLED', 
          'REJECTED'
        ),
        defaultValue: 'PENDING'
      },
      calloutFeeLkr: { type: Sequelize.DECIMAL(10, 2), defaultValue: 1500 },
      laborChargesLkr: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      additionalCostsLkr: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      additionalCostNotes: { type: Sequelize.TEXT },
      totalAmountLkr: { type: Sequelize.DECIMAL(10, 2), defaultValue: 1500 },
      platformCommissionLkr: { type: Sequelize.DECIMAL(10, 2), defaultValue: 150 },
      acceptedAt: { type: Sequelize.DATE },
      journeyStartedAt: { type: Sequelize.DATE },
      workStartedAt: { type: Sequelize.DATE },
      completionSubmittedAt: { type: Sequelize.DATE },
      completionConfirmedAt: { type: Sequelize.DATE },
      cancelledAt: { type: Sequelize.DATE },
      cancellationReason: { type: Sequelize.TEXT },
      completionNotes: { type: Sequelize.TEXT },
      completionPhotos: { type: Sequelize.JSONB, defaultValue: [] },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 6. BookingStatusHistory table
    await queryInterface.createTable('BookingStatusHistories', {
      id: { type: Sequelize.STRING, primaryKey: true },
      bookingId: { 
        type: Sequelize.STRING, 
        allowNull: false,
        references: { model: 'ServiceRequests', key: 'id' },
        onDelete: 'CASCADE'
      },
      fromStatus: { type: Sequelize.STRING, allowNull: false },
      toStatus: { type: Sequelize.STRING, allowNull: false },
      changedByUserId: { type: Sequelize.STRING, allowNull: false },
      changedByRole: { type: Sequelize.STRING, allowNull: false },
      note: { type: Sequelize.TEXT },
      timestamp: { type: Sequelize.DATE, allowNull: false }
    });

    // 7. Notifications table
    await queryInterface.createTable('Notifications', {
      id: { type: Sequelize.STRING, primaryKey: true },
      userId: { 
        type: Sequelize.STRING, 
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE'
      },
      title: { type: Sequelize.STRING, allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      type: { type: Sequelize.STRING, defaultValue: 'BOOKING_UPDATE' },
      bookingId: { type: Sequelize.STRING },
      isRead: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 8. Reviews table
    await queryInterface.createTable('Reviews', {
      id: { type: Sequelize.STRING, primaryKey: true },
      bookingId: { 
        type: Sequelize.STRING, 
        unique: true, 
        allowNull: false,
        references: { model: 'ServiceRequests', key: 'id' }
      },
      customerId: { 
        type: Sequelize.STRING, 
        allowNull: false,
        references: { model: 'Users', key: 'id' }
      },
      providerId: { 
        type: Sequelize.STRING, 
        allowNull: false,
        references: { model: 'ProviderProfiles', key: 'id' }
      },
      rating: { type: Sequelize.INTEGER, allowNull: false },
      comment: { type: Sequelize.TEXT, allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 9. Complaints table
    await queryInterface.createTable('Complaints', {
      id: { type: Sequelize.STRING, primaryKey: true },
      bookingId: { 
        type: Sequelize.STRING, 
        allowNull: false,
        references: { model: 'ServiceRequests', key: 'id' }
      },
      filedByUserId: { type: Sequelize.STRING, allowNull: false },
      filedByRole: { type: Sequelize.STRING, allowNull: false },
      againstUserId: { type: Sequelize.STRING },
      subject: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      status: { 
        type: Sequelize.ENUM('OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'),
        defaultValue: 'OPEN'
      },
      resolutionNotes: { type: Sequelize.TEXT },
      resolvedAt: { type: Sequelize.DATE },
      createdAt: { type: Sequelize.DATE, allowNull: false }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Complaints');
    await queryInterface.dropTable('Reviews');
    await queryInterface.dropTable('Notifications');
    await queryInterface.dropTable('BookingStatusHistories');
    await queryInterface.dropTable('ServiceRequests');
    await queryInterface.dropTable('Addresses');
    await queryInterface.dropTable('ProviderProfiles');
    await queryInterface.dropTable('ServiceCategories');
    await queryInterface.dropTable('Users');
  }
};
