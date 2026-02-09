"use strict";
/**
 * Stripe Integration Test Suite
 *
 * This file contains tests to verify the Stripe webhook and account deletion functionality.
 * Run with: npx ts-node test-stripe-integration.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_CONFIG = exports.runIntegrationTests = exports.testStripeWebhookSignatureVerification = exports.testDeleteAccountEndpoint = exports.testCancelSubscriptionEndpoint = exports.testWebhookConnectivity = void 0;
const node_fetch_1 = __importDefault(require("node-fetch"));
// Test configuration
const TEST_CONFIG = {
    // Replace with your actual deployed function URLs
    webhookUrl: 'https://us-central1-mypropertymanager-cda42.cloudfunctions.net/stripeWebhook',
    cancelSubscriptionUrl: 'https://us-central1-mypropertymanager-cda42.cloudfunctions.net/cancelSubscription',
    deleteAccountUrl: 'https://us-central1-mypropertymanager-cda42.cloudfunctions.net/deleteUserAccount',
    // Test data - replace with real test data
    testUserId: 'test_user_id',
    testSubscriptionId: 'sub_test123',
    testCustomerId: 'cus_test123',
};
exports.TEST_CONFIG = TEST_CONFIG;
// Mock Stripe webhook events for testing
const createMockWebhookEvent = (eventType, data) => ({
    id: `evt_test_${Date.now()}`,
    object: 'event',
    api_version: '2020-08-27',
    created: Math.floor(Date.now() / 1000),
    data: { object: data },
    livemode: false,
    pending_webhooks: 1,
    request: {
        id: `req_test_${Date.now()}`,
        idempotency_key: null,
    },
    type: eventType,
});
const testWebhookConnectivity = async () => {
    console.log('🌐 Testing webhook endpoint connectivity...');
    try {
        // Test with a simple ping (this will fail signature verification but test connectivity)
        const testEvent = createMockWebhookEvent('ping', { test: true });
        const response = await (0, node_fetch_1.default)(TEST_CONFIG.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'stripe-signature': 'test_signature',
            },
            body: JSON.stringify(testEvent),
        });
        console.log(`📡 Webhook endpoint responded with status: ${response.status}`);
        if (response.status === 400) {
            console.log('✅ Webhook endpoint is reachable (signature verification working)');
            return true;
        }
        else {
            console.log('⚠️ Unexpected response from webhook endpoint');
            return false;
        }
    }
    catch (error) {
        console.error('❌ Webhook connectivity test failed:', error instanceof Error ? error.message : String(error));
        return false;
    }
};
exports.testWebhookConnectivity = testWebhookConnectivity;
const testCancelSubscriptionEndpoint = async () => {
    console.log('🚫 Testing cancel subscription endpoint...');
    try {
        // This will require authentication, so it will likely fail
        // But we can test that the endpoint exists and responds
        const response = await (0, node_fetch_1.default)(TEST_CONFIG.cancelSubscriptionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                subscriptionId: TEST_CONFIG.testSubscriptionId,
            }),
        });
        console.log(`📡 Cancel subscription endpoint responded with status: ${response.status}`);
        if (response.status === 401 || response.status === 403) {
            console.log('✅ Cancel subscription endpoint is reachable (authentication required as expected)');
            return true;
        }
        else {
            console.log('⚠️ Unexpected response from cancel subscription endpoint');
            return false;
        }
    }
    catch (error) {
        console.error('❌ Cancel subscription test failed:', error instanceof Error ? error.message : String(error));
        return false;
    }
};
exports.testCancelSubscriptionEndpoint = testCancelSubscriptionEndpoint;
const testDeleteAccountEndpoint = async () => {
    console.log('🗑️ Testing delete account endpoint...');
    try {
        const response = await (0, node_fetch_1.default)(TEST_CONFIG.deleteAccountUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: TEST_CONFIG.testUserId,
            }),
        });
        console.log(`📡 Delete account endpoint responded with status: ${response.status}`);
        if (response.status === 401 || response.status === 403) {
            console.log('✅ Delete account endpoint is reachable (authentication required as expected)');
            return true;
        }
        else {
            console.log('⚠️ Unexpected response from delete account endpoint');
            return false;
        }
    }
    catch (error) {
        console.error('❌ Delete account test failed:', error instanceof Error ? error.message : String(error));
        return false;
    }
};
exports.testDeleteAccountEndpoint = testDeleteAccountEndpoint;
const testStripeWebhookSignatureVerification = async () => {
    console.log('🔐 Testing Stripe webhook signature verification...');
    try {
        // Create a test event
        const testEvent = createMockWebhookEvent('customer.subscription.updated', {
            id: 'sub_test123',
            customer: 'cus_test123',
            status: 'active',
        });
        // Test with invalid signature
        const response = await (0, node_fetch_1.default)(TEST_CONFIG.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'stripe-signature': 'invalid_signature',
            },
            body: JSON.stringify(testEvent),
        });
        if (response.status === 400) {
            console.log('✅ Webhook signature verification is working (rejected invalid signature)');
            return true;
        }
        else {
            console.log('⚠️ Webhook signature verification may not be working properly');
            return false;
        }
    }
    catch (error) {
        console.error('❌ Signature verification test failed:', error instanceof Error ? error.message : String(error));
        return false;
    }
};
exports.testStripeWebhookSignatureVerification = testStripeWebhookSignatureVerification;
const runIntegrationTests = async () => {
    console.log('🚀 Starting Stripe Integration Tests...\n');
    console.log('⚠️  Note: These tests verify endpoint connectivity and basic functionality.');
    console.log('⚠️  Full functionality testing requires valid authentication tokens.\n');
    const tests = [
        { name: 'Webhook Connectivity', fn: exports.testWebhookConnectivity },
        {
            name: 'Cancel Subscription Endpoint',
            fn: exports.testCancelSubscriptionEndpoint,
        },
        { name: 'Delete Account Endpoint', fn: exports.testDeleteAccountEndpoint },
        {
            name: 'Webhook Signature Verification',
            fn: exports.testStripeWebhookSignatureVerification,
        },
    ];
    const results = [];
    for (const test of tests) {
        console.log(`\n--- ${test.name} ---`);
        const result = await test.fn();
        results.push(result);
    }
    const passed = results.filter(Boolean).length;
    const total = results.length;
    console.log(`\n📊 Test Results: ${passed}/${total} tests passed`);
    if (passed === total) {
        console.log('🎉 All connectivity tests passed!');
        console.log('\n📋 Next Steps:');
        console.log('1. Set up Stripe webhook endpoint in Stripe Dashboard');
        console.log('2. Test with real Stripe events');
        console.log('3. Verify subscription cancellation UI');
        console.log('4. Test account deletion protection');
    }
    else {
        console.log('⚠️  Some tests failed. Check the function deployments and network connectivity.');
    }
    return passed === total;
};
exports.runIntegrationTests = runIntegrationTests;
// Run tests if called directly
if (require.main === module) {
    (0, exports.runIntegrationTests)()
        .then(() => process.exit(0))
        .catch((error) => {
        console.error('Test suite failed:', error);
        process.exit(1);
    });
}
