let PrismaClient;
try {
  // Check root node_modules first where prisma generate outputs by default
  ({ PrismaClient } = require('../../node_modules/@prisma/client'));
} catch (e) {
  ({ PrismaClient } = require('@prisma/client'));
}

const prisma = new PrismaClient();

module.exports = prisma;
