const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const scenario = process.argv[2] || 'normal';

const scenarios = {
  normal: {
    type: 'normal',
    description: 'Normal operation - baseline performance'
  },
  latency: {
    type: 'latency',
    description: 'High latency scenario - simulates slow database or network issues'
  },
  errors: {
    type: 'errors',
    description: 'High error rate scenario - simulates payment processing failures'
  }
};

async function setScenario(scenarioType, generateTransactions = true) {
  try {
    const response = await axios.post(`${API_URL}/admin/scenario`, {
      type: scenarioType,
      generateTestTransactions: generateTransactions,
      count: 20 // Generate 20 test transactions to demonstrate the scenario
    });
    console.log(`✅ Scenario set: ${scenarios[scenarioType].description}`);
    console.log(`   Response:`, response.data);
    
    if (generateTransactions && response.data.testTransactionsGenerated) {
      console.log(`\n📊 Generated ${response.data.testTransactionsGenerated} test transactions`);
      console.log(`   Check Kibana APM in 30-60 seconds to see the scenario effects\n`);
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Error: Could not connect to API. Is the server running?');
    } else {
      console.error('❌ Error setting scenario:', error.message);
    }
    process.exit(1);
  }
}

if (!scenarios[scenario]) {
  console.error(`❌ Unknown scenario: ${scenario}`);
  console.log('\nAvailable scenarios:');
  Object.keys(scenarios).forEach(key => {
    console.log(`  ${key}: ${scenarios[key].description}`);
  });
  process.exit(1);
}

console.log(`🎬 Setting demo scenario: ${scenario}`);
setScenario(scenario);
