const elasticsearch = require('elasticsearch');
const client = new elasticsearch.Client({
    hosts: ['http://localhost:9200']
});
client.ping({
    requestTimeout: 30000,
}, function (error) {
    // at this point, eastic search is down, please check your Elasticsearch service
    if (error) {
        console.error('Elasticsearch cluster is down!');
    } else {
        console.log('Everything is ok');
    }
});

// client.indices.create({
//     index: 'scotch.io-tutorial'
// }, function (error, response, status) {
//     if (error) {
//         console.log(error);
//     } else {
//         console.log("created a new index", response);
//     }
// });

const cities = require('./cities.json');
var bulk = [];
//loop through each city and create and push two objects into the array in each loop
//first object sends the index and type you will be saving the data as
//second object is the data you want to index
cities.forEach(city => {
    bulk.push({
        index: {
            _index: "scotch.io-tutorial",
            _type: "cities_list",
        }
    })
    bulk.push(city)
})
client.bulk({ body: bulk }, function (err, response) {
    if (err) {
        console.log("Failed Bulk operation".red, err)
    } else {
        console.log("Successfully imported %s".green, cities.length);
    }
}); 