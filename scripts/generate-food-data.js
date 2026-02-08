const fs = require('fs');
const path = require('path');

const csvFilePath = path.join(__dirname, '../data/food_classification.csv');
const jsonOutputDir = path.join(__dirname, '../public/data');
const jsonOutputFilePath = path.join(jsonOutputDir, 'food_data.json');

// Ensure the output directory exists
if (!fs.existsSync(jsonOutputDir)) {
  fs.mkdirSync(jsonOutputDir, { recursive: true });
}

fs.readFile(csvFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading CSV file:', err);
    process.exit(1); 
  }

  const lines = data.trim().split('\n');
  const headers = lines[0].split(',');
  const menus = [];
  const categories = {};
  const cuisineTypes = new Set(); // To store unique cuisine types

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    if (values.length !== headers.length) {
        console.warn(`Skipping malformed row: ${lines[i]}`);
        continue;
    }
    const menu = {};
    headers.forEach((header, index) => {
      menu[header.trim()] = values[index].trim();
    });

    // Build flat menu list, including cuisine
    menus.push({
      name: menu.food_name,
      group: menu.food_group,
      category: menu.food_category,
      cuisine: menu.cuisine, // Add cuisine
    });

    // Build hierarchical categories (food_group -> food_category)
    if (!categories[menu.food_group]) {
      categories[menu.food_group] = new Set();
    }
    categories[menu.food_group].add(menu.food_category);

    // Collect unique cuisine types
    if (menu.cuisine) {
      cuisineTypes.add(menu.cuisine);
    }
  }

  // Convert Sets to Arrays
  for (const group in categories) {
    categories[group] = Array.from(categories[group]);
  }

  const foodData = {
    categories: categories,
    cuisineTypes: Array.from(cuisineTypes), // Convert cuisineTypes Set to Array
    menus: menus,
  };

  fs.writeFile(jsonOutputFilePath, JSON.stringify(foodData, null, 2), 'utf8', (err) => {
    if (err) {
      console.error('Error writing JSON file:', err);
      process.exit(1); 
    }
    console.log('food_data.json generated successfully!');
  });
});