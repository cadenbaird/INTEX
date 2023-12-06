// Describe your app here
// Add your name 

// Configure environment Variables:
require("dotenv").config();

// Extract Environment Variables
const ENV_VARIABLES = {
    dbHost: process.env.DATABASE_HOST,
    dbUser: process.env.DATABASE_USER,
    dbPassword: process.env.DATABASE_PASSWORD,
    dbName: process.env.DATABASE_NAME,
    appPort: process.env.PORT || 3000 // Use PORT if set, otherwise default to 3000
};

// Define Knex Database Connection
const knex = require("knex")({
    client: "mysql",   // Alternatively for postgres use: client: "pg",
    connection: {
        host : ENV_VARIABLES.dbHost,
        user : ENV_VARIABLES.dbUser,
        password : ENV_VARIABLES.dbPassword,
        database : ENV_VARIABLES.dbName,
        port: 5432
    }
});

// Define Constants:
const path = require("path");
const port = ENV_VARIABLES.appPort;

// Define + Configure Express:
const express = require('express');
const app = express();

// Define Static File Directory
app.use(express.static("public"));

// Setup Form Access
app.use(express.urlencoded({extended: true}));

// Define EJS Engine/Location
app.set("view engine", "ejs");

// Add this line to serve static files from the 'content' folder
app.use(express.static(path.join(__dirname, '/content/css/styles.css')));

// Previous static file configuration (if any)
app.use(express.static(path.join(__dirname, 'views')));


console.log("Server Started");

// Define Routes:

// GET Request Route for 'https://www.example.com/products/123'
app.get('/products/:id', (req, res) => {
    // Pull id from URL parameter
    var id = req.params.id;
    res.send(id);
});

// GET Request Route for 'https://www.example.com/'
app.get('/', (req, res) => {
    // Data Dictionary for View
    var data = {
        productNumber: 1,
        productName: "Example Product"
    }

    res.render("landingpage", { data: data });
});

//serve the account page
app.get('/account', (req, res) => {
    res.render('account.ejs');
});

// POST Request Route for 'https://www.example.com/products'
app.post('/products', (req, res) => {
    // Pull id from request body
    var id = req.body.id;
    res.send(id);
});

// Activate Listener
app.listen(port, () => console.log("Listening Active, Server Operational"));
console.log("Starting development server at http://localhost:" + port);
