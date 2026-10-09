'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // Seed Categories
    await queryInterface.bulkInsert('ServiceCategories', [
      {
        id: 'cat-plumbing',
        name: 'Plumbing',
        slug: 'plumbing',
        description: 'Taps, pipes, cistern leaks, water tank repair, and drainage.',
        iconName: 'Wrench',
        baseCalloutFeeLkr: 1500,
        typicalHourlyRateLkr: 1200,
        emergencyMultiplier: 1.5,
        isActive: true,
        popularTasks: JSON.stringify(['Leaking tap repair', 'Sink drain unblocking', 'Water pump service']),
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'cat-electrical',
        name: 'Electrical',
        slug: 'electrical',
        description: 'Wiring, circuit breakers, switches, fans, and short circuit detection.',
        iconName: 'Zap',
        baseCalloutFeeLkr: 1800,
        typicalHourlyRateLkr: 1500,
        emergencyMultiplier: 1.6,
        isActive: true,
        popularTasks: JSON.stringify(['Breaker tripping', 'Ceiling fan fix', 'Socket replacement']),
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'cat-ac',
        name: 'AC & Refrigeration',
        slug: 'ac-refrigeration',
        description: 'Inverter AC foam cleaning, gas refills, compressor repair.',
        iconName: 'Snowflake',
        baseCalloutFeeLkr: 2500,
        typicalHourlyRateLkr: 1800,
        emergencyMultiplier: 1.4,
        isActive: true,
        popularTasks: JSON.stringify(['Chemical wash', 'Gas leakage check', 'Water dripping']),
        createdAt: now,
        updatedAt: now
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ServiceCategories', null, {});
  }
};
