/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

test('App module loads', () => {
  const AppModule = require('../App');
  expect(AppModule).toBeDefined();
});
