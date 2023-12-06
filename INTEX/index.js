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
        host: process.env.RDS_HOSTNAME || 'localhost',
        user: process.env.RDS_USERNAME || 'postgres',
        password: process.env.RDS_PASSWORD || 'admin',
        database: process.env.RDS_DB_NAME || 'provomentalhealth',
        port:process.env.RDS_PORT || 5432
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

//  app.post('/createaccount', async (req, res) => {
//      const { username, password } = req.body;
//  );

//login page
app.get('/loginpage', (req, res) => {
    res.render('loginpage'); // Render your login form
});

app.post('/loginpage', async (req, res) => {
    const { username, password } = req.body;
});


// Report Page
app.get('/report', (req, res) => {
    knex.select().from("provoID").then(provoID => {
        res.render("report", {fulldata: provoID});
    });
});

// Submitting the survey
app.post('/submitSurvey', async (req, res) => {
    // Generate a unique ParticipantID (you may use a library like UUID or any other method)
    const participantID = await generateUniqueID(); // Implement this function according to your needs

    // Get the current date and time
    const currentDate = moment().format('MM-DD-YYYY');
    const currentTime = moment().format('HH:mm:ss');

    // Extract data from the form submission
    const {
        age,
        gender,
        relationshipStatus,
        occupationStatus,
        affiliatedOrganizations,
        useSocialMedia,
        whatSocialMedia,
        AvgTime,
        NoSpecPurpose,
        HowOftDisctracted,
        Restless,
        HowDistracted,
        BotheredByWorries,
        DiffConcentration,
        HowOftCompare,
        CompFeelings,
        OftValidation,
        OftDepressed,
        DailyActFluctuate,
        SleepIssues
    } = req.body;

    try {
        // Insert data into the database using knex for each selected social media platform
        for (const platform of whatSocialMedia) {
            await knex('provo_ID').insert({
                participant_id: participantID,
                date: currentDate,
                time: currentTime,
                age,
                gender,
                relationship_status: relationshipStatus,
                occupation_status: occupationStatus,
                affiliated_organizations: affiliatedOrganizations.join(', '),
                use_social_media: useSocialMedia,
                what_social_media: platform, // Inserting one platform at a time
                avg_time: AvgTime,
                no_spec_purpose: NoSpecPurpose,
                how_often_distracted: HowOftDisctracted,
                restless: Restless,
                how_distracted: HowDistracted,
                bothered_by_worries: BotheredByWorries,
                difficult_concentration: DiffConcentration,
                how_often_compare: HowOftCompare,
                feelings_about_comparisons: CompFeelings,
                how_often_validation: OftValidation,
                often_depressed: OftDepressed,
                daily_activity_fluctuate: DailyActFluctuate,
                sleep_issues: SleepIssues,
                DataFrom: 'Provo'
            });
        }

        // Respond with success message or redirect to a thank-you page
        res.send('Survey submitted successfully!');
    } catch (error) {
        // Handle errors
        console.error('Error submitting survey:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Function to generate a unique ID by finding the maximum participant_id and incrementing it
async function generateUniqueID() {
    try {
        // Query the database to find the maximum participant_id
        const maxParticipantID = await knex('provo_ID').max('participant_id as maxID').first();

        // Extract the maximum participant_id value
        const currentMaxID = maxParticipantID.maxID;

        // Generate the next participant_id by incrementing the current maximum
        const nextID = currentMaxID ? currentMaxID + 1 : 1;

        return nextID;
    } catch (error) {
        console.error('Error generating unique ID:', error);
        throw error; // You might want to handle the error according to your application's requirements
    }
}




// Start the server
const port = ENV_VARIABLES.appPort;
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
