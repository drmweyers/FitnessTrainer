// Simulate the reducer behavior
const initialState = {
  name: '',
  description: '',
  programType: '',
  difficultyLevel: '',
  durationWeeks: 4,
};

const handleBasicInfoChange = (state, field, value) => {
  const newState = {
    ...state,
    [field]: value,
    isDirty: true
  };
  return newState;
};

let currentState = { ...initialState };

console.log('Initial state:', currentState);

// Simulate typing "Test Program"
const testString = 'Test Program';

for (let i = 0; i < testString.length; i++) {
  const newValue = testString.substring(0, i + 1);
  currentState = handleBasicInfoChange(currentState, 'name', newValue);
  console.log('Step ' + (i + 1) + ':', currentState.name);
}

console.log('Final state:', currentState.name);
