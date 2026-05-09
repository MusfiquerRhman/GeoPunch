CREATE TABLE DEPARTMENTS (
    ID UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    DEPARTMENT_NAME VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE DESIGNATIONS (
    ID UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    DESIGNATIONS VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE EMPLOYEES (
    ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ID_CARD_NO VARCHAR(50),
    NAME VARCHAR(75) NOT NULL,
    DEPARTMENT_ID UUID REFERENCES DEPARTMENTS(ID) ON DELETE RESTRICT,
    DESIGNATION_ID UUID REFERENCES DESIGNATIONS(ID) ON DELETE RESTRICT,
    PHONE_NO VARCHAR(20),
    EMAIL VARCHAR(50),
    IS_ACTIVE BOOLEAN DEFAULT TRUE
);

alter table EMPLOYEES add column company_id uuid references company (id) on delete restrict;

CREATE TABLE ATTENDANCE_RECORD (
    ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    EMPLOYEE_ID UUID REFERENCES EMPLOYEES(ID) ON DELETE RESTRICT,
    LATITUDE DOUBLE PRECISION NOT NULL,
    LONGITUDE DOUBLE PRECISION NOT NULL,
    SELFIE_URL TEXT NOT NULL,
    SUBMITTED_AT TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    STATUS BOOLEAN DEFAULT FALSE
);

CREATE TABLE COMPANY (
    ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    NAME VARCHAR(100) NOT NULL
);

CREATE TABLE OFFICES (
    ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    NAME VARCHAR(100) NOT NULL,
    COMPANY_ID UUID REFERENCES COMPANY (ID)
);

create table office_locations (
    ID UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address text,
    LATITUDE DOUBLE PRECISION NOT NULL,
    LONGITUDE DOUBLE PRECISION NOT NULL,
    office_id uuid references offices(id)
);

select * from office_locations where office_id = '6be4f6e6-28ea-48bc-adc1-6becdce140aa';

alter table ATTENDANCE_RECORD add column nearest_office_location uuid references office_locations(id);
alter table ATTENDANCE_RECORD add column distance float8;

SELECT *,
(
    6371000 * acos(
        cos(radians($1)) *
        cos(radians(lat)) *
        cos(radians(lng) - radians($2)) +
        sin(radians($1)) *
        sin(radians(lat))
    )
) AS distance
FROM offices
ORDER BY distance
LIMIT 1;

SELECT
    ol.LATITUDE,
    ol.LONGITUDE,
    ol.address,
    o.name,
    ol.id
FROM office_locations as ol
    inner join offices as o on o.id = ol.office_id
    inner join company as c on c.id = o.company_id
    inner join employees as e on e.company_id = c.id
where e.id = '7e852eb6-0105-445b-8cfe-285b0f90d4ce';

