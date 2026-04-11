const product = { days_of_supply: null };
console.log('Test 1:', 'Excess inventory with ' + ((product.days_of_supply || 0).toFixed(1)) + ' days of supply');
console.log('Test 2:', `Excess inventory with ${(product.days_of_supply || 0).toFixed(1)} days of supply`);
