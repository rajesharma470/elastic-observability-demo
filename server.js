const express = require('express');
const apm = require('elastic-apm-node');
const http = require('http');

// Initialize Elastic APM
// Configure via environment variables or apm.start()
const apmConfig = {
  serviceName: process.env.APM_SERVICE_NAME || 'checkout-api',
  serverUrl: process.env.APM_SERVER_URL || 'http://localhost:8200',
  environment: process.env.APM_ENVIRONMENT || 'demo',
  logLevel: 'info'
};

// For Elastic Cloud, API key is preferred over secretToken
// Use API key if provided, otherwise fall back to secretToken
if (process.env.ELASTIC_API_KEY) {
  apmConfig.apiKey = process.env.ELASTIC_API_KEY;
  console.log('Using API key for APM authentication');
} else if (process.env.APM_SECRET_TOKEN) {
  apmConfig.secretToken = process.env.APM_SECRET_TOKEN;
  console.log('Using secret token for APM authentication');
} else {
  console.warn('Warning: No APM authentication configured. APM Server may reject connections.');
}

apm.start(apmConfig);

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Simulated state for demo scenarios
let latencyMultiplier = 1;
let errorRate = 0;

// Middleware to simulate latency issues
app.use((req, res, next) => {
  if (latencyMultiplier > 1) {
    const delay = Math.random() * latencyMultiplier * 100;
    setTimeout(next, delay);
  } else {
    next();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Checkout endpoint - the main SLO target
app.post('/checkout', async (req, res) => {
  // Use route pattern for transaction name to match SLO configuration
  const transaction = apm.startTransaction('POST /checkout', 'request');
  const span = transaction.startSpan('process-checkout', 'app');
  
  try {
    const { orderId, amount, items } = req.body;

    // Validate request
    if (!orderId || !amount || amount <= 0) {
      transaction.outcome = 'failure';
      apm.captureError(new Error('Invalid checkout request'));
      span.end();
      res.status(400).json({ 
        error: 'Invalid request',
        message: 'orderId and amount are required'
      });
      transaction.end();
      return;
    }

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 50 + Math.random() * 100));

    // Simulate errors based on errorRate
    if (Math.random() < errorRate) {
      transaction.outcome = 'failure';
      const error = new Error('Payment processing failed');
      apm.captureError(error);
      span.end();
      res.status(500).json({ 
        error: 'Payment processing failed',
        orderId 
      });
      transaction.end();
      return;
    }

    // Simulate database write
    const dbSpan = transaction.startSpan('db-write', 'db');
    await new Promise(resolve => setTimeout(resolve, 20 + Math.random() * 30));
    dbSpan.end();

    // Success response
    const response = {
      success: true,
      orderId,
      amount,
      transactionId: `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    span.end();
    transaction.outcome = 'success';
    res.status(200).json(response);
    transaction.end();
  } catch (error) {
    transaction.outcome = 'failure';
    apm.captureError(error);
    span.end();
    res.status(500).json({ error: 'Internal server error' });
    transaction.end();
  }
});

// Admin endpoints for demo scenarios
app.post('/admin/scenario', async (req, res) => {
  const { type, generateTestTransactions } = req.body;
  
  let latencyMultiplierValue, errorRateValue, message;
  
  switch (type) {
    case 'normal':
      latencyMultiplier = 1;
      errorRate = 0;
      latencyMultiplierValue = 1;
      errorRateValue = 0;
      message = 'Normal operation';
      break;
    case 'latency':
      latencyMultiplier = 5;
      errorRate = 0;
      latencyMultiplierValue = 5;
      errorRateValue = 0;
      message = 'High latency scenario';
      break;
    case 'errors':
      latencyMultiplier = 1;
      errorRate = 0.1; // 10% error rate
      latencyMultiplierValue = 1;
      errorRateValue = 0.1;
      message = 'High error rate scenario';
      break;
    default:
      res.status(400).json({ error: 'Unknown scenario type' });
      return;
  }

  // Optionally generate test transactions to demonstrate the scenario
  if (generateTestTransactions) {
    const count = req.body.count || 10;
    
    // Generate test transactions asynchronously (don't block response)
    setImmediate(() => {
      for (let i = 0; i < count; i++) {
        // Generate a test checkout request
        const testRequest = {
          orderId: `demo-${type}-${Date.now()}-${i}`,
          amount: Math.floor(Math.random() * 1000) + 10,
          items: [
            { id: 'item-1', quantity: Math.floor(Math.random() * 5) + 1 }
          ]
        };
        
        // Make the request asynchronously (don't wait for all to complete)
        // This will generate APM transactions with the current scenario settings
        const postData = JSON.stringify(testRequest);
        const options = {
          hostname: 'localhost',
          port: PORT,
          path: '/checkout',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        };
        
        const httpReq = http.request(options, () => {}); // Fire and forget
        httpReq.on('error', () => {}); // Ignore errors
        httpReq.write(postData);
        httpReq.end();
      }
    });
    
    res.json({ 
      message: `${message} - Scenario set`,
      latencyMultiplier: latencyMultiplierValue,
      errorRate: errorRateValue,
      testTransactionsGenerated: count,
      note: 'Test transactions are being generated in the background. Check APM in 30-60 seconds.'
    });
  } else {
    res.json({ 
      message,
      latencyMultiplier: latencyMultiplierValue,
      errorRate: errorRateValue
    });
  }
});

app.get('/admin/status', (req, res) => {
  res.json({
    latencyMultiplier,
    errorRate,
    status: 'operational'
  });
});

app.listen(PORT, () => {
  console.log(`Checkout API server running on port ${PORT}`);
  console.log(`APM Service: ${process.env.APM_SERVICE_NAME || 'checkout-api'}`);
  console.log(`APM Server: ${process.env.APM_SERVER_URL || 'http://localhost:8200'}`);
  console.log(`APM Secret Token: ${process.env.APM_SECRET_TOKEN ? '***configured***' : 'not set'}`);
  console.log(`APM API Key: ${process.env.ELASTIC_API_KEY ? '***configured***' : 'not set'}`);
  console.log(`Environment: ${process.env.APM_ENVIRONMENT || 'demo'}`);
  console.log(`\n📊 To see data in Kibana:`);
  console.log(`   1. Make a request: curl -X POST http://localhost:${PORT}/checkout -H "Content-Type: application/json" -d '{"orderId":"test","amount":99.99}'`);
  console.log(`   2. Wait 30-60 seconds for data to be indexed`);
  console.log(`   3. Refresh Kibana APM page\n`);
});
