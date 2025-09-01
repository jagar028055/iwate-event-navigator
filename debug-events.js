#!/usr/bin/env node

// Test script to debug event collection issues
import { chromium } from 'playwright';

async function debugEventCollection() {
  console.log('🔍 Debugging event collection system...');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // Capture console logs
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    console.log(`📝 Console: ${text}`);
  });
  
  // Capture network requests
  const requests = [];
  page.on('request', request => {
    requests.push(request.url());
    console.log(`🌐 Request: ${request.url()}`);
  });
  
  try {
    await page.goto('http://localhost:5174');
    console.log('✅ Page loaded successfully');
    
    // Wait for initial load
    await page.waitForTimeout(3000);
    
    // Check if events are loaded
    const eventsCount = await page.evaluate(() => {
      const eventElements = document.querySelectorAll('[data-testid="event"], .event-card, .event');
      return eventElements.length;
    });
    console.log(`📊 Events found on page: ${eventsCount}`);
    
    // Try to trigger event loading
    const updateButton = await page.locator('button:has-text("イベント更新")').first();
    if (await updateButton.isVisible()) {
      console.log('🔄 Clicking event update button...');
      await updateButton.click();
      
      // Wait for loading to complete
      await page.waitForTimeout(10000);
      
      // Check events again
      const newEventsCount = await page.evaluate(() => {
        const eventElements = document.querySelectorAll('[data-testid="event"], .event-card, .event');
        return eventElements.length;
      });
      console.log(`📊 Events after update: ${newEventsCount}`);
    }
    
    // Test the hybrid ETL system directly
    console.log('🧪 Testing window.testHybridETL()...');
    const hybridTestResult = await page.evaluate(async () => {
      if (typeof window.testHybridETL === 'function') {
        try {
          return await window.testHybridETL();
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
      return { success: false, error: 'testHybridETL function not available' };
    });
    
    console.log('📋 Hybrid ETL test result:', hybridTestResult);
    
    // Test simple HTTP
    console.log('🔬 Testing window.testSimple()...');
    const simpleTestResult = await page.evaluate(async () => {
      if (typeof window.testSimple === 'function') {
        try {
          return await window.testSimple();
        } catch (error) {
          return { success: false, error: error.message };
        }
      }
      return { success: false, error: 'testSimple function not available' };
    });
    
    console.log('📋 Simple test result:', simpleTestResult);
    
    // Check for error messages
    const errorMessages = await page.locator('.text-red-700, .bg-red-100, [class*="error"]').count();
    console.log(`❌ Error messages on page: ${errorMessages}`);
    
    if (errorMessages > 0) {
      const errorTexts = await page.locator('.text-red-700, .bg-red-100, [class*="error"]').allTextContents();
      console.log('🚨 Error messages:', errorTexts);
    }
    
    // Summary
    console.log('\n📊 Debug Summary:');
    console.log(`- Events on page: ${eventsCount}`);
    console.log(`- Console logs: ${logs.length}`);
    console.log(`- Network requests: ${requests.length}`);
    console.log(`- Error messages: ${errorMessages}`);
    console.log(`- Hybrid ETL test: ${hybridTestResult.success ? 'PASS' : 'FAIL'}`);
    console.log(`- Simple test: ${simpleTestResult.success ? 'PASS' : 'FAIL'}`);
    
    // Keep browser open for manual inspection
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  } finally {
    await browser.close();
  }
}

debugEventCollection();