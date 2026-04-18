const http = require('http');

http.get('http://localhost:3000/', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    const match = data.match(/"preOrderProducts":(\[.*?\]),/);
    if (match && match[1]) {
      const items = JSON.parse(match[1]);
      console.log(`Front-page has ${items.length} pre-order products`);
      items.forEach(item => {
        console.log(` - ${item.name} | isPreOrder: ${item.isPreOrder} | releaseDate: ${item.releaseDate}`);
      });
    } else {
      console.log('Could not parse preOrderProducts from HTML payload');
    }
  });
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
