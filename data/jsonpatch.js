const fs = require('fs');

// Read the catalogue.json file
fs.readFile('catalogue.json', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }

  // Parse the JSON data
  const catalogue = JSON.parse(data);

  // Modify the catalogue
  catalogue[0].catalogueItems.forEach(item => {
    delete item.related;
    item.prices = item.prices.map(price => ({ value: price.value }));
  });

  // Write the modified catalogue back to the file
  fs.writeFile('simplifiedCatalogue.json', JSON.stringify(catalogue, null, 2), (err) => {
    if (err) {
      console.error(err);
      return;
    }

    console.log('Catalogue modified and saved to file');
  });
});