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

  // Middleware to check if the user is logged in
const checkLoggedIn = (req, res, next) => {
    // Check the presence of the 'loggedIn' cookie
    if (req.cookies.loggedIn === 'yes') {
      // User is logged in, proceed to the next middleware or route handler
      next();
    } else {
      // User is not logged in, redirect to a login page or send an error response
      res.status(401).send('Unauthorized - Please log in.');
    }
  };
  
// Apply middleware to routes that require authentication
app.get('/createaccount', checkLoggedIn, (req, res) => {
    res.render('createaccount');
  });
  
  app.post('/createaccount', checkLoggedIn, async (req, res) => {
    // Insert data into the userstorage table
    await knex('userstorage').insert({
      Username: req.body.username,
      Password: req.body.password,
    });
  
    // Redirect to a page or send a response indicating success
    res.redirect('/createaccount-success');
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
                "DataFrom").from("provoID").where("participantID", req.params.id).then(fulldata => {
                    res.render("editUser", {fulldata: fulldata});
                }).catch( err => {
                    console.log(err);
                    res.status(500).json({err});
                });
});

app.post("/editUser", (req, res) => {
    knex("provoID").where("participantID", parseInt(req.body.ParticipantID)).update({
        ParticipantID: parseInt(req.body.ParticipantID),
        Date: req.body.Date,
        Time: req.body.Time,
        Age: parseInt(req.body.Age),
        Gender: req.body.Gender,
        RelationshipStatus: req.body.RelationshipStatus,
        OccupationStatus: req.body.OccupationStatus,
        Organization: req.body.Organization,
        DoYouUseSocialMedia: req.body.DoYouUseSocialMedia,
        SocialMediaNum: parseInt(req.body.SocialMediaNum),
        SmPlatforms: req.body.SMPlatforms,
        AvgTime: req.body.AvgTime,
        ResponseID: parseInt(req.body.ResponseID),
        NoSpecPurpose: parseInt(req.body.NoSpecPurpose),
        HowOftDisctracted: parseInt(req.body.HowOftDisctracted),
        Restless: parseInt(req.body.Restless),
        HowDistracted: parseInt(req.body.HowDistracted),
        BotheredByWorries: parseInt(req.body.BotheredByWorries),
        DiffConcentration: parseInt(req.body.DiffConcentration),
        HowOftCompare: parseInt(req.body.HowOftCompare),
        CompFeelings: parseInt(req.body.CompFeelings),
        OftValidation: parseInt(req.body.OftValidation),
        OftDepressed: parseInt(req.body.OftDepressed),
        DailyActFluctuate: parseInt(req.body.DailyActFluctuate),
        SleepIssues: parseInt(req.body.SleepIssues),
        DataFrom: req.body.DataFrom,
        
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
            Age: req.body.Age,
            Gender: req.body.Gender,
            RelationshipStatus: req.body.RelationshipStatus,
            OccupationStatus: req.body.OccupationStatus,
            Organization: req.body.Organizations.join(', '),
            DoYouUseSocialMedia: req.body.UseSocialMedia,
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
    console.log(`Server is running on ${port}`);
});
