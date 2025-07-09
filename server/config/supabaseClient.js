require('dotenv').config(); // 👈 loads variables from .env

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SERVICE_ROLE_KEY
);

module.exports = supabase;
