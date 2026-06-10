-- Подключаемся к нужной БД (эта строка необязательна, если вы уже подключены)
\c medical_incident_db;

-- =====================================================
-- ТАБЛИЦЫ ДЛЯ СУЩЕСТВУЮЩЕГО ФУНКЦИОНАЛА (медицинские устройства)
-- =====================================================

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'employee',
  isApproved BOOLEAN DEFAULT false,
  position VARCHAR(255),
  department VARCHAR(255),
  phone VARCHAR(50),
  avatar VARCHAR(10),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE devices (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  category VARCHAR(100),
  ipAddress VARCHAR(45),
  macAddress VARCHAR(17),
  location VARCHAR(255),
  department VARCHAR(255),
  status VARCHAR(20) DEFAULT 'offline',
  power VARCHAR(10) DEFAULT 'off',
  lastSeen TIMESTAMP,
  manufacturer VARCHAR(255),
  model VARCHAR(255),
  serialNumber VARCHAR(100),
  temperature NUMERIC,
  cpuUsage NUMERIC,
  memoryUsage NUMERIC,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pendingUsers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'employee',
  position VARCHAR(255),
  department VARCHAR(255),
  phone VARCHAR(50),
  avatar VARCHAR(10),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  isApproved BOOLEAN DEFAULT false
);

CREATE TABLE deviceLogs (
  id SERIAL PRIMARY KEY,
  device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
  action VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  details TEXT
);

-- =====================================================
-- ТАБЛИЦЫ ДЛЯ ИНЦИДЕНТОВ БЕЗОПАСНОСТИ (из документа)
-- =====================================================

CREATE TABLE employee (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  job_title VARCHAR(100),
  contact_info TEXT
);

CREATE TABLE source (
  id SERIAL PRIMARY KEY,
  source_type VARCHAR(100) NOT NULL,
  description TEXT
);

CREATE TABLE vulnerability (
  id SERIAL PRIMARY KEY,
  vuln_type VARCHAR(100) NOT NULL,
  software_version VARCHAR(50),
  status VARCHAR(50),
  last_modified TIMESTAMP
);

CREATE TABLE incident (
  id SERIAL PRIMARY KEY,
  incident_date TIMESTAMP NOT NULL,
  incident_type VARCHAR(100) NOT NULL,
  threat_level INTEGER CHECK (threat_level BETWEEN 1 AND 5),
  status VARCHAR(50) CHECK (status IN ('Open','In Progress','Resolved','Closed')),
  description TEXT,
  source_id INTEGER REFERENCES source(id),
  employee_id INTEGER REFERENCES employee(id),
  vulnerability_id INTEGER REFERENCES vulnerability(id),
  last_modified TIMESTAMP
);

CREATE TABLE response_measure (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER REFERENCES incident(id) ON DELETE CASCADE,
  action_name VARCHAR(255) NOT NULL,
  action_date TIMESTAMP NOT NULL
);

CREATE TABLE incident_log (
  id SERIAL PRIMARY KEY,
  incident_id INTEGER NOT NULL,
  operation_type VARCHAR(10),
  old_data JSONB,
  new_data JSONB,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  changed_by INTEGER
);

-- =====================================================
-- ТРИГГЕРЫ И ФУНКЦИИ
-- =====================================================

CREATE OR REPLACE FUNCTION set_last_modified()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_modified = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_incident_last_modified
BEFORE UPDATE ON incident
FOR EACH ROW EXECUTE FUNCTION set_last_modified();

CREATE TRIGGER trg_vulnerability_last_modified
BEFORE UPDATE ON vulnerability
FOR EACH ROW EXECUTE FUNCTION set_last_modified();

CREATE OR REPLACE FUNCTION log_incident_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO incident_log(incident_id, operation_type, new_data, changed_by)
    VALUES (NEW.id, 'INSERT', row_to_json(NEW)::jsonb, NEW.employee_id);
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO incident_log(incident_id, operation_type, old_data, new_data, changed_by)
    VALUES (NEW.id, 'UPDATE', row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb, NEW.employee_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_incident
AFTER INSERT OR UPDATE ON incident
FOR EACH ROW EXECUTE FUNCTION log_incident_changes();

CREATE OR REPLACE FUNCTION enforce_threat_level()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.threat_level IS NULL OR NEW.threat_level < 1 OR NEW.threat_level > 5) THEN
    NEW.threat_level := 3;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_threat_level
BEFORE INSERT OR UPDATE ON incident
FOR EACH ROW EXECUTE FUNCTION enforce_threat_level();

CREATE OR REPLACE FUNCTION prevent_active_incident_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status NOT IN ('Closed', 'Resolved') THEN
    RAISE EXCEPTION 'Нельзя удалить инцидент в статусе %', OLD.status;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_incident_delete
BEFORE DELETE ON incident
FOR EACH ROW EXECUTE FUNCTION prevent_active_incident_delete();

CREATE OR REPLACE FUNCTION check_vulnerability_status()
RETURNS TRIGGER AS $$
DECLARE
  vuln_status VARCHAR(50);
BEGIN
  IF NEW.vulnerability_id IS NOT NULL THEN
    SELECT status INTO vuln_status FROM vulnerability WHERE id = NEW.vulnerability_id;
    IF vuln_status = 'Patched' THEN
      RAISE EXCEPTION 'Нельзя регистрировать инцидент для исправленной уязвимости (status = Patched)';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_vulnerability_status
BEFORE INSERT ON incident
FOR EACH ROW EXECUTE FUNCTION check_vulnerability_status();

-- =====================================================
-- ПОЛЬЗОВАТЕЛЬСКИЕ ФУНКЦИИ (UDF)
-- =====================================================

CREATE OR REPLACE FUNCTION get_avg_response_hours(p_emp_id INTEGER)
RETURNS NUMERIC AS $$
DECLARE
  v_avg_hours NUMERIC;
BEGIN
  SELECT COALESCE(AVG(EXTRACT(EPOCH FROM (rm.min_date - i.incident_date)) / 3600), 0)
  INTO v_avg_hours
  FROM incident i
  JOIN (
    SELECT incident_id, MIN(action_date) AS min_date
    FROM response_measure
    GROUP BY incident_id
  ) rm ON i.id = rm.incident_id
  WHERE i.employee_id = p_emp_id;
  RETURN v_avg_hours;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION is_threat_level_valid(p_inc_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_level INTEGER;
BEGIN
  SELECT threat_level INTO v_level FROM incident WHERE id = p_inc_id;
  IF v_level IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN v_level BETWEEN 1 AND 5;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_incident_count(p_start_date TIMESTAMP, p_end_date TIMESTAMP)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM incident
  WHERE incident_date BETWEEN p_start_date AND p_end_date;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_top_vulnerabilities(p_start_date TIMESTAMP, p_end_date TIMESTAMP)
RETURNS TABLE(vulnerability_type VARCHAR(100), incident_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT v.vuln_type, COUNT(i.id) AS cnt
  FROM vulnerability v
  JOIN incident i ON v.id = i.vulnerability_id
  WHERE i.incident_date BETWEEN p_start_date AND p_end_date
  GROUP BY v.vuln_type
  ORDER BY cnt DESC;
END;
$$ LANGUAGE plpgsql;
