# Elastic Stack SLO Demo: Checkout API

A simple demo component demonstrating **Service Level Objectives (SLOs)** and observability with the Elastic Stack. This checkout API is instrumented with Elastic APM and includes synthetic monitoring to track availability and latency SLIs.

## Overview

This demo showcases:
- **SLI Definition**: Availability (success rate) and Latency (p95 response time)
- **Elastic APM Instrumentation**: Automatic transaction and span tracking
- **Synthetic Monitoring**: Continuous testing of the checkout endpoint
- **SLO Violation Scenarios**: Controlled failures to demonstrate error budget burn

## Architecture

```
┌─────────────────┐
│ Synthetic Test  │───> POST /checkout ───> Elastic APM ───> Kibana
│ (Every 1 min)  │      (Instrumented)      (Metrics/Spans)   (SLO Dashboard)
└─────────────────┘      │                    │                  │
                         │                    │                  │
                    ┌────▼────────────────────▼──────────────────▼────┐
                    │         Docker Compose Stack                     │
                    │  ┌──────────────┐  ┌──────────────┐            │
                    │  │ Checkout API │  │  APM Server  │            │
                    │  └──────────────┘  └──────┬───────┘            │
                    │                           │                     │
                    │                    ┌──────▼───────┐             │
                    │                    │ Elasticsearch│             │
                    │                    └──────┬───────┘             │
                    │                           │                     │
                    │                    ┌──────▼───────┐             │
                    │                    │    Kibana    │             │
                    │                    └──────────────┘             │
                    └─────────────────────────────────────────────────┘
```

## Prerequisites

### Option 1: Elastic Cloud (Recommended for Production/Demos)
- Elastic Cloud account with active deployment
- Node.js 14+ (for running the application)
- Docker (optional, for containerized deployment)

### Option 2: Local Docker Compose
- Docker and Docker Compose
- 4GB+ RAM available for Elastic Stack

### Option 3: Local Development
- Node.js 14+ 
- Elastic Stack (Elasticsearch, Kibana, APM Server)
- APM Server running on `http://localhost:8200` (or configure via environment)

## Setup

### Elastic Cloud Setup (Recommended for Production)

Elastic Cloud provides a managed Elastic Stack with Platinum features including SLOs. This is the recommended approach for demos and production use.

#### 1. Get Your Elastic Cloud Credentials

1. **Log in to Elastic Cloud**: https://cloud.elastic.co
2. **Select your deployment** (or create a new one)
3. **Get your endpoints** from the deployment overview:
   - **Elasticsearch endpoint**: `https://your-deployment.es.region.cloud.es.io:9243`
   - **Kibana endpoint**: `https://your-deployment.kb.region.cloud.es.io`
   - **APM endpoint**: `https://your-deployment.apm.region.cloud.es.io:443`

4. **Create an API Key** (Recommended for Elastic Cloud):
   - In Kibana, go to **Stack Management > Security > API Keys**
   - Click **Create API key**
   - Give it a name (e.g., "checkout-api-key")
   - Grant **APM** permissions (or full access for demo)
   - Copy the API key (you'll only see it once!)
   - **Note**: API key is preferred over secret token for Elastic Cloud

5. **Alternative: Get APM Secret Token** (if not using API key):
   - In Kibana, go to **Stack Management > APM > Settings**
   - Copy the **Secret token** (or generate a new one)
   - **Note**: Use either API key OR secret token, not both

#### 2. Configure Environment Variables

Create a `.env` file from the example:

   ```bash
   cp env.cloud.example .env
   ```

Edit `.env` and fill in your Elastic Cloud credentials:

```bash
# Elastic Cloud Endpoints
ELASTICSEARCH_URL=https://your-deployment.es.region.cloud.es.io:9243
KIBANA_URL=https://your-deployment.kb.region.cloud.es.io
APM_SERVER_URL=https://your-deployment.apm.region.cloud.es.io:443

# Authentication (choose ONE method)
# Option 1: API Key (Recommended for Elastic Cloud)
ELASTIC_API_KEY=your-api-key-here

# Option 2: APM Secret Token (Alternative - only if NOT using API key)
# APM_SECRET_TOKEN=your-apm-secret-token-here

# Option 3: Username/Password (Not recommended for APM)
# ELASTIC_USERNAME=elastic
# ELASTIC_PASSWORD=your-password-here

# APM Configuration
APM_SERVICE_NAME=checkout-api
APM_ENVIRONMENT=production
```

#### 3. Install Dependencies

```bash
npm install
```

#### 4. Start the Application

**Option A: Run directly with Node.js**
```bash
npm start
```

**Option B: Run with Docker (only the app, connects to cloud)**
```bash
docker-compose -f docker-compose.cloud.yml up -d
```

#### 5. Start Synthetic Monitoring

In a separate terminal:
```bash
npm run synthetic
```

#### 6. Access Kibana and Verify Data

1. **Open your Kibana URL**: `https://your-deployment.kb.region.cloud.es.io`
2. **Login** with your Elastic Cloud credentials
3. **Generate some test traffic** (important - APM needs data to show services):
   ```bash
   # Make a test checkout request
   curl -X POST http://localhost:3000/checkout \
     -H "Content-Type: application/json" \
     -d '{"orderId":"test-123","amount":99.99,"items":[{"id":"item-1","quantity":2}]}'
   
   # Or use the synthetic test
   npm run synthetic
   ```

4. **Wait 30-60 seconds** for data to be indexed
5. **Navigate to Observability > APM** - you should now see `checkout-api` service
6. **If you see "No application was found"**:
   - Verify the application is running and connected to APM
   - Check application logs for APM connection messages
   - Generate more traffic and wait a bit longer
   - Refresh the Kibana page

#### 7. Set Up SLOs (Platinum License Included)

With Elastic Cloud, you have access to the full SLO feature:

1. Navigate to **Observability > SLOs** in Kibana
2. Click **Create SLO**
3. Select **APM Availability** or **APM Latency**
4. Configure:
   - **Service**: `checkout-api`
   - **Environment**: `production` (or your environment name)
   - **Transaction Type**: `request`
   - **Transaction Name**: `POST /checkout`
   - **Target**: 99.9% (for availability) or p95 < 200ms (for latency)

#### Benefits of Elastic Cloud

- ✅ **No local infrastructure** - Everything runs in the cloud
- ✅ **Platinum features** - Full SLO support included
- ✅ **Scalable** - Handles production workloads
- ✅ **Managed** - Automatic updates and monitoring
- ✅ **Secure** - Built-in security and compliance

### Local Docker Compose Setup

1. **Start the entire Elastic Stack and API:**
   ```bash
   docker-compose up -d
   ```

2. **Wait for Elasticsearch to be healthy** (about 1-2 minutes):
   ```bash
   docker-compose ps
   ```
   Elasticsearch should show "healthy" status.

3. **Set up Kibana user password** (Required for Elasticsearch 8.x):
   ```bash
   ./setup-users.sh
   ```
   This sets the password for the `kibana_system` user that Kibana uses to connect to Elasticsearch.
   
   **Note:** If the script fails, you can manually set it:
   ```bash
   curl -X POST "http://localhost:9200/_security/user/kibana_system/_password" \
     -u elastic:changeme \
     -H "Content-Type: application/json" \
     -d '{"password":"changeme"}'
   ```

4. **Wait for Kibana to start** (check logs if needed):
   ```bash
   docker-compose logs kibana
   ```
   Look for "Server running" message.

5. **Login to Kibana and Install APM Integration:**
   
   **Default Credentials:**
   - Username: `elastic`
   - Password: `changeme`
   
   **Steps:**
   1. Open Kibana: http://localhost:5601
   2. Login with credentials above
   3. Navigate to: **Stack Management > Integrations**
   4. Search for "APM" or "Elastic APM"
   5. Click **Install** and follow the prompts
   6. Wait for installation to complete (1-2 minutes)
   
   **Note:** Security is enabled to allow Fleet/Integrations to work. For production, change the default password.
   
   **Verify Installation:**
   ```bash
   # Check if integration templates are created (use credentials)
   curl -u elastic:changeme http://localhost:9200/_index_template/metrics-apm*?pretty
   ```

6. **Access the services:**
   - **Kibana**: http://localhost:5601 (login: elastic/changeme)
   - **Elasticsearch**: http://localhost:9200 (credentials: elastic/changeme)
   - **APM Server**: http://localhost:8200
   - **Checkout API**: http://localhost:3000

7. **Start synthetic monitoring** (on your host machine):
   ```bash
   npm install
   npm run synthetic
   ```

8. **Stop all services:**
   ```bash
   docker-compose down
   ```

9. **Stop and remove volumes** (clean slate):
   ```bash
   docker-compose down -v
   ```

### Local Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment** (optional):
   ```bash
   # For local Elastic Stack
   # Set APM_SERVER_URL=http://localhost:8200 in your environment
   
   # For Elastic Cloud
   cp .env.cloud.example .env
   # Edit .env with your Elastic Cloud credentials
   ```

3. **Start the Checkout API:**
   ```bash
   npm start
   ```

4. **Start synthetic monitoring** (in a separate terminal):
   ```bash
   npm run synthetic
   ```

## Demo Scenarios

The demo includes three scenarios to demonstrate SLO violations. Each scenario:
1. Sets the configuration (latency multiplier and error rate)
2. **Automatically generates 20 test checkout transactions** to demonstrate the scenario
3. These transactions are tracked in APM and will affect your SLOs

### Normal Operation
```bash
npm run demo:normal
```
- Sets baseline performance
- Low latency (~50-150ms)
- 0% error rate
- Generates 20 successful checkout transactions

### High Latency Scenario
```bash
npm run demo:latency
```
- Sets 5x latency multiplier (simulates slow database or network issues)
- 0% error rate
- Generates 20 checkout transactions with high latency
- Demonstrates latency SLO violation

### High Error Rate Scenario
```bash
npm run demo:errors
```
- Sets 10% error rate (simulates payment processing failures)
- Normal latency
- Generates 20 checkout transactions (~2 will fail, ~18 will succeed)
- Demonstrates availability SLO violation

**Note:** After running a scenario, wait 30-60 seconds for data to be indexed, then check your SLOs in Kibana. The test transactions will show up in APM and affect your SLO calculations.

## API Endpoints

### `POST /checkout`
Main endpoint for processing checkout requests.

**Request:**
```json
{
  "orderId": "order-123",
  "amount": 99.99,
  "items": [
    { "id": "item-1", "quantity": 2 }
  ]
}
```

**Success Response (200):**
```json
{
  "success": true,
  "orderId": "order-123",
  "amount": 99.99,
  "transactionId": "txn-1234567890-abc123",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Error Response (400/500):**
```json
{
  "error": "Payment processing failed",
  "orderId": "order-123"
}
```

### `GET /health`
Health check endpoint.

### `POST /admin/scenario`
Set demo scenario and optionally generate test transactions.

**Request:**
```json
{
  "type": "errors",
  "generateTestTransactions": true,
  "count": 20
}
```

**Response:**
```json
{
  "message": "High error rate scenario",
  "latencyMultiplier": 1,
  "errorRate": 0.1,
  "testTransactionsGenerated": 20,
  "note": "Test transactions are being generated in the background. Check APM in 30-60 seconds."
}
```

**Parameters:**
- `type`: Scenario type (`normal`, `latency`, or `errors`)
- `generateTestTransactions` (optional): If `true`, generates test checkout transactions (default: `false`)
- `count` (optional): Number of test transactions to generate (default: 10)

### `GET /admin/status`
Get current scenario status.

## SLO Configuration in Kibana

### ⚠️ License Requirement

**Note:** The built-in SLO feature in Kibana requires a **Platinum license** or **Elastic Cloud subscription**. 

- ✅ **Elastic Cloud**: Includes Platinum features (SLOs fully supported)
- ❌ **Local Basic License**: SLOs not available (use APM dashboards instead)

### Alternative: Demonstrating SLO Concepts with APM

Since SLOs require a premium license, you can demonstrate SLO concepts using APM dashboards and custom visualizations. The following approaches work with the Basic license:

### SLI Definitions

1. **Availability SLI:**
   - **Metric**: Success rate of `/checkout` requests
   - **Target**: 99.9% (3 nines)
   - **Window**: 30 days
   - **Error Budget**: 0.1% (43.2 minutes of downtime per month)

2. **Latency SLI:**
   - **Metric**: p95 response time for `/checkout`
   - **Target**: < 200ms
   - **Window**: 30 days
   - **Error Budget**: 5% of requests can exceed 200ms

### Tracking SLIs in APM (Basic License)

#### Method 1: Using APM Service Overview

1. Navigate to **Observability > APM > Services** in Kibana
2. Click on `checkout-api` service
3. View the **Service Overview** dashboard which shows:
   - **Throughput**: Requests per minute
   - **Latency**: p50, p95, p99 response times
   - **Failed transaction rate**: Error percentage
   - **Transaction duration distribution**

#### Method 2: Custom Dashboard with KQL Queries

Create a custom dashboard to track SLO metrics:

**Availability Query:**
```kql
service.name: "checkout-api" AND transaction.name: "POST /checkout"
| stats count() as total, count(kv exists transaction.outcome and transaction.outcome == "failure") as errors
| eval success_rate = ((total - errors) / total) * 100
| eval slo_target = 99.9
| eval within_slo = success_rate >= slo_target
```

**Latency Query:**
```kql
service.name: "checkout-api" AND transaction.name: "POST /checkout"
| stats percentile(transaction.duration.us, 95) as p95_latency_ms = percentile(transaction.duration.us, 95) / 1000
| eval slo_target_ms = 200
| eval within_slo = p95_latency_ms < slo_target_ms
```

#### Method 3: Using APM Transaction Details

1. Navigate to **Observability > APM > Services > checkout-api**
2. Click on **Transactions** tab
3. Filter for `POST /checkout`
4. View metrics:
   - **Transaction rate** (success vs. errors)
   - **Latency metrics** (p50, p95, p99)
   - **Error rate percentage**

### Setting Up SLOs

#### With Elastic Cloud (Platinum License Included)

Elastic Cloud includes Platinum features, so SLOs are fully available:

1. Navigate to **Observability > SLOs** in Kibana
2. Click **Create SLO**
3. Create Availability SLO:
   - **Name**: Checkout API Availability
   - **Indicator Type**: APM Availability
   - **Service**: `checkout-api`
   - **Environment**: `production` (or your environment name)
   - **Transaction Type**: `request`
   - **Transaction Name**: `POST /checkout`
   - **Target**: 99.9%
   - **Time Window**: 30 days

4. Create Latency SLO:
   - **Name**: Checkout API Latency
   - **Indicator Type**: APM Latency
   - **Service**: `checkout-api`
   - **Environment**: `production` (or your environment name)
   - **Transaction Type**: `request`
   - **Transaction Name**: `POST /checkout`
   - **Target**: p95 < 200ms
   - **Time Window**: 30 days

#### With Local Setup (Platinum License Required)

If you have a Platinum license for your local Elastic Stack:

Follow the same steps as above, but use `demo` as the environment name.

### Burn-Rate Alerts

With Platinum license, configure burn-rate alerts in Kibana to get notified when:
- **Fast-burn**: Error budget consumed 2x faster than sustainable (6-hour window)
- **Slow-burn**: Error budget consumed 1.5x faster than sustainable (30-day window)

**Alternative (Basic License):** Use standard Kibana alerts on APM metrics to detect when error rates or latency exceed thresholds.

## Demo Flow

### With Elastic Cloud

1. **Configure your environment:**
   ```bash
   cp .env.cloud.example .env
   # Edit .env with your Elastic Cloud credentials
   ```

2. **Start the application:**
   ```bash
   npm install
   npm start
   # Or with Docker:
   npm run docker:cloud
   ```

3. **Start synthetic monitoring** (in a separate terminal):
   ```bash
   npm run synthetic
   ```

4. **Generate test traffic** (required for APM to show data):
   ```bash
   # Make a test request
   curl -X POST http://localhost:3000/checkout \
     -H "Content-Type: application/json" \
     -d '{"orderId":"test-123","amount":99.99,"items":[{"id":"item-1","quantity":2}]}'
   ```

5. **Access Kibana:**
   - Open your Kibana URL from Elastic Cloud
   - Wait 30-60 seconds after generating traffic
   - Navigate to **Observability > APM**
   - You should see `checkout-api` service listed
   - Click on it to view metrics and traces

5. **Set up SLOs:**
   - Navigate to **Observability > SLOs**
   - Create Availability and Latency SLOs (see SLO Configuration section)

6. **Trigger demo scenarios:**
   ```bash
   npm run demo:normal    # Baseline
   npm run demo:latency   # High latency
   npm run demo:errors    # High error rate
   ```

### With Local Docker Compose

1. **Start the stack:**
   ```bash
   docker-compose up -d
   ```

2. **Set up Kibana user:**
   ```bash
   ./setup-users.sh
   ```

3. **Start synthetic monitoring** (on host):
   ```bash
   npm install
   npm run synthetic
   ```

4. **Set normal operation:**
   ```bash
   npm run demo:normal
   ```

### Local Development

1. **Start with normal operation:**
   ```bash
   npm start
   npm run synthetic
   npm run demo:normal
   ```

2. **Observe baseline in Kibana:**
   - Check APM service map
   - View transaction metrics in **Observability > APM > Services > checkout-api**
   - Note baseline success rate and latency metrics

3. **Trigger latency scenario:**
   ```bash
   npm run demo:latency
   ```
   - Watch latency increase in APM dashboard (p95 should exceed 200ms target)
   - Observe how latency metrics change in real-time
   - Note the impact on user experience

4. **Trigger error scenario:**
   ```bash
   npm run demo:errors
   ```
   - Watch error rate increase in APM (should show ~10% failure rate)
   - Observe availability dropping below 99.9% target
   - See how errors are tracked and displayed

5. **Investigate in Kibana:**
   - Use APM to trace failed requests
   - Correlate with logs and metrics
   - Identify root cause

6. **Return to normal:**
   ```bash
   npm run demo:normal
   ```
   - Verify recovery in APM dashboard
   - Watch metrics return to baseline
   - Observe how the system recovers

## Key Takeaways

- **SLIs measure user experience**: Availability and latency from the customer perspective
- **SLOs set reliability targets**: Clear, measurable goals aligned with business needs
- **Error budgets enable risk-taking**: Allow controlled experimentation within budget
- **Burn-rate alerts catch issues early**: Detect problems before SLO violation
- **Observability enables root cause analysis**: APM + logs + metrics provide full context

## Troubleshooting

### Docker Compose Issues

**Services not starting:**
- Check available memory: `docker stats`
- Ensure ports 3000, 5601, 8200, 9200 are not in use
- View logs: `docker-compose logs [service-name]`

**Elasticsearch not healthy:**
- Check logs: `docker-compose logs elasticsearch`
- Increase memory allocation in docker-compose.yml if needed
- Ensure Docker has enough resources allocated

**Kibana not accessible:**
- Wait 2-3 minutes after starting for Kibana to fully initialize
- Check logs: `docker-compose logs kibana`
- Verify Elasticsearch is healthy first

**APM Server connection issues:**
- Verify Elasticsearch is healthy: `curl http://localhost:9200/_cluster/health`
- Check APM Server logs: `docker-compose logs apm-server`
- Ensure network connectivity between containers

**APM Integration not installed error:**
- This is normal on first startup with Elastic Stack 8.x
- Install the APM integration via Kibana UI: **Stack Management > Integrations > APM**
- Login to Kibana first (elastic/changeme) - Fleet requires security to be enabled
- Or wait for APM Server to auto-install (may take a few minutes)
- Verify installation: `curl -u elastic:changeme http://localhost:9200/_index_template/metrics-apm*?pretty`
- After installation, restart APM Server: `docker-compose restart apm-server`

**Fleet requires security error:**
- Security is now enabled in the docker-compose.yml
- Use credentials: `elastic` / `changeme` to login to Kibana
- Fleet/Integrations will work once you're logged in

**Encrypted Saved Objects encryption key error:**
- Kibana 8.x requires encryption keys to be set in `kibana.yml` file
- A `kibana.yml` file is provided and mounted as a volume in docker-compose.yml
- The encryption key must be at least 32 characters
- If you see this error, restart Kibana: `docker-compose restart kibana`
- The `kibana.yml` file includes all required encryption keys

### General Issues

**APM not sending data:**
- Verify APM Server is running and accessible
- Check `APM_SERVER_URL` environment variable (should be `http://apm-server:8200` in Docker)
- Review APM agent logs: `docker-compose logs checkout-api`

**Synthetic test can't connect:**
- Ensure API server is running on port 3000
- Check `API_URL` environment variable
- If using Docker, use `http://localhost:3000` from host

**No data in Kibana:**
- Verify APM Server is connected to Elasticsearch
- Check index patterns are created (auto-created on first data)
- Wait a few minutes for data to appear
- In Kibana, go to **Stack Management > Index Patterns** to verify

**SLO feature requires Platinum license:**
- The built-in SLO feature requires a Platinum license or Elastic Cloud subscription
- Use APM Service Overview and custom dashboards to track SLI metrics instead
- See "Tracking SLIs in APM (Basic License)" section above for alternatives

### Elastic Cloud Issues

**Cannot connect to Elastic Cloud:**
- Verify your endpoints are correct (check for typos in URLs)
- Ensure your deployment is running (check status in Elastic Cloud console)
- Verify network connectivity: `curl -k https://your-deployment.apm.region.cloud.es.io:443`

**APM authentication errors:**
- **Important**: Use EITHER `ELASTIC_API_KEY` OR `APM_SECRET_TOKEN`, not both
- For Elastic Cloud, prefer API key over secret token
- Verify `APM_SECRET_TOKEN` is correct (get from Kibana > Stack Management > APM > Settings)
- If using API key, ensure `ELASTIC_API_KEY` is set correctly and has APM permissions
- Check the APM Server URL is correct (should be HTTPS for Elastic Cloud)
- Verify the API key format: should be base64 encoded string
- Check application logs for authentication method being used

**No data appearing in Kibana:**
- Wait 1-2 minutes for data to be indexed
- Verify APM integration is installed (should be automatic in Elastic Cloud)
- Check APM agent logs for connection errors
- Ensure your service name matches: `checkout-api`

**"No application was found" error in Kibana APM:**
- This means no data has been sent to APM yet
- **Verify the application is running**: Check that `npm start` is running and you see APM connection logs
- **Generate some traffic**: Make a request to the checkout endpoint:
  ```bash
  curl -X POST http://localhost:3000/checkout \
    -H "Content-Type: application/json" \
    -d '{"orderId":"test-123","amount":99.99,"items":[{"id":"item-1","quantity":2}]}'
  ```
- **Check APM agent connection**: Look for these log messages when starting:
  - "Using API key for APM authentication" or "Using secret token for APM authentication"
  - Any error messages about connection failures
- **Verify service name**: Ensure `APM_SERVICE_NAME=checkout-api` in your `.env` file
- **Wait 30-60 seconds**: After sending requests, wait for data to be indexed
- **Refresh Kibana**: Refresh the APM page after generating traffic
- **Check APM Server**: Verify APM Server is accessible and receiving data

**Availability SLO not showing data (but latency SLO works):**
- **Check transaction name**: The SLO must use transaction name `POST /checkout` (exact match, case-sensitive)
- **Verify transaction outcomes**: Ensure transactions are marked with `outcome: 'success'` or `outcome: 'failure'`
- **Check SLO configuration**: In Kibana SLO settings, verify:
  - Transaction Name is exactly: `POST /checkout` (must match exactly)
  - Service name matches: `checkout-api`
  - Environment matches your APM environment setting (e.g., `production` or `demo`)
  - Indicator Type is: `APM Availability` (not APM Latency)
- **Verify HTTP status codes**: Availability SLOs track HTTP status codes. Ensure:
  - Success responses return HTTP 200
  - Error responses return HTTP 4xx or 5xx
- **Check transaction timing**: Transactions must be ended AFTER the HTTP response is sent
- **Generate errors**: Trigger the error scenario to ensure you have both success and error transactions:
  ```bash
  npm run demo:errors
  ```
  This will generate 10% error rate (10% will be HTTP 500, 90% will be HTTP 200)
- **Wait for data**: Availability SLOs need both success and error transactions to calculate properly
  - Wait 1-2 minutes after generating traffic
  - Refresh the SLO page in Kibana
- **Check transaction outcome field**: In APM > Services > checkout-api > Transactions, verify:
  - You see transactions with `outcome: success` (HTTP 200)
  - You see transactions with `outcome: failure` (HTTP 4xx/5xx)
  - Both types are present in the data
- **Verify SLO query**: In Kibana, edit the SLO and check the generated query matches your transaction name exactly
- **Check time window**: Ensure your SLO time window (e.g., 30 days) includes the time when you generated traffic

**Finding your Elastic Cloud credentials:**
- **Endpoints**: Deployment overview page in Elastic Cloud console
- **APM Secret Token**: Kibana > Stack Management > APM > Settings
- **API Key**: Kibana > Stack Management > Security > API Keys (create new)
- **Username/Password**: Your Elastic Cloud login credentials

## Docker Quick Reference

### Common Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f [service-name]  # e.g., elasticsearch, kibana, apm-server, checkout-api

# Check service status
docker-compose ps

# Stop all services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (clean slate)
docker-compose down -v

# Restart a specific service
docker-compose restart checkout-api

# View resource usage
docker stats

# Access service logs
docker-compose logs -f --tail=100 elasticsearch
docker-compose logs -f --tail=100 kibana
docker-compose logs -f --tail=100 apm-server
docker-compose logs -f --tail=100 checkout-api
```

### Service URLs

- **Kibana UI**: http://localhost:5601
- **Elasticsearch API**: http://localhost:9200
- **APM Server**: http://localhost:8200
- **Checkout API**: http://localhost:3000

### Health Checks

```bash
# Check Elasticsearch (with authentication)
curl -u elastic:changeme http://localhost:9200/_cluster/health

# Check APM Server
curl http://localhost:8200/

# Check Checkout API
curl http://localhost:3000/health
```

### Default Credentials

For this demo setup, security is enabled with default credentials:

**Elasticsearch/Kibana Login:**
- **Username**: `elastic`
- **Password**: `changeme`

**Kibana System User** (used internally by Kibana):
- **Username**: `kibana_system`
- **Password**: `changeme`

**⚠️ Important:** 
- The `kibana_system` user password must be set before Kibana can start (use `./setup-users.sh`)
- Change all credentials for any production use!

### Resource Requirements

- **Minimum**: 4GB RAM, 2 CPU cores
- **Recommended**: 8GB RAM, 4 CPU cores
- **Disk**: ~2GB for Elasticsearch data (grows with usage)

### Troubleshooting Docker

**Out of memory errors:**
- Reduce Elasticsearch heap size in docker-compose.yml: `ES_JAVA_OPTS=-Xms256m -Xmx256m`
- Close other applications using memory
- Increase Docker Desktop memory allocation

**Port conflicts:**
- Change ports in docker-compose.yml if 3000, 5601, 8200, or 9200 are in use
- Update API_URL and APM_SERVER_URL accordingly

**Slow startup:**
- First startup takes 2-3 minutes for Elasticsearch and Kibana to initialize
- Subsequent starts are faster (30-60 seconds)

## License

MIT
