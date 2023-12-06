// Import necessary modules
const express = require('express');
const path = require('path');
const ejs = require('ejs');
const dotenv = require('dotenv');
const moment = require('moment');

// Configure environment variables
dotenv.config();

// Extract environment variables
const ENV_VARIABLES = {
    dbHost: process.env.DATABASE_HOST,
    dbUser: process.env.DATABASE_USER,
    dbPassword: process.env.DATABASE_PASSWORD,
    dbName: process.env.DATABASE_NAME,
    appPort: process.env.PORT || 3000,
};

// Create an instance of Express
const app = express();

//connect PGAdmin
const knex = require('knex')({
    client: 'pg',
    connection: {
        host: process.env.RDS_HOSTNAME || 'provomentalhealth.cgrlbkhl90jg.us-east-1.rds.amazonaws.com',
        user: process.env.RDS_USERNAME || 'postgres',
        password: process.env.RDS_PASSWORD || 'intexadmin',
        database: process.env.RDS_DB_NAME || 'intexdb',
        port: process.env.RDS_PORT || 5432,
        ssl: process.env.DB_SSL ? {rejectedUnauthorized: false} : false
    }
})

// Set up middleware
app.use(express.urlencoded({ extended: true }));
app.use('/content', express.static(path.join(__dirname, 'content')));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

// Define routes

// Landing Page
app.get('/', (req, res) => {
    res.render('landingpage');
});

app.get('/account', (req, res) => {
    res.render('account'); 
});
  
  app.get('/ourdata', (req, res) => {
    res.render('ourdata'); 
  });
  
  app.get('/survey', (req, res) => {
    res.render('survey'); 
  });

// Create account
app.get('/createaccount', (req, res) => {
    res.render('createaccount'); 
});

app.post('/createaccount', async (req, res) => {
    knex('userstorage').insert({
        Username: req.body.username,
        Password: req.body.password
    });
});

//login page
app.get('/loginpage', (req, res) => {
    res.render('loginpage'); // Render your login form
});

app.post('/loginpage', async (req, res) => {
    var user = await knex('userstorage')
        .where({
          Username: req.body.username,
          Password: req.body.password,
        })
        .first();
  
      if (user) {
        // Set a cookie to indicate the user is logged in
        res.cookie('loggedIn', 'yes');
  
        res.render('report');
      } 
      else {
        res.send('Your username and/or password are incorrect.');
      }
    });


//here is a random note to test
//Hi!
// Report Page
app.get('/report', (req, res) => {
    knex.select().from("provoID").then(provoID => {
        res.render('report', {fulldata: provoID});
    });
});

// Submitting the survey
app.post('/submitSurvey', async (req, res) => {
    // Get the current date and time
    var currentDate = moment().format('MM-DD-YYYY');
    var currentTime = moment().format('HH:mm:ss');

    // Define a mapping between selectedPlatform and SocialMediaNum
    const platformToNum = {
        'Facebook': 1,
        'Twitter': 2,
        'Instagram': 3,
        'YouTube': 4,
        'Discord': 5,
        'Reddit': 6,
        'Pinterest': 7,
        'TikTok': 8,
        // Add more platforms as needed
    };

    // Assuming SMPlatforms is an array from the request body
    for (const selectedPlatform of req.body.SMPlatforms) {
        // Get the corresponding SocialMediaNum based on the selected platform
        const socialMediaNum = platformToNum[selectedPlatform];

        // Insert data into the database using knex for each selected social media platform
        await knex('provoID').insert({
            ParticipantID: req.body.participantID,
            Date: currentDate,
            Time: currentTime,
            Age: req.body.age,
            Gender: req.body.gender,
            RelationshipStatus: req.body.relationshipStatus,
            OccupationStatus: req.body.occupationStatus,
            Organization: req.body.affiliatedOrganizations.join(', '),
            DoYouUseSocialMedia: req.body.useSocialMedia,
            SMPlatforms: selectedPlatform, // Inserting one platform at a time
            SocialMediaNum: socialMediaNum, // Use the mapped SocialMediaNum
            AvgTime: req.body.AvgTime,
            NoSpecPurpose: req.body.NoSpecPurpose,
            HowOftDistracted: req.body.HowOftDisctracted,
            Restless: req.body.Restless,
            HowDistracted: req.body.HowDistracted,
            BotheredByWorries: req.body.BotheredByWorries,
            DiffConcentration: req.body.DiffConcentration,
            HowOftCompare: req.body.HowOftCompare,
            fCompFeelings: req.body.CompFeelings,
            OftValidation: req.body.OftValidation,
            OftDepressed: req.body.OftDepressed,
            DailyActFluctuate: req.body.DailyActFluctuate,
            SleepIssues: req.body.SleepIssues,
            DataFrom: 'Provo'
        });
    }

    res.send('Survey submitted successfully!');
});




// Start the server
const port = ENV_VARIABLES.appPort;

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
})
