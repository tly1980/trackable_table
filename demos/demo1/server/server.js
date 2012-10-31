var product_data = [
        {
            name: 'Cloth A',
            unit_price: '10.00',
            buying_price: '5.00',
            sold_count: 30
        },

        {
            name: 'Cloth B',
            unit_price: '15.00',
            buying_price: '8.00',
            sold_count: 120
        },

        {
            name: 'Shoe C',
            unit_price: '50.00',
            buying_price: '35.00',
            sold_count: 47
        },

        {
            name: 'Cloth ASDF',
            unit_price: '100.00',
            buying_price: '85.00',
            sold_count: 38
        }
];

var log_data = [{
    action: 'init',
    operator: 'someone',
    timestamp: '2012-10-12 14:30',
    description: 'initialize'
}];

var http = require('http');
http.createServer(function (req, res) {
  //console.log('req', req);
  if (req.url === '/res/product_info'){
      res.writeHead(200, {"Content-Type": "application/json"});
      res.end(JSON.stringify(product_data));

  }else if(req.url === '/res/logs'){
      res.writeHead(200, {"Content-Type": "application/json"});
      res.end(JSON.stringify(log_data));

  } else{
      res.writeHead(200, {"Content-Type": "text"});
      res.end('Hello World\n');
  }
}).listen(9999, '127.0.0.1');
console.log('Server running at http://127.0.0.1:9999/');