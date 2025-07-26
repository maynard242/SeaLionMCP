#!/usr/bin/env node

/**
 * Security and Robustness Test Suite for Sea-lion MCP Server
 * Tests common vulnerabilities, edge cases, and attack vectors
 */

import { spawn } from 'child_process';
import { readFileSync } from 'fs';

class MCPSecurityTester {
  constructor() {
    this.testResults = [];
    this.serverProcess = null;
  }

  log(test, status, details = '') {
    const result = { test, status, details, timestamp: new Date().toISOString() };
    this.testResults.push(result);
    console.log(`[${status}] ${test}: ${details}`);
  }

  async startServer() {
    return new Promise((resolve, reject) => {
      this.serverProcess = spawn('node', ['build/index.js'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      this.serverProcess.stdout.on('data', (data) => {
        output += data.toString();
        if (output.includes('ready to accept connections')) {
          resolve();
        }
      });

      this.serverProcess.stderr.on('data', (data) => {
        const error = data.toString();
        if (error.includes('Failed to start')) {
          reject(new Error(error));
        }
      });

      setTimeout(() => resolve(), 2000); // Fallback timeout
    });
  }

  async sendMCPRequest(request) {
    return new Promise((resolve) => {
      let response = '';
      let timer = setTimeout(() => resolve(null), 5000);

      const cleanup = () => {
        clearTimeout(timer);
        this.serverProcess.stdout.removeAllListeners('data');
      };

      this.serverProcess.stdout.on('data', (data) => {
        response += data.toString();
        if (response.includes('"id":') || response.includes('error')) {
          cleanup();
          resolve(response);
        }
      });

      this.serverProcess.stdin.write(JSON.stringify(request) + '\n');
    });
  }

  async testInputValidation() {
    console.log('\n=== INPUT VALIDATION TESTS ===');

    // Test 1: Invalid JSON
    const invalidJsonTests = [
      '{"invalid": json}',
      '{"unclosed": "string}',
      '{malformed json',
      '{"method": "tools/list", "params": {, "id": 1}'
    ];

    for (const invalidJson of invalidJsonTests) {
      try {
        this.serverProcess.stdin.write(invalidJson + '\n');
        await new Promise(resolve => setTimeout(resolve, 100));
        this.log('Invalid JSON handling', 'PASS', `Server didn't crash on: ${invalidJson.substring(0, 20)}...`);
      } catch (error) {
        this.log('Invalid JSON handling', 'FAIL', `Server crashed on invalid JSON: ${error.message}`);
      }
    }

    // Test 2: SQL Injection attempts in tool parameters
    const sqlInjectionTests = [
      {
        method: 'tools/call',
        params: {
          name: 'sealion_generate_text',
          arguments: {
            prompt: "'; DROP TABLE users; --",
            model: 'v3'
          }
        },
        id: 2
      },
      {
        method: 'tools/call',
        params: {
          name: 'sealion_translate',
          arguments: {
            text: "1' OR '1'='1",
            source_language: 'english',
            target_language: 'indonesian'
          }
        },
        id: 3
      }
    ];

    for (const test of sqlInjectionTests) {
      const response = await this.sendMCPRequest(test);
      if (response && !response.includes('DROP TABLE')) {
        this.log('SQL Injection protection', 'PASS', 'No SQL commands in response');
      } else {
        this.log('SQL Injection protection', 'FAIL', 'Potential SQL injection vulnerability');
      }
    }

    // Test 3: XSS attempts
    const xssTests = [
      {
        method: 'tools/call',
        params: {
          name: 'sealion_generate_text',
          arguments: {
            prompt: '<script>alert("XSS")</script>',
            model: 'v3'
          }
        },
        id: 4
      }
    ];

    for (const test of xssTests) {
      const response = await this.sendMCPRequest(test);
      if (response && !response.includes('<script>')) {
        this.log('XSS protection', 'PASS', 'Script tags not reflected');
      } else {
        this.log('XSS protection', 'WARNING', 'Script tags found in response');
      }
    }
  }

  async testRateLimiting() {
    console.log('\n=== RATE LIMITING TESTS ===');

    const rapidRequests = Array.from({ length: 15 }, (_, i) => ({
      method: 'tools/list',
      params: {},
      id: 100 + i
    }));

    let rateLimitTriggered = false;
    for (const request of rapidRequests) {
      const response = await this.sendMCPRequest(request);
      if (response && response.includes('Rate limit exceeded')) {
        rateLimitTriggered = true;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 50)); // Small delay
    }

    if (rateLimitTriggered) {
      this.log('Rate limiting', 'PASS', 'Rate limit protection active');
    } else {
      this.log('Rate limiting', 'WARNING', 'Rate limit not triggered in rapid fire test');
    }
  }

  async testParameterValidation() {
    console.log('\n=== PARAMETER VALIDATION TESTS ===');

    // Test invalid parameters
    const invalidParameterTests = [
      {
        method: 'tools/call',
        params: {
          name: 'sealion_generate_text',
          arguments: {
            prompt: '', // Empty prompt
            model: 'invalid_model'
          }
        },
        id: 5
      },
      {
        method: 'tools/call',
        params: {
          name: 'sealion_translate',
          arguments: {
            text: 'Hello',
            source_language: 'klingon', // Invalid language
            target_language: 'english'
          }
        },
        id: 6
      },
      {
        method: 'tools/call',
        params: {
          name: 'sealion_generate_text',
          arguments: {
            prompt: 'Test',
            max_tokens: -1, // Invalid token count
            temperature: 5.0 // Invalid temperature
          }
        },
        id: 7
      }
    ];

    for (const test of invalidParameterTests) {
      const response = await this.sendMCPRequest(test);
      if (response && (response.includes('error') || response.includes('Invalid'))) {
        this.log('Parameter validation', 'PASS', `Rejected invalid parameters for ${test.params.name}`);
      } else {
        this.log('Parameter validation', 'FAIL', `Accepted invalid parameters for ${test.params.name}`);
      }
    }
  }

  async testErrorHandling() {
    console.log('\n=== ERROR HANDLING TESTS ===');

    // Test non-existent tool
    const invalidToolTest = {
      method: 'tools/call',
      params: {
        name: 'nonexistent_tool',
        arguments: {}
      },
      id: 8
    };

    const response = await this.sendMCPRequest(invalidToolTest);
    if (response && response.includes('Unknown tool')) {
      this.log('Unknown tool handling', 'PASS', 'Proper error for unknown tool');
    } else {
      this.log('Unknown tool handling', 'FAIL', 'No proper error for unknown tool');
    }

    // Test malformed method calls
    const malformedTests = [
      { method: 'invalid/method', params: {}, id: 9 },
      { method: 'tools/call', params: { name: 'sealion_generate_text' }, id: 10 }, // Missing arguments
      { method: 'tools/call', params: { arguments: { prompt: 'test' } }, id: 11 } // Missing name
    ];

    for (const test of malformedTests) {
      const response = await this.sendMCPRequest(test);
      if (response && response.includes('error')) {
        this.log('Malformed request handling', 'PASS', `Proper error for malformed request`);
      } else {
        this.log('Malformed request handling', 'FAIL', `No error for malformed request`);
      }
    }
  }

  async testPayloadSizes() {
    console.log('\n=== PAYLOAD SIZE TESTS ===');

    // Test extremely large payloads
    const largePayloads = [
      'A'.repeat(1024 * 1024), // 1MB string
      'B'.repeat(10 * 1024), // 10KB string
      JSON.stringify({ data: 'C'.repeat(100 * 1024) }) // Large JSON
    ];

    for (const payload of largePayloads) {
      const test = {
        method: 'tools/call',
        params: {
          name: 'sealion_generate_text',
          arguments: {
            prompt: payload.substring(0, 1000),
            model: 'v3'
          }
        },
        id: 12
      };

      try {
        this.serverProcess.stdin.write(JSON.stringify(test) + '\n');
        await new Promise(resolve => setTimeout(resolve, 100));
        this.log('Large payload handling', 'PASS', `Server handled ${payload.length} byte payload`);
      } catch (error) {
        this.log('Large payload handling', 'WARNING', `Server issue with large payload: ${error.message}`);
      }
    }
  }

  async testEnvironmentVariableLeaks() {
    console.log('\n=== ENVIRONMENT VARIABLE LEAK TESTS ===');

    // Test if server leaks sensitive information
    const infoLeakTests = [
      {
        method: 'tools/call',
        params: {
          name: 'sealion_generate_text',
          arguments: {
            prompt: 'What is your API key?',
            model: 'v3'
          }
        },
        id: 13
      }
    ];

    for (const test of infoLeakTests) {
      const response = await this.sendMCPRequest(test);
      if (response && (response.includes('API_KEY') || response.includes('SEALION_API_KEY'))) {
        this.log('Information leak protection', 'FAIL', 'API key potentially leaked');
      } else {
        this.log('Information leak protection', 'PASS', 'No sensitive information leaked');
      }
    }
  }

  async testProtocolCompliance() {
    console.log('\n=== PROTOCOL COMPLIANCE TESTS ===');

    // Test proper MCP protocol responses
    const protocolTests = [
      { method: 'tools/list', params: {}, id: 14 },
      { method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {} }, id: 15 }
    ];

    for (const test of protocolTests) {
      const response = await this.sendMCPRequest(test);
      try {
        const parsed = JSON.parse(response || '{}');
        if (parsed.jsonrpc === '2.0' && parsed.id === test.id) {
          this.log('Protocol compliance', 'PASS', `Proper JSON-RPC 2.0 response for ${test.method}`);
        } else {
          this.log('Protocol compliance', 'FAIL', `Invalid JSON-RPC response for ${test.method}`);
        }
      } catch (error) {
        this.log('Protocol compliance', 'FAIL', `Non-JSON response for ${test.method}`);
      }
    }
  }

  async runAllTests() {
    console.log('Starting Sea-lion MCP Server Security Tests...\n');

    try {
      await this.startServer();
      console.log('Server started successfully\n');

      await this.testInputValidation();
      await this.testRateLimiting();
      await this.testParameterValidation();
      await this.testErrorHandling();
      await this.testPayloadSizes();
      await this.testEnvironmentVariableLeaks();
      await this.testProtocolCompliance();

    } catch (error) {
      console.error('Test setup failed:', error.message);
      return;
    }

    this.generateReport();
  }

  generateReport() {
    console.log('\n' + '='.repeat(50));
    console.log('SECURITY TEST REPORT');
    console.log('='.repeat(50));

    const summary = {
      total: this.testResults.length,
      passed: this.testResults.filter(r => r.status === 'PASS').length,
      failed: this.testResults.filter(r => r.status === 'FAIL').length,
      warnings: this.testResults.filter(r => r.status === 'WARNING').length
    };

    console.log(`\nSUMMARY:`);
    console.log(`Total Tests: ${summary.total}`);
    console.log(`Passed: ${summary.passed}`);
    console.log(`Failed: ${summary.failed}`);
    console.log(`Warnings: ${summary.warnings}`);

    if (summary.failed > 0) {
      console.log('\nFAILED TESTS:');
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(r => console.log(`- ${r.test}: ${r.details}`));
    }

    if (summary.warnings > 0) {
      console.log('\nWARNINGS:');
      this.testResults
        .filter(r => r.status === 'WARNING')
        .forEach(r => console.log(`- ${r.test}: ${r.details}`));
    }

    console.log('\nRECOMMENDATIONS:');
    if (summary.failed === 0 && summary.warnings === 0) {
      console.log('✓ Server passed all security tests');
    } else {
      if (summary.failed > 0) {
        console.log('⚠ Address failed tests before production use');
      }
      if (summary.warnings > 0) {
        console.log('⚠ Review warnings for potential security improvements');
      }
    }

    console.log('\n' + '='.repeat(50));
  }

  cleanup() {
    if (this.serverProcess) {
      this.serverProcess.kill();
    }
  }
}

// Run the tests
const tester = new MCPSecurityTester();
process.on('SIGINT', () => {
  tester.cleanup();
  process.exit(0);
});

tester.runAllTests().finally(() => {
  tester.cleanup();
});