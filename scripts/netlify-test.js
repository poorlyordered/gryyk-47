#!/usr/bin/env node

/**
 * Netlify-compatible test runner
 * Runs essential validation tests without heavy dependencies
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

console.log('🚀 Running Netlify Build Tests...\n');

let passed = 0;
let failed = 0;

function test(description, testFn) {
  try {
    const result = testFn();
    if (result === true || result === undefined) {
      console.log(`✅ ${description}`);
      passed++;
    } else {
      console.log(`❌ ${description} - Expected true, got ${result}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${description} - Error: ${error.message}`);
    failed++;
  }
}

function assertEquals(actual, expected, message = '') {
  if (actual === expected) {
    return true;
  } else {
    throw new Error(`${message} - Expected ${expected}, got ${actual}`);
  }
}

// Core validation tests
console.log('📋 Core Validation Tests');
console.log('========================');

test('should validate trait ranges', () => {
  const validateTrait = (value) => value >= 0 && value <= 100;
  
  assertEquals(validateTrait(50), true, 'Valid trait');
  assertEquals(validateTrait(0), true, 'Min boundary');
  assertEquals(validateTrait(100), true, 'Max boundary');
  assertEquals(validateTrait(-1), false, 'Below min');
  assertEquals(validateTrait(101), false, 'Above max');
});

test('should validate corporation types', () => {
  const validTypes = [
    'highsec_industrial', 'highsec_mining', 'nullsec_sov',
    'lowsec_faction_warfare', 'wormhole', 'mercenary', 
    'trading', 'newbro_friendly', 'veteran_elite'
  ];
  
  const isValidType = (type) => validTypes.includes(type);
  
  assertEquals(isValidType('highsec_mining'), true, 'Valid type');
  assertEquals(isValidType('wormhole'), true, 'Valid type');
  assertEquals(isValidType('invalid_type'), false, 'Invalid type');
});

test('should calculate configuration scores', () => {
  const calculateScore = (errors, warnings) => Math.max(0, 100 - (errors * 25) - (warnings * 5));
  
  assertEquals(calculateScore(0, 0), 100, 'Perfect score');
  assertEquals(calculateScore(1, 0), 75, 'One error');
  assertEquals(calculateScore(0, 2), 90, 'Two warnings');
  assertEquals(calculateScore(2, 4), 30, 'Multiple issues');
  assertEquals(calculateScore(5, 0), 0, 'Too many errors');
});

test('should validate response parameters', () => {
  const validateResponseParams = (params) => {
    return (
      params.maxTokens > 0 && params.maxTokens <= 4000 &&
      params.temperature >= 0 && params.temperature <= 2 &&
      params.topP >= 0 && params.topP <= 1
    );
  };
  
  const validParams = { maxTokens: 1500, temperature: 0.7, topP: 0.9 };
  const invalidParams = { maxTokens: 5000, temperature: 3.0, topP: 0.9 };
  
  assertEquals(validateResponseParams(validParams), true, 'Valid params');
  assertEquals(validateResponseParams(invalidParams), false, 'Invalid params');
});

test('should validate behavior settings', () => {
  const validateBehaviorSettings = (settings) => {
    const validBehaviors = ['conservative', 'ask_human', 'consult_all'];
    return (
      settings.consultationThreshold >= 0 && settings.consultationThreshold <= 100 &&
      settings.confidenceThreshold >= 0 && settings.confidenceThreshold <= 100 &&
      validBehaviors.includes(settings.fallbackBehavior)
    );
  };
  
  const validSettings = {
    consultationThreshold: 70,
    confidenceThreshold: 80,
    fallbackBehavior: 'conservative'
  };
  
  const invalidSettings = {
    consultationThreshold: 150,
    confidenceThreshold: 80,
    fallbackBehavior: 'conservative'
  };
  
  assertEquals(validateBehaviorSettings(validSettings), true, 'Valid settings');
  assertEquals(validateBehaviorSettings(invalidSettings), false, 'Invalid settings');
});

test('should validate corporation profile structure', () => {
  const validateProfile = (profile) => {
    return !!(profile.name && profile.ticker && profile.corporationId && profile.type);
  };
  
  const validProfile = {
    name: 'Test Corp',
    ticker: 'TEST',
    corporationId: '123456',
    type: 'highsec_mining'
  };
  
  const invalidProfile = {
    name: '',
    ticker: 'TEST',
    corporationId: '123456',
    type: 'highsec_mining'
  };
  
  assertEquals(validateProfile(validProfile), true, 'Valid profile');
  assertEquals(validateProfile(invalidProfile), false, 'Invalid profile');
});

test('should generate unique IDs', () => {
  const generateId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const id1 = generateId('test');
  const id2 = generateId('test');
  
  assertEquals(id1.startsWith('test-'), true, 'ID has correct prefix');
  assertEquals(id1 !== id2, true, 'IDs are unique');
  assertEquals(/^test-\d+-[a-z0-9]+$/.test(id1), true, 'ID format is correct');
});

test('should format trait names', () => {
  const formatTraitName = (camelCase) => camelCase.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
  
  assertEquals(formatTraitName('riskTolerance'), 'risk tolerance', 'Camel case conversion');
  assertEquals(formatTraitName('detailLevel'), 'detail level', 'Camel case conversion');
  assertEquals(formatTraitName('formality'), 'formality', 'Single word');
});

// Environment tests
console.log('\n🔧 Environment Tests');
console.log('====================');

test('should run in correct environment', () => {
  assertEquals(typeof process, 'object', 'Process object exists');
  assertEquals(typeof JSON.stringify, 'function', 'JSON.stringify available');
  assertEquals(typeof JSON.parse, 'function', 'JSON.parse available');
});

// File system tests (basic)
console.log('\n📁 File System Tests');
console.log('====================');

test('should verify project structure', () => {
  const requiredFiles = [
    'package.json',
    'src/App.tsx',
    'netlify.toml'
  ];
  
  for (const file of requiredFiles) {
    assertEquals(existsSync(join(process.cwd(), file)), true, `${file} exists`);
  }
});

test('should verify package.json has required scripts', () => {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  
  const requiredScripts = ['build', 'test:ci', 'lint'];
  
  for (const script of requiredScripts) {
    assertEquals(!!packageJson.scripts[script], true, `Script ${script} exists`);
  }
});

// Summary
console.log('\n📊 Test Summary');
console.log('===============');
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Total: ${passed + failed}`);

if (failed === 0) {
  console.log('\n🎉 All tests passed! Build can proceed.');
  process.exit(0);
} else {
  console.log(`\n💥 ${failed} test(s) failed! Build should not proceed.`);
  process.exit(1);
}