const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3000';
const INTERVAL_MS = parseInt(process.env.INTERVAL_MS || '60000'); // 1 minute default

let requestCount = 0;
let successCount = 0;
let errorCount = 0;
let latencySum = 0;

// Generate a random checkout request
function generateCheckoutRequest() {
  return {
    orderId: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    amount: Math.floor(Math.random() * 1000) + 10,
    items: [
      { id: 'item-1', quantity: Math.floor(Math.random() * 5) + 1 },
      { id: 'item-2', quantity: Math.floor(Math.random() * 3) + 1 }
    ]
  };
}

// Execute a single checkout request
async function runCheckout() {
  const startTime = Date.now();
  requestCount++;

  try {
    const response = await axios.post(`${API_URL}/checkout`, generateCheckoutRequest(), {
      timeout: 5000,
      validateStatus: (status) => status < 500 // Don't throw on 4xx, only 5xx
    });

    const latency = Date.now() - startTime;
    latencySum += latency;

    if (response.status === 200) {
      successCount++;
      console.log(`✓ Checkout successful: ${response.data.transactionId} (${latency}ms)`);
    } else {
      errorCount++;
      console.log(`✗ Checkout failed: ${response.status} - ${response.data.error || 'Unknown error'} (${latency}ms)`);
    }
  } catch (error) {
    const latency = Date.now() - startTime;
    latencySum += latency;
    errorCount++;
    
    if (error.code === 'ECONNREFUSED') {
      console.log(`✗ Connection refused - is the API running?`);
    } else if (error.code === 'ETIMEDOUT') {
      console.log(`✗ Request timeout (${latency}ms)`);
    } else {
      console.log(`✗ Error: ${error.message} (${latency}ms)`);
    }
  }

  // Print statistics
  if (requestCount % 10 === 0) {
    const avgLatency = latencySum / requestCount;
    const successRate = (successCount / requestCount) * 100;
    console.log(`\n📊 Stats: ${requestCount} requests | ${successRate.toFixed(2)}% success | ${avgLatency.toFixed(0)}ms avg latency\n`);
  }
}

// Health check
async function checkHealth() {
  try {
    const response = await axios.get(`${API_URL}/health`, { timeout: 2000 });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Synthetic Checkout Test');
  console.log(`API URL: ${API_URL}`);
  console.log(`Interval: ${INTERVAL_MS}ms (${INTERVAL_MS / 1000}s)\n`);

  // Initial health check
  const healthy = await checkHealth();
  if (!healthy) {
    console.log('⚠️  Warning: API health check failed. Continuing anyway...\n');
  }

  // Run first request immediately
  await runCheckout();

  // Then run on interval
  setInterval(async () => {
    await runCheckout();
  }, INTERVAL_MS);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n📊 Final Statistics:');
  console.log(`Total Requests: ${requestCount}`);
  console.log(`Successful: ${successCount} (${((successCount / requestCount) * 100).toFixed(2)}%)`);
  console.log(`Failed: ${errorCount} (${((errorCount / requestCount) * 100).toFixed(2)}%)`);
  if (requestCount > 0) {
    console.log(`Average Latency: ${(latencySum / requestCount).toFixed(0)}ms`);
  }
  process.exit(0);
});

main().catch(console.error);
