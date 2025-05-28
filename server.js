const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const serverless = require('serverless-http');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const errorHandler = require('./middleware/errorHandler');
const commissionRoutes = require('./routes/comission');
const withdrawalRoutes =  require('./routes/withdrawl');

require('./cron/expireUsers'); // works now

dotenv.config();

const app = express();

app.use(cors({ origin: "https://www.myteamboost.com", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

app.use('/api/auth', authRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use(errorHandler);

// Connect Mongo only once at startup
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Export handler for serverless
module.exports.handler = serverless(app);
