-- VitalsEdge Database Schema
-- PostgreSQL 15+

-- Create schemas
CREATE SCHEMA IF NOT EXISTS users;
CREATE SCHEMA IF NOT EXISTS patients;
CREATE SCHEMA IF NOT EXISTS devices;
CREATE SCHEMA IF NOT EXISTS audit;

-- Users schema (doctors and clinicians)
CREATE TABLE IF NOT EXISTS users.doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    specialization VARCHAR(100),
    hospital_id UUID,
    department VARCHAR(100),
    ward VARCHAR(100),
    license_number VARCHAR(100),
    license_issuing_body VARCHAR(100),
    years_of_experience INTEGER DEFAULT 0,
    qualifications TEXT,
    biography TEXT,
    profile_image_url VARCHAR(500),
    languages TEXT[] DEFAULT ARRAY[]::TEXT[],
    services_offered TEXT[],
    consultation_fee DECIMAL(10, 2),
    service_hours VARCHAR(100),
    availability_status VARCHAR(50) DEFAULT 'AVAILABLE',
    status VARCHAR(50) DEFAULT 'PENDING_VERIFICATION',
    verified_at TIMESTAMP,
    verified_by UUID,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users.clinicians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) DEFAULT 'CLINICIAN',
    hospital_id UUID,
    department VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patients schema
CREATE TABLE IF NOT EXISTS patients.patient_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mrn VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    address JSONB DEFAULT '{}',
    emergency_contact JSONB DEFAULT '{}',
    medical_conditions TEXT[] DEFAULT ARRAY[]::TEXT[],
    allergies TEXT[] DEFAULT ARRAY[]::TEXT[],
    medications TEXT[] DEFAULT ARRAY[]::TEXT[],
    vitals_thresholds JSONB DEFAULT '{}',
    hospital_id UUID NOT NULL,
    primary_doctor_id UUID NOT NULL,
    assigned_bed VARCHAR(50),
    assigned_ward VARCHAR(100),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    enrolled_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    discharged_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vital readings table
CREATE TABLE IF NOT EXISTS patients.vital_readings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    device_id VARCHAR(100),
    heart_rate INTEGER,
    blood_pressure JSONB,
    sp_o2 DECIMAL(5, 2),
    temperature DECIMAL(4, 1),
    respiratory_rate INTEGER,
    glucose DECIMAL(6, 2),
    status VARCHAR(20) DEFAULT 'NORMAL',
    anomaly_detected BOOLEAN DEFAULT FALSE,
    anomaly_type TEXT[],
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Devices schema
CREATE TABLE IF NOT EXISTS devices.device_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id VARCHAR(100) UNIQUE NOT NULL,
    device_type VARCHAR(50) NOT NULL,
    device_name VARCHAR(100),
    manufacturer VARCHAR(100),
    serial_number VARCHAR(100),
    mac_address VARCHAR(17),
    firmware_version VARCHAR(50),
    patient_id UUID,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    battery_level INTEGER,
    signal_strength INTEGER,
    paired_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_sync TIMESTAMP,
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs schema
CREATE TABLE IF NOT EXISTS audit.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action VARCHAR(100) NOT NULL,
    user_id UUID,
    email VARCHAR(255),
    patient_id UUID,
    target_id UUID,
    target_type VARCHAR(50),
    status VARCHAR(50) NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts schema
CREATE TABLE IF NOT EXISTS patients.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    device_id VARCHAR(100),
    vital_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    value DECIMAL(10, 2) NOT NULL,
    threshold DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_at TIMESTAMP,
    acknowledged_by UUID,
    resolved_at TIMESTAMP,
    notes TEXT
);

-- Hospitals schema
CREATE TABLE IF NOT EXISTS users.hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_doctors_email ON users.doctors(email);
CREATE INDEX IF NOT EXISTS idx_doctors_hospital ON users.doctors(hospital_id);
CREATE INDEX IF NOT EXISTS idx_doctors_status ON users.doctors(status);

CREATE INDEX IF NOT EXISTS idx_patients_mrn ON patients.patient_records(mrn);
CREATE INDEX IF NOT EXISTS idx_patients_doctor ON patients.patient_records(primary_doctor_id);
CREATE INDEX IF NOT EXISTS idx_patients_hospital ON patients.patient_records(hospital_id);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients.patient_records(status);

CREATE INDEX IF NOT EXISTS idx_vitals_patient ON patients.vital_readings(patient_id);
CREATE INDEX IF NOT EXISTS idx_vitals_timestamp ON patients.vital_readings(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_devices_patient ON devices.device_registry(patient_id);
CREATE INDEX IF NOT EXISTS idx_devices_status ON devices.device_registry(status);

CREATE INDEX IF NOT EXISTS idx_audit_action ON audit.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit.audit_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_patient ON patients.alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON patients.alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_triggered ON patients.alerts(triggered_at DESC);

-- Insert default hospitals
INSERT INTO users.hospitals (id, name, address, phone, email) VALUES
    ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Maina Soko Medical Centre', 'Lusaka, Zambia', '+260211123456', 'info@mainasko.zm'),
    ('b2c3d4e5-f6a7-8901-bcde-f12345678901', 'University Teaching Hospital', 'Lusaka, Zambia', '+260211789012', 'info@uth.zm'),
    ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'Chilenje Level 1 Hospital', 'Lusaka, Zambia', '+260211345678', 'info@chilenje.zm')
ON CONFLICT (id) DO NOTHING;