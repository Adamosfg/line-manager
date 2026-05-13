CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('chef', 'supervisor')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Resetting DB for V2 Feature Set Upgrade
DROP TABLE IF EXISTS reports CASCADE; 

CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    compte_rendu_date DATE NOT NULL,
    segment_famille VARCHAR(255) NOT NULL,
    declaration TEXT NOT NULL,
    heures_produites NUMERIC(5,2) NOT NULL,
    efficience NUMERIC(5,2) NOT NULL,
    effectif_present INTEGER NOT NULL,
    absence INTEGER NOT NULL,
    problem_1_type VARCHAR(100),
    problem_1_desc TEXT,
    problem_2_type VARCHAR(100),
    problem_2_desc TEXT,
    problem_3_type VARCHAR(100),
    problem_3_desc TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Default Test Users
INSERT INTO users (username, password, role) VALUES 
('test_chef', 'password123', 'chef'),
('test_super', 'password123', 'supervisor')
ON CONFLICT (username) DO NOTHING;
