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
        Password: req.body.password,
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

app.get("/editUser/:id", (req, res) => {
    knex.select("ParticipantID",
                "Date",
                "Time",
                "Age",
                "Gender",
                "RelationshipStatus",
                "OccupationStatus",
                "Organization",
                "DoYouUseSocialMedia",
                "SocialMediaNum",
                "SMPlatforms",
                "AvgTime",
                "ResponseID",
                "NoSpecPurpose",
                "HowOftDisctracted",
                "Restless",
                "HowDistracted",
                "BotheredByWorries",
                "DiffConcentration",
                "HowOftCompare",
                "CompFeelings",
                "OftValidation",
                "OftDepressed",
                "DailyActFluctuate",
                "SleepIssues",
                "DataFrom").from("provoID").where("participantID", req.params.id).then(provoID => {
                    res.render("editUser", {fulldata: provoID});
                }).catch( err => {
                    console.log(err);
                    res.status(500).json({err});
                });
});

app.post("/editUser", (req, res) => {
    knex("provoID").where("participantID", parseInt(req.body.participantID)).update({
        participantID: parseInt(req.body.ParticipantID),
        date: req.body.Date,
        time: req.body.Time,
        age: parseInt(req.body.Age),
        gender: req.body.Gender,
        relationshipStatus: req.body.RelationshipStatus,
        occupationStatus: req.body.OccupationStatus,
        organization: req.body.Organization,
        doYouUseSocialMedia: req.body.DoYouUseSocialMedia,
        socialMediaNum: parseInt(req.body.SocialMediaNum),
        smPlatforms: req.body.SMPlatforms,
        avgTime: req.body.AvgTime,
        responseID: parseInt(req.body.ResponseID),
        noSpecPurpose: parseInt(req.body.NoSpecPurpose),
        howOftDisctracted: parseInt(req.body.HowOftDisctracted),
        restless: parseInt(req.body.Restless),
        howDistracted: parseInt(req.body.HowDistracted),
        botheredByWorries: parseInt(req.body.BotheredByWorries),
        diffConcentration: parseInt(req.body.DiffConcentration),
        howOftCompare: parseInt(req.body.HowOftCompare),
        compFeelings: parseInt(req.body.CompFeelings),
        oftValidation: parseInt(req.body.OftValidation),
        oftDepressed: parseInt(req.body.OftDepressed),
        dailyActFluctuate: parseInt(req.body.DailyActFluctuate),
        sleepIssues: parseInt(req.body.SleepIssues),
        dataFrom: req.body.DataFrom,
        
    }).then(provoID => {
        res.redirect("/report");
    });
});

app.post("/deleteCountry/:id", (req, res) => {
    knex("provoID").where("participantID", req.params.id).del().then(provoID => {
        res.redirect("/report");
    }).catch(err => {
        console.log(err);
        res.status(500).json({err});
    });
});

// Submitting the survey
app.post('/submitSurvey', async (req, res) => {
    // Get the current date and time
    var currentDate = moment().format('MM-DD-YYYY');
    var currentTime = moment().format('HH:mm:ss');
    
    // Assuming SMPlatforms is an array from the request body
    for (const selectedPlatform of req.body.SMPlatforms) {
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
            AvgTime: req.body.AvgTime,
            NoSpecPurpose: req.body.NoSpecPurpose,
            HowOftDistracted: req.body.HowOftDisctracted,
            Restless: req.body.Restless,
            HowDistracted: req.body.HowDistracted,
            BotheredByWorries: req.body.BotheredByWorries,
            DiffConcentration: req.body.DiffConcentration,
            HowOftCompare: req.body.HowOftCompare,
            CompFeelings: req.body.CompFeelings,
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
});
