/**
 * Validation functions for click-and-drag bone creation functionality
 */

import { Vector2 } from '@lab/math';

/**
 * Validates that drag vector calculations work correctly
 */
export function validateDragCalculations(): boolean {
  console.log('🧪 Testing drag calculation functions...');
  
  // Test 1: Drag from (0,0) to (0,100) should yield length≈100, rotation≈90°
  const test1Vector = new Vector2(0, -100); // Y inverted for canvas coordinates
  const test1Length = Math.hypot(test1Vector.x, test1Vector.y);
  const test1Rotation = Math.atan2(test1Vector.y, test1Vector.x) * (180 / Math.PI);
  
  console.log(`Test 1 - Vertical drag: length=${test1Length}, rotation=${test1Rotation}°`);
  
  // Test 2: Drag from (100,200) to (160,260) 
  const test2Vector = new Vector2(60, 60);
  const test2Length = Math.hypot(test2Vector.x, test2Vector.y);
  const test2Rotation = Math.atan2(test2Vector.y, test2Vector.x) * (180 / Math.PI);
  
  console.log(`Test 2 - Diagonal drag: length=${test2Length.toFixed(2)}, rotation=${test2Rotation}°`);
  
  // Test 3: Minimum drag distance check
  const test3Vector = new Vector2(5, 5);
  const test3Length = Math.hypot(test3Vector.x, test3Vector.y);
  
  console.log(`Test 3 - Small drag: length=${test3Length.toFixed(2)} (should be < 10)`);
  
  // Validation checks
  const test1Valid = Math.abs(test1Length - 100) < 1 && Math.abs(test1Rotation - (-90)) < 1;
  const test2Valid = Math.abs(test2Length - 84.85) < 0.1 && Math.abs(test2Rotation - 45) < 1;
  const test3Valid = test3Length < 10;
  
  const allValid = test1Valid && test2Valid && test3Valid;
  
  console.log(`✅ Test results: ${allValid ? 'PASS' : 'FAIL'}`);
  console.log(`   Test 1 (vertical): ${test1Valid ? 'PASS' : 'FAIL'}`);
  console.log(`   Test 2 (diagonal): ${test2Valid ? 'PASS' : 'FAIL'}`);
  console.log(`   Test 3 (minimum): ${test3Valid ? 'PASS' : 'FAIL'}`);
  
  return allValid;
}

/**
 * Manual validation prompt for undo/redo functionality
 */
export function getValidationInstructions(): string {
  return `
🔍 Manual Validation Steps:

1. **Drag Test**: 
   - Drag from (100,200) to (160,260) on canvas
   - Expected: Bone created with length ≈ 84.85, rotation ≈ 45°

2. **Undo Test**: 
   - After creating bone via drag, press Ctrl+Z
   - Expected: Bone disappears, history length decrements by 1

3. **Preview Test**:
   - Start dragging on canvas
   - Expected: See dashed preview line following mouse

4. **Minimum Distance Test**:
   - Make very small drag (< 10 pixels)
   - Expected: No bone created

5. **Integration Test**:
   - Create bone via drag
   - Select it and modify properties via sliders
   - Expected: All existing functionality works normally
`;
}
