const { JSDOM } = require('jsdom');

// Create a DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.navigator = dom.window.navigator;

// Simulate the issue
let value = '';
const onChange = (e) => {
  value = e.target.value;
  console.log('Value after change:', value);
};

// Simulate typing "Test Program"
const input = { value: '', addEventListener: () => {} };

input.value = 'T';
onChange({ target: input });
console.log('After "T":', value);

input.value = 'Te';
onChange({ target: input });
console.log('After "Te":', value);

input.value = 'Tes';
onChange({ target: input });
console.log('After "Tes":', value);

input.value = 'Test';
onChange({ target: input });
console.log('After "Test":', value);

input.value = 'Test ';
onChange({ target: input });
console.log('After "Test ":', value);

input.value = 'Test P';
onChange({ target: input });
console.log('After "Test P":', value);

input.value = 'Test Pr';
onChange({ target: input });
console.log('After "Test Pr":', value);

input.value = 'Test Pro';
onChange({ target: input });
console.log('After "Test Pro":', value);

input.value = 'Test Prog';
onChange({ target: input });
console.log('After "Test Prog":', value);

input.value = 'Test Progr';
onChange({ target: input });
console.log('After "Test Progr":', value);

input.value = 'Test Progra';
onChange({ target: input });
console.log('After "Test Progra":', value);

input.value = 'Test Program';
onChange({ target: input });
console.log('After "Test Program":', value);
